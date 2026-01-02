-- ============================================
-- Two-Device Session Limit: Server-Side Enforcement
-- Run this script in your Supabase SQL Editor
-- This provides defense-in-depth for the client-side logic
-- ============================================

-- Drop existing trigger/function if re-running
DROP TRIGGER IF EXISTS trigger_enforce_session_limit ON public.user_sessions;
DROP FUNCTION IF EXISTS public.enforce_session_limit();

-- Create the enforcement function
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger - fires after insert or update that sets is_active = true
CREATE TRIGGER trigger_enforce_session_limit
AFTER INSERT OR UPDATE OF is_active ON public.user_sessions
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.enforce_session_limit();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.enforce_session_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_session_limit() TO service_role;

-- ============================================
-- Verification Query (run after to confirm)
-- ============================================
-- SELECT * FROM pg_trigger WHERE tgname = 'trigger_enforce_session_limit';
