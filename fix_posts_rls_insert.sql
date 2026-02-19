-- 修复 posts 表 RLS 策略，允许用户创建自己的帖子
-- 解决 "new row violates row-level security policy" 错误

-- 确保 posts 表已启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "允许用户创建自己的帖子" ON posts;
DROP POLICY IF EXISTS "用户只能创建自己的帖子" ON posts;

-- 创建 INSERT 策略：用户只能创建自己的帖子
CREATE POLICY "用户只能创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建 UPDATE 策略：用户只能更新自己的帖子
CREATE POLICY "用户只能更新自己的帖子" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建 DELETE 策略：用户只能删除自己的帖子
CREATE POLICY "用户只能删除自己的帖子" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- 确保 SELECT 策略存在（允许所有人读取帖子）
DROP POLICY IF EXISTS "允许所有人读取帖子" ON posts;
CREATE POLICY "允许所有人读取帖子" ON posts
  FOR SELECT USING (true);

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY policyname;