-- Phase 2.1: Add is_approved field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Set admin and existing approved users to true
UPDATE profiles SET is_approved = true WHERE id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c';

-- Also set is_approved = true for existing users who have completed the 7-day challenge
-- (This is a placeholder - you might want to implement a more sophisticated logic)
UPDATE profiles 
SET is_approved = true 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM scout_reports 
  WHERE generated_at IS NOT NULL
);