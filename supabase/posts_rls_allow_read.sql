-- 社区帖子表 RLS：允许所有人读取帖子（未登录也可看）
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 若 posts 表尚未启用 RLS，先启用
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略（按需执行）
-- DROP POLICY IF EXISTS "允许所有人读取帖子" ON posts;

-- 允许所有用户（含 anon）读取帖子
CREATE POLICY "允许所有人读取帖子"
  ON posts
  FOR SELECT
  USING (true);

-- 仅帖子作者可更新/删除自己的帖子（若需要）
-- CREATE POLICY "作者可更新自己的帖子" ON posts FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "作者可删除自己的帖子" ON posts FOR DELETE USING (auth.uid() = user_id);
