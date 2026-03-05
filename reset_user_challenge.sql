-- 7天挑战机制修复 - 用户数据清理脚本
-- 处理 yumilishiyu@163.com 和 31830347@qq.com 的挑战重置

-- 1. 首先查看 yumilishiyu@163.com 的用户ID和当前状态
SELECT 
  u.id as user_id,
  u.email,
  p.challenge_status,
  p.challenge_start_date,
  p.challenge_success_date,
  COUNT(dl.id) as total_logs,
  SUM(CASE WHEN dl.status = 'approved' THEN 1 ELSE 0 END) as approved_logs,
  SUM(CASE WHEN dl.status = 'pending' THEN 1 ELSE 0 END) as pending_logs
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN daily_logs dl ON u.id = dl.user_id
WHERE u.email IN ('yumilishiyu@163.com', '31830347@qq.com')
GROUP BY u.id, u.email, p.challenge_status, p.challenge_start_date, p.challenge_success_date;

-- 2. 查看 yumilishiyu@163.com 的所有打卡记录
SELECT 
  dl.id,
  dl.log_date,
  dl.status,
  dl.text_content,
  dl.image_urls,
  dl.created_at
FROM daily_logs dl
JOIN auth.users u ON dl.user_id = u.id
WHERE u.email = 'yumilishiyu@163.com'
ORDER BY dl.log_date;

-- 3. 查看 31830347@qq.com 的所有打卡记录
SELECT 
  dl.id,
  dl.log_date,
  dl.status,
  dl.text_content,
  dl.image_urls,
  dl.created_at
FROM daily_logs dl
JOIN auth.users u ON dl.user_id = u.id
WHERE u.email = '31830347@qq.com'
ORDER BY dl.log_date;

-- 4. 重置 yumilishiyu@163.com 的挑战状态（删除未审核记录，重置挑战）
-- 注意：根据用户反馈，她希望重新开始挑战
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 获取用户ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'yumilishiyu@163.com';
  
  IF target_user_id IS NOT NULL THEN
    -- 删除该用户所有未审核的打卡记录（保留已通过的记录）
    DELETE FROM daily_logs 
    WHERE user_id = target_user_id 
    AND status != 'approved';
    
    -- 重置用户挑战状态
    UPDATE profiles 
    SET 
      challenge_status = 'not_started',
      challenge_start_date = NULL,
      challenge_success_date = NULL
    WHERE id = target_user_id;
    
    RAISE NOTICE '✅ 已重置 yumilishiyu@163.com 的挑战状态，删除未审核记录';
  ELSE
    RAISE NOTICE '❌ 未找到用户 yumilishiyu@163.com';
  END IF;
END $$;

-- 5. 重置 31830347@qq.com 的挑战状态（如果需要）
-- 根据实际情况决定是否执行
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 获取用户ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = '31830347@qq.com';
  
  IF target_user_id IS NOT NULL THEN
    -- 先查看用户当前状态
    SELECT challenge_status FROM profiles WHERE id = target_user_id;
    
    -- 如果用户需要重置，取消下面的注释
    /*
    -- 删除该用户所有未审核的打卡记录
    DELETE FROM daily_logs 
    WHERE user_id = target_user_id 
    AND status != 'approved';
    
    -- 重置用户挑战状态
    UPDATE profiles 
    SET 
      challenge_status = 'not_started',
      challenge_start_date = NULL,
      challenge_success_date = NULL
    WHERE id = target_user_id;
    
    RAISE NOTICE '✅ 已重置 31830347@qq.com 的挑战状态';
    */
  ELSE
    RAISE NOTICE '❌ 未找到用户 31830347@qq.com';
  END IF;
END $$;

-- 6. 验证重置结果
SELECT 
  u.email,
  p.challenge_status,
  p.challenge_start_date,
  COUNT(dl.id) as remaining_logs
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN daily_logs dl ON u.id = dl.user_id
WHERE u.email IN ('yumilishiyu@163.com', '31830347@qq.com')
GROUP BY u.email, p.challenge_status, p.challenge_start_date;