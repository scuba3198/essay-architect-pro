-- Migration: Secure feedback submissions with visitor_id check
-- Date: 2026-02-17
-- Description: Updates the 'feedback' table RLS policy to require a valid visitor_id that matches the sender's device ID.

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow anonymous feedback submission" ON feedback;

-- Create the new secure policy
CREATE POLICY "Secure anonymous feedback"
ON feedback
FOR INSERT
WITH CHECK (
  visitor_id = (SELECT get_visitor_id())
);
