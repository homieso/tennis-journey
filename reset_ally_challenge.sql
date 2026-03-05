-- 彻底清除用户 ally 的所有打卡数据并重置挑战
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. 获取 ally 的用户ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'allyhesmile@hotmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION '用户 allyhesmile@hotmail.com 未找到';
  END IF;
  
  RAISE NOTICE '✅ 找到用户ID: %', target_user_id;
  
  -- 2. 删除该用户所有的打卡记录（无论状态）
  DELETE FROM daily_logs
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '✅ 已删除用户的所有打卡记录';
  
  -- 3. 重置用户挑战状态为未开始
  UPDATE profiles
  SET 
    challenge_status = 'not_started',
    challenge_start_date = NULL,
    challenge_success_date = NULL
  WHERE id = target_user_id;
  
  RAISE NOTICE '✅ 用户挑战状态已重置为 not_started';
  
  -- 4. 验证结果
  RAISE NOTICE '📊 用户状态已完全重置，现在可以从第一天重新开始挑战';
  
END $$;

-- 5. 查看最终状态
SELECT 
  u.email,
  p.challenge_status,
  p.challenge_start_date,
  COUNT(dl.id) as log_count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN daily_logs dl ON u.id = dl.user_id
WHERE u.email = 'allyhesmile@hotmail.com'
GROUP BY u.email, p.challenge_status, p.challenge_start_date;