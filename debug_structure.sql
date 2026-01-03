--
-- PostgreSQL database dump
--

\restrict Xei74x9Xo54giU9cdx6svRhqqDJlLRagmastAzDMJNe8uG8YiljrYWNKvFZOqy6

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: check_feedback_rate_limit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_feedback_rate_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    recent_count INTEGER;
    rate_limit_window INTERVAL := '1 hour';
    max_submissions INTEGER := 5;
BEGIN
    -- Count recent submissions from this visitor
    SELECT COUNT(*) INTO recent_count
    FROM public.feedback
    WHERE visitor_id = NEW.visitor_id
      AND created_at > (NOW() - rate_limit_window);
    
    -- Block if over limit
    IF recent_count >= max_submissions THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_feedback_rate_limit() OWNER TO postgres;

--
-- Name: enforce_session_limit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_session_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
    max_devices CONSTANT INT := 2;
    active_count INT;
    sessions_to_deactivate INT;
BEGIN
    -- Only run when a session is being activated
    IF NOT NEW.is_active THEN
        RETURN NEW;
    END IF;
    
    -- Count active sessions for this user (excluding current one being inserted/updated)
    SELECT COUNT(*) INTO active_count
    FROM public.user_sessions
    WHERE user_id = NEW.user_id 
      AND is_active = true
      AND id != NEW.id;
    
    -- If at or over limit (>= 2 others + this one = 3 total), deactivate oldest
    sessions_to_deactivate := (active_count + 1) - max_devices;
    
    IF sessions_to_deactivate > 0 THEN
        -- Deactivate the oldest session(s) based on last_active_at (LRU eviction)
        UPDATE public.user_sessions
        SET is_active = false
        WHERE id IN (
            SELECT id 
            FROM public.user_sessions
            WHERE user_id = NEW.user_id 
              AND is_active = true
              AND id != NEW.id
            ORDER BY last_active_at ASC
            LIMIT sessions_to_deactivate
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_session_limit() OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: hash_session_token(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.hash_session_token(token text) RETURNS text
    LANGUAGE sql IMMUTABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    -- Using encode/digest for sha256 hashing
    SELECT encode(sha256(token::bytea), 'hex');
$$;


ALTER FUNCTION public.hash_session_token(token text) OWNER TO postgres;

--
-- Name: increment_usage_count(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_usage_count(target_visitor_id text, counter_type text DEFAULT 'ai'::text, target_alias text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.usage_tracking (visitor_id, usage_count, examiner_count, alias)
    VALUES (
        target_visitor_id, 
        CASE WHEN counter_type = 'ai' THEN 1 ELSE 0 END,
        CASE WHEN counter_type = 'examiner' THEN 1 ELSE 0 END,
        target_alias
    )
    ON CONFLICT (visitor_id)
    DO UPDATE SET 
        usage_count = CASE 
            WHEN counter_type = 'ai' THEN usage_tracking.usage_count + 1 
            ELSE usage_tracking.usage_count 
        END,
        examiner_count = CASE 
            WHEN counter_type = 'examiner' THEN usage_tracking.examiner_count + 1 
            ELSE usage_tracking.examiner_count 
        END,
        updated_at = NOW(),
        alias = COALESCE(target_alias, usage_tracking.alias);
END;
$$;


ALTER FUNCTION public.increment_usage_count(target_visitor_id text, counter_type text, target_alias text) OWNER TO postgres;

--
-- Name: sync_profile_last_seen(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_profile_last_seen() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Update the profile's last_seen_at whenever a session is updated/inserted
    UPDATE public.profiles
    SET last_seen_at = NEW.last_active_at
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_profile_last_seen() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    visitor_id text NOT NULL,
    rating integer,
    comment text,
    email text
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_email text,
    plan_name text NOT NULL,
    amount text NOT NULL,
    screenshot_url text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    device_id text,
    user_id uuid NOT NULL,
    CONSTRAINT payments_plan_name_check CHECK ((plan_name = ANY (ARRAY['Crammer''s Pass'::text, 'Preparation Pack'::text, 'Lifetime Pack'::text, 'Consultancy Killer'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text])))
);

ALTER TABLE ONLY public.payments FORCE ROW LEVEL SECURITY;


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    current_session_id text,
    last_seen_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: usage_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_tracking (
    visitor_id text NOT NULL,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    examiner_count integer DEFAULT 0,
    alias text
);

ALTER TABLE ONLY public.usage_tracking FORCE ROW LEVEL SECURITY;


ALTER TABLE public.usage_tracking OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint text NOT NULL,
    session_token text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_active_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    alias text,
    session_token_hash text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_unique UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (visitor_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_user_id_device_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_device_fingerprint_key UNIQUE (user_id, device_fingerprint);


--
-- Name: idx_feedback_visitor_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedback_visitor_created ON public.feedback USING btree (visitor_id, created_at DESC);


--
-- Name: idx_payments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);


--
-- Name: idx_payments_user_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_status_created ON public.payments USING btree (user_id, status, created_at DESC);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (user_id, is_active);


--
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions USING btree (session_token_hash);


--
-- Name: idx_user_sessions_user_active_last; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_active_last ON public.user_sessions USING btree (user_id, is_active, last_active_at DESC);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: feedback enforce_feedback_rate_limit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enforce_feedback_rate_limit BEFORE INSERT ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.check_feedback_rate_limit();


--
-- Name: user_sessions on_session_activity_update_profile; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_session_activity_update_profile AFTER INSERT OR UPDATE OF last_active_at ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.sync_profile_last_seen();


--
-- Name: user_sessions trigger_enforce_session_limit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_enforce_session_limit AFTER INSERT OR UPDATE OF is_active ON public.user_sessions FOR EACH ROW WHEN ((new.is_active = true)) EXECUTE FUNCTION public.enforce_session_limit();


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payments Admin update payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin update payments" ON public.payments FOR UPDATE TO authenticated USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean = true)) WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean = true));


--
-- Name: feedback Allow anonymous feedback submission; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anonymous feedback submission" ON public.feedback FOR INSERT WITH CHECK (true);


--
-- Name: usage_tracking Anonymous usage tracking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anonymous usage tracking" ON public.usage_tracking FOR INSERT WITH CHECK (true);


--
-- Name: usage_tracking Select own usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Select own usage" ON public.usage_tracking FOR SELECT USING (true);


--
-- Name: user_sessions Users can delete own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own sessions" ON public.user_sessions FOR DELETE USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: user_sessions Users can insert own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own sessions" ON public.user_sessions FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: user_sessions Users can update own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own sessions" ON public.user_sessions FOR UPDATE USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: user_sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: payments insert_own_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_own_payments ON public.payments FOR INSERT TO authenticated WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: profiles insert_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_own_profile ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles update_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_own_profile ON public.profiles FOR UPDATE TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: usage_tracking; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: payments view_own_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY view_own_payments ON public.payments FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: profiles view_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY view_own_profile ON public.profiles FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION check_feedback_rate_limit(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.check_feedback_rate_limit() FROM PUBLIC;
GRANT ALL ON FUNCTION public.check_feedback_rate_limit() TO anon;
GRANT ALL ON FUNCTION public.check_feedback_rate_limit() TO authenticated;
GRANT ALL ON FUNCTION public.check_feedback_rate_limit() TO service_role;


--
-- Name: FUNCTION enforce_session_limit(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enforce_session_limit() TO anon;
GRANT ALL ON FUNCTION public.enforce_session_limit() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_session_limit() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION hash_session_token(token text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hash_session_token(token text) TO anon;
GRANT ALL ON FUNCTION public.hash_session_token(token text) TO authenticated;
GRANT ALL ON FUNCTION public.hash_session_token(token text) TO service_role;


--
-- Name: FUNCTION increment_usage_count(target_visitor_id text, counter_type text, target_alias text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_usage_count(target_visitor_id text, counter_type text, target_alias text) TO anon;
GRANT ALL ON FUNCTION public.increment_usage_count(target_visitor_id text, counter_type text, target_alias text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_usage_count(target_visitor_id text, counter_type text, target_alias text) TO service_role;


--
-- Name: FUNCTION sync_profile_last_seen(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_profile_last_seen() TO anon;
GRANT ALL ON FUNCTION public.sync_profile_last_seen() TO authenticated;
GRANT ALL ON FUNCTION public.sync_profile_last_seen() TO service_role;


--
-- Name: TABLE feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feedback TO service_role;
GRANT INSERT ON TABLE public.feedback TO anon;
GRANT INSERT ON TABLE public.feedback TO authenticated;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO service_role;
GRANT SELECT,INSERT ON TABLE public.payments TO authenticated;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.profiles TO authenticated;


--
-- Name: TABLE usage_tracking; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.usage_tracking TO service_role;
GRANT SELECT,INSERT ON TABLE public.usage_tracking TO anon;
GRANT SELECT,INSERT ON TABLE public.usage_tracking TO authenticated;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_sessions TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_sessions TO authenticated;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict Xei74x9Xo54giU9cdx6svRhqqDJlLRagmastAzDMJNe8uG8YiljrYWNKvFZOqy6

