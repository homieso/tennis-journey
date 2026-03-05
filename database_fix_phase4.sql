-- Phase 4: Database complete check and RLS policy updates
-- This script adds is_approved field and updates RLS policies for permission tiers

BEGIN;

-- ========================================
-- 1. Add is_approved field to profiles table
-- ========================================

DO $$ 
BEGIN
    BEGIN 
        ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_approved column to profiles table';
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'is_approved column already exists in profiles table';
    END;
END $$;

-- Set admin and existing approved users to true
UPDATE profiles SET is_approved = true WHERE id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c';

-- Also set is_approved = true for existing users who have completed the 7-day challenge
UPDATE profiles 
SET is_approved = true 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM scout_reports 
  WHERE generated_at IS NOT NULL
);

-- ========================================
-- 2. Update posts table RLS policies for permission tiers
-- ========================================

-- Ensure posts table has RLS enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "posts_write_approved" ON posts;
DROP POLICY IF EXISTS "用户只能创建自己的帖子" ON posts;

-- Create new INSERT policy that requires is_approved = true
CREATE POLICY "posts_write_approved" ON posts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- Keep existing SELECT policy (allow everyone to read)
DROP POLICY IF EXISTS "允许所有人读取帖子" ON posts;
CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);

-- Update policy for UPDATE (users can only update their own posts if approved)
DROP POLICY IF EXISTS "作者可更新自己的帖子" ON posts;
CREATE POLICY "posts_update_own" ON posts 
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- Update policy for DELETE (users can only delete their own posts if approved)
DROP POLICY IF EXISTS "作者可删除自己的帖子" ON posts;
CREATE POLICY "posts_delete_own" ON posts 
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- ========================================
-- 3. Update comments table RLS policies for permission tiers
-- ========================================

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "comments_write_approved" ON comments;
DROP POLICY IF EXISTS "用户只能创建自己的评论" ON comments;

-- Create new INSERT policy that requires is_approved = true
CREATE POLICY "comments_write_approved" ON comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- Keep existing SELECT policy
DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
CREATE POLICY "comments_read_all" ON comments FOR SELECT USING (true);

-- Update UPDATE policy
DROP POLICY IF EXISTS "用户只能更新自己的评论" ON comments;
CREATE POLICY "comments_update_own" ON comments 
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- Update DELETE policy  
DROP POLICY IF EXISTS "用户只能删除自己的评论" ON comments;
CREATE POLICY "comments_delete_own" ON comments 
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- ========================================
-- 4. Update reposts table RLS policies for permission tiers
-- ========================================

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "reposts_write_approved" ON reposts;
DROP POLICY IF EXISTS "用户只能创建自己的转发" ON reposts;

-- Create new INSERT policy that requires is_approved = true
CREATE POLICY "reposts_write_approved" ON reposts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- Keep existing SELECT policy
DROP POLICY IF EXISTS "允许所有人查看转发" ON reposts;
CREATE POLICY "reposts_read_all" ON reposts FOR SELECT USING (true);

-- Update DELETE policy
DROP POLICY IF EXISTS "用户只能删除自己的转发" ON reposts;
CREATE POLICY "reposts_delete_own" ON reposts 
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- ========================================
-- 5. Update profiles table RLS policies
-- ========================================

-- Ensure profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_write_own" ON profiles;

-- Create new policies
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- 6. Add trigger to auto-approve users after their first post
-- ========================================

-- Create function to auto-approve user after first post
CREATE OR REPLACE FUNCTION auto_approve_user_after_first_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is user's first post
  IF NOT EXISTS (
    SELECT 1 FROM posts 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id
  ) THEN
    -- Auto-approve the user
    UPDATE profiles 
    SET is_approved = true 
    WHERE id = NEW.user_id;
    
    RAISE NOTICE 'Auto-approved user % after first post', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS auto_approve_after_first_post ON posts;

-- Create trigger
CREATE TRIGGER auto_approve_after_first_post
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_user_after_first_post();

COMMIT;

-- ========================================
-- 7. Verification queries
-- ========================================

-- Check if is_approved column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_approved';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('posts', 'comments', 'reposts', 'profiles')
ORDER BY tablename, policyname;

-- Count approved vs unapproved users
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_users,
  COUNT(CASE WHEN is_approved = false OR is_approved IS NULL THEN 1 END) as unapproved_users
FROM profiles;