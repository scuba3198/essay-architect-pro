-- Fresh-database baseline captured from the live schema on 2026-10-28.
-- Existing projects: follow supabase/README.md before using db push.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.payments (
  "id" uuid default gen_random_uuid() not null,
  "created_at" timestamp with time zone default now(),
  "user_email" text,
  "plan_name" text not null,
  "amount" text not null,
  "screenshot_url" text not null,
  "status" text default 'pending'::text not null,
  "device_id" text,
  "user_id" uuid not null,
  PRIMARY KEY (id),
  CHECK (plan_name = ANY (ARRAY['Crammer''s Pass'::text, 'Preparation Pack'::text, 'Lifetime Pack'::text, 'Consultancy Killer'::text])),
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text])),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.payments enable row level security;
CREATE INDEX payments_user_id_idx ON public.payments USING btree (user_id);

create table public.usage_tracking (
  "visitor_id" text not null,
  "usage_count" integer default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "examiner_count" integer default 0,
  "alias" text,
  PRIMARY KEY (visitor_id)
);
alter table public.usage_tracking enable row level security;


create table public.feedback (
  "id" uuid default gen_random_uuid() not null,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "visitor_id" text not null,
  "rating" integer,
  "comment" text,
  "email" text,
  PRIMARY KEY (id)
);
alter table public.feedback enable row level security;


create table public.profiles (
  "id" uuid not null,
  "email" text not null,
  "current_session_id" text,
  "last_seen_at" timestamp with time zone default now(),
  UNIQUE (email),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (id)
);
alter table public.profiles enable row level security;


create table public.user_sessions (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "device_fingerprint" text not null,
  "session_token" text not null,
  "created_at" timestamp with time zone default now(),
  "last_active_at" timestamp with time zone default now(),
  "is_active" boolean default true,
  "alias" text,
  "session_token_hash" text,
  "last_active" timestamp with time zone default now(),
  "visitor_id" text,
  PRIMARY KEY (id),
  UNIQUE (user_id, device_fingerprint),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.user_sessions enable row level security;
CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (user_id, is_active);

CREATE OR REPLACE FUNCTION public.get_visitor_id()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
BEGIN
  RETURN (current_setting('request.headers', true)::json->>'x-visitor-id');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION private.force_payment_pending()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only override status for public/authenticated users coming via API
  -- This allows Admins/Dashboard/ServiceRole to set 'approved' manually.
  IF (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$function$
;
revoke all on function private.force_payment_pending() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION private.check_feedback_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
revoke all on function private.check_feedback_rate_limit() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION private.enforce_session_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
revoke all on function private.enforce_session_limit() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION private.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$function$
;
revoke all on function private.handle_new_user() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION private.sync_profile_last_seen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Update the profile's last_seen_at whenever a session is updated/inserted
    UPDATE public.profiles
    SET last_seen_at = NEW.last_active_at
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$function$
;
revoke all on function private.sync_profile_last_seen() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION private.increment_usage_count(target_visitor_id text, counter_type text DEFAULT 'ai'::text, target_alias text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Anonymous usage is device-scoped; the header is not a trusted identity.
    IF target_visitor_id IS NULL OR target_visitor_id = ''
       OR target_visitor_id IS DISTINCT FROM public.get_visitor_id() THEN
        RAISE EXCEPTION 'Visitor ID does not match request' USING ERRCODE = '42501';
    END IF;
    IF counter_type NOT IN ('ai', 'examiner') OR counter_type IS NULL THEN
        RAISE EXCEPTION 'Invalid counter type' USING ERRCODE = '22023';
    END IF;
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
$function$
;
revoke all on function private.increment_usage_count(text, text, text) from public, anon, authenticated;

create function public.increment_usage_count(
  target_visitor_id text, counter_type text default 'ai', target_alias text default null
) returns void language sql security invoker set search_path = ''
as $$ select private.increment_usage_count(target_visitor_id, counter_type, target_alias); $$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to anon, authenticated;
revoke all on function public.get_visitor_id() from public;
revoke all on function public.increment_usage_count(text, text, text) from public;
grant execute on function public.get_visitor_id() to anon, authenticated, service_role;
grant execute on function public.increment_usage_count(text, text, text) to anon, authenticated;
grant execute on function private.increment_usage_count(text, text, text) to anon, authenticated;

create trigger on_essay_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
create trigger on_payment_insert before insert on public.payments
  for each row execute function private.force_payment_pending();
create trigger enforce_feedback_rate_limit before insert on public.feedback
  for each row execute function private.check_feedback_rate_limit();
create trigger on_session_activity_update_profile
  after insert or update of last_active_at on public.user_sessions
  for each row execute function private.sync_profile_last_seen();
create trigger trigger_enforce_session_limit
  after insert or update of is_active on public.user_sessions
  for each row when (new.is_active = true)
  execute function private.enforce_session_limit();

revoke all on public.payments from public, anon, authenticated;
grant select, insert on public.payments to authenticated;
grant select, insert, update, delete on public.payments to service_role;

revoke all on public.usage_tracking from public, anon, authenticated;
grant select, insert on public.usage_tracking to anon;
grant select, insert on public.usage_tracking to authenticated;
grant select, insert, update, delete on public.usage_tracking to service_role;

revoke all on public.feedback from public, anon, authenticated;
grant insert on public.feedback to anon;
grant insert on public.feedback to authenticated;
grant select, insert, update, delete on public.feedback to service_role;

revoke all on public.profiles from public, anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

revoke all on public.user_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.user_sessions to authenticated;
grant select, insert, update, delete on public.user_sessions to service_role;

create policy "Anonymous usage tracking" on public.usage_tracking
  for insert to anon, authenticated
  with check (visitor_id = (select public.get_visitor_id()) and visitor_id <> '' and usage_count = 0 and examiner_count = 0);
create policy "view_own_payments" on public.payments
  for select to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "insert_own_payments" on public.payments
  for insert to authenticated
  with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "insert_own_profile" on public.profiles
  for insert to authenticated
  with check ((id = ( SELECT auth.uid() AS uid)));
create policy "update_own_profile" on public.profiles
  for update to authenticated
  using ((id = ( SELECT auth.uid() AS uid)))
  with check ((id = ( SELECT auth.uid() AS uid)));
create policy "view_own_profile" on public.profiles
  for select to authenticated
  using ((id = ( SELECT auth.uid() AS uid)));
create policy "Users can view own sessions" on public.user_sessions
  for select to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can insert own sessions" on public.user_sessions
  for insert to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can update own sessions" on public.user_sessions
  for update to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can delete own sessions" on public.user_sessions
  for delete to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy "Select own usage" on public.usage_tracking
  for select to anon, authenticated
  using ((visitor_id = ( SELECT public.get_visitor_id() AS get_visitor_id)));
create policy "Secure anonymous feedback" on public.feedback
  for insert to anon, authenticated
  with check ((visitor_id = ( SELECT public.get_visitor_id() AS get_visitor_id)));

-- The current app uses getPublicUrl(), so retain the existing public bucket.
insert into storage.buckets (id, name, public)
values ('payments', 'payments', true);

create policy "Upload own payment screenshot" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payments'
    and (storage.foldername(name))[1] = 'screenshots'
    and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy "Read own payment screenshot" on storage.objects
  for select to authenticated
  using (bucket_id = 'payments'
    and (storage.foldername(name))[2] = (select auth.uid())::text);

commit;
