-- Optimizing RLS Policies for Performance
-- Run this script in your Supabase SQL Editor.

-- Reason: Wrapping auth functions in (select ...) prevents them from being
-- re-evaluated for every row, significantly improving query performance at scale.

-- ==========================================
-- 1. Optimize public.profiles policies
-- ==========================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING ( id = (select auth.uid()) );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK ( id = (select auth.uid()) );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING ( id = (select auth.uid()) );

-- ==========================================
-- 2. Optimize public.payments policies
-- ==========================================

-- Policy: "Allow authenticated users to insert payments"
-- Based on your application code (PaymentModal.jsx), you insert 'user_email' matching the logged-in user.
-- The optimized policy below enforces this securely.

DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON public.payments;

CREATE POLICY "Allow authenticated users to insert payments" ON public.payments
FOR INSERT WITH CHECK ( 
  -- Ensure the cached email from the JWT matches the email being inserted
  user_email = (select auth.jwt() ->> 'email') 
);
