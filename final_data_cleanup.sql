-- Tennis Journey Final Data Cleanup
-- Using service_role key to clean all data except 4 preserved users

-- 1. First, get the user IDs for preserved users
DO $$ 
DECLARE
  admin_id UUID := 'dcee2e34-45f0-4506-9bac-4bdf0956273c';
  yumi_id UUID;
  jerry_id UUID;
  ally_id UUID;
BEGIN
  -- Get IDs for preserved users
  SELECT id INTO yumi_id FROM auth.users WHERE email = 'yumilishiyu@163.com';
  SELECT id INTO jerry_id FROM auth.users WHERE email = 'jerryig@163.com';
  SELECT id INTO ally_id FROM auth.users WHERE email = 'allyhesmile@hotmail.com';
  
  RAISE NOTICE 'Preserved user IDs: Admin=%, Yumi=%, Jerry=%, Ally=%', 
    admin_id, yumi_id, jerry_id, ally_id;
    
  -- 2. Reset all posts interaction counts
  RAISE NOTICE 'Resetting all posts interaction counts...';
  UPDATE posts SET 
    like_count = 0,
    comment_count = 0,
    repost_count = 0;
  
  -- 3. Clear all interaction tables
  RAISE NOTICE 'Clearing likes table...';
  DELETE FROM likes WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing comments table...';
  DELETE FROM comments WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing reposts table...';
  DELETE FROM reposts WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing comment_likes table...';
  DELETE FROM comment_likes WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing daily_logs table...';
  DELETE FROM daily_logs WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing scout_reports table...';
  DELETE FROM scout_reports WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing posts table...';
  DELETE FROM posts WHERE user_id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing profiles table...';
  DELETE FROM profiles WHERE id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE 'Clearing auth.users table...';
  DELETE FROM auth.users WHERE id NOT IN (admin_id, yumi_id, jerry_id, ally_id);
  
  RAISE NOTICE '✅ Data cleanup completed successfully!';
END $$;

-- 4. Verify cleanup results
SELECT 'auth.users' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'reposts', COUNT(*) FROM reposts
UNION ALL
SELECT 'comment_likes', COUNT(*) FROM comment_likes
UNION ALL
SELECT 'daily_logs', COUNT(*) FROM daily_logs
UNION ALL
SELECT 'scout_reports', COUNT(*) FROM scout_reports
ORDER BY table_name;