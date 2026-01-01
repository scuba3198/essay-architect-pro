-- Optimizing RLS Policies - FINAL FIX
-- Run this script in your Supabase SQL Editor.

-- Reason: 
-- 1. Remove "Duplicate Permissive Policies" by removing the old "public" access policy.
-- 2. Restrict the new policy specifically TO 'authenticated' users so it doesn't run for anon users.
-- 3. Use (select ...) wrapper to ensure performance optimization.

-- ==========================================
-- Optimize public.payments
-- ==========================================

-- 1. DROP the problematic "public" policy if it exists (allows anon access, which creates conflicts)
DROP POLICY IF EXISTS "Allow public to submit payments" ON public.payments;

-- 2. DROP our previous attempt to ensure a clean slate
DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON public.payments;

-- 3. CREATE the single, correct, optimized policy
CREATE POLICY "Allow authenticated users to insert payments" ON public.payments
AS PERMISSIVE
FOR INSERT
TO authenticated  -- <--- CRITICAL: restrict to logged-in users only
WITH CHECK (
    -- Optimize: Wrap extraction in a subquery to prevent per-row re-evaluation
    user_email = (select auth.jwt() ->> 'email')
);

-- Note: The 'profiles' policies from the previous run are likely fine, 
-- but if you still see warnings for them, let me know. 
-- This script specifically targets the 'payments' conflicts.
