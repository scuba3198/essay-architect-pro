-- =============================================================================
-- FIX: Usage Tracking Secure Incrementation & RLS
-- =============================================================================

BEGIN;

-- 1. Enable RLS and set policies
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Anyone can insert usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Select own usage" ON public.usage_tracking;

-- SELECT: Anyone can view any usage (for app to function)
CREATE POLICY "Anyone can view usage" 
    ON public.usage_tracking 
    FOR SELECT 
    USING (true);

-- INSERT: Anyone can insert a new visitor record
CREATE POLICY "Anyone can insert usage" 
    ON public.usage_tracking 
    FOR INSERT 
    WITH CHECK (true);

-- UPDATE: Revoked from direct client access
REVOKE UPDATE ON public.usage_tracking FROM anon, authenticated;


-- 2. Secure Increment Function (SECURITY DEFINER)
DROP FUNCTION IF EXISTS public.increment_usage_count(text, text);
DROP FUNCTION IF EXISTS public.increment_usage_count(text, text, text);

CREATE OR REPLACE FUNCTION public.increment_usage_count(
    target_visitor_id text, 
    counter_type text DEFAULT 'ai', 
    target_alias text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_usage_count(text, text, text) TO anon, authenticated;

COMMIT;
