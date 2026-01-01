-- ============================================
-- Two-Device Login Policy: Session Tracking
-- Run this script in your Supabase SQL Editor
-- ============================================

-- Create user_sessions table for multi-device login tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    session_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, device_fingerprint)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

-- RLS Policies: Users can only see/modify their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Grant necessary permissions
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
