-- FIX: Row Level Security (RLS) policy using insecure user_metadata
-- Description: Switches Admin check from user_metadata to app_metadata to prevent users from escalating their own privileges.

-- 1. Drop the insecure policy
DROP POLICY IF EXISTS "Admin update payments" ON public.payments;

-- 2. Create the secure policy
CREATE POLICY "Admin update payments" ON public.payments 
FOR UPDATE 
TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
) 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
);

-- INSTRUCTIONS:
-- 1. Run this script in your Supabase SQL Editor.
-- 2. To grant a user admin privileges, use the Supabase Dashboard -> Authentication -> Users -> [User] -> Edit App Metadata.
--    Set it to: {"is_admin": true}
--    Or use the Service Role API.
