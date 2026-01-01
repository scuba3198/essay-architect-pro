-- Optimizing RLS Policies - PERSISTENT WARNING FIX
-- Run this script in your Supabase SQL Editor.

-- Reason: The linter is very strict about wrapping auth functions. 
-- We are changing the syntax to deeply isolate the auth.jwt() call.

-- ==========================================
-- Optimize public.payments
-- ==========================================

-- 1. Drop any existing policies to be clean
DROP POLICY IF EXISTS "Allow public to submit payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON public.payments;

-- 2. Create the policy with "Deeply Wrapped" syntax
CREATE POLICY "Allow authenticated users to insert payments" ON public.payments
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
    -- Strict optimization: Select the JWT first, then extract the field.
    -- This guarantees the function runs once per query.
    user_email = ( (select auth.jwt()) ->> 'email' )
);
