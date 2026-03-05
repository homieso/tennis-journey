-- 重置用户 yumilishiyu@163.com 的挑战状态
-- 执行顺序：
-- 1. 查看该用户当前状态
-- 2. 强制重置挑战（让用户可以重新开始）
-- 3. 删除该用户所有待审核的打卡记录（保留已通过的）

-- 1. 查看该用户当前状态
SELECT 
  p.id as user_id,
  p.email,
  p.challenge_status,
  p.challenge_start_date,
  COUNT(dl.id) as total_logs,
  SUM(CASE WHEN dl.status = 'approved' THEN 1 ELSE 0 END) as approved_logs,
  SUM(CASE WHEN dl.status = 'pending' THEN 1 ELSE 0 END) as pending_logs,
  SUM(CASE WHEN dl.status = 'rejected' THEN 1 ELSE 0 END) as rejected_logs
FROM profiles p
LEFT JOIN daily_logs dl ON p.id = dl.user_id
WHERE p.email = 'yumilishiyu@163.com'
GROUP BY p.id, p.email, p.challenge_status, p.challenge_start_date;

-- 2. 强制重置挑战（让用户可以重新开始）
UPDATE profiles 
SET 
  challenge_status = 'not_started',
  challenge_start_date = NULL,
  updated_at = NOW()
WHERE email = 'yumilishiyu@163.com';

-- 3. 删除该用户所有待审核的打卡记录（保留已通过的）
DELETE FROM daily_logs 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'yumilishiyu@163.com')
AND status != 'approved';

-- 4. 验证重置结果
SELECT 
  p.id as user_id,
  p.email,
  p.challenge_status,
  p.challenge_start_date,
  COUNT(dl.id) as remaining_logs,
  STRING_AGG(dl.status, ', ') as remaining_statuses
FROM profiles p
LEFT JOIN daily_logs dl ON p.id = dl.user_id
WHERE p.email = 'yumilishiyu@163.com'
GROUP BY p.id, p.email, p.challenge_status, p.challenge_start_date;