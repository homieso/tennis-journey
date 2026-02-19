-- ============================================
-- 数据库完整修复脚本
-- 修复所有缺失的表、RLS策略和触发器
-- ============================================

-- 1. 检查所有相关表是否存在
SELECT '检查表状态' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'posts', 'comments', 'reposts', 'likes', 'comment_likes', 'scout_reports');

-- 2. 检查 posts 表的 RLS 策略
SELECT '检查posts表RLS策略' as status;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'posts';

-- 3. 检查 comments 表是否存在及结构
SELECT '检查comments表结构' as status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'comments'
ORDER BY ordinal_position;

-- 4. 检查 reposts 表是否存在及结构
SELECT '检查reposts表结构' as status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'reposts'
ORDER BY ordinal_position;

-- ============================================
-- 5. 确保 profiles 表有正确的 RLS 策略
-- ============================================
SELECT '修复profiles表RLS策略' as status;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户可以查看自己的档案" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的档案" ON profiles;
DROP POLICY IF EXISTS "用户可以插入自己的档案" ON profiles;

CREATE POLICY "用户可以查看自己的档案" ON profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的档案" ON profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可以插入自己的档案" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许所有人查看公开档案（用于社区显示）
DROP POLICY IF EXISTS "允许所有人查看公开档案" ON profiles;
CREATE POLICY "允许所有人查看公开档案" ON profiles 
  FOR SELECT USING (true);

-- ============================================
-- 6. 创建 comments 表（如果不存在）
-- ============================================
SELECT '创建comments表' as status;

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
DROP POLICY IF EXISTS "用户可以创建自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以更新自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;

-- 创建新策略
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments 
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ============================================
-- 7. 创建评论数更新触发器
-- ============================================
SELECT '创建评论数更新触发器' as status;

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ============================================
-- 8. 确保 posts 表有正确的 RLS 策略
-- ============================================
SELECT '修复posts表RLS策略' as status;

DROP POLICY IF EXISTS "用户可以创建自己的帖子" ON posts;
DROP POLICY IF EXISTS "用户可以更新自己的帖子" ON posts;
DROP POLICY IF EXISTS "用户可以删除自己的帖子" ON posts;
DROP POLICY IF EXISTS "允许所有人查看帖子" ON posts;

CREATE POLICY "允许所有人查看帖子" ON posts FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的帖子" ON posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的帖子" ON posts 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的帖子" ON posts 
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 9. 确保 reposts 表存在且有正确策略
-- ============================================
SELECT '创建reposts表' as status;

CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看转发" ON reposts;
DROP POLICY IF EXISTS "用户可以创建自己的转发" ON reposts;
DROP POLICY IF EXISTS "用户可以删除自己的转发" ON reposts;

CREATE POLICY "允许所有人查看转发" ON reposts FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的转发" ON reposts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的转发" ON reposts 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);

-- ============================================
-- 10. 确保 likes 表存在且有正确策略
-- ============================================
SELECT '创建likes表' as status;

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看点赞" ON likes;
DROP POLICY IF EXISTS "用户可以创建自己的点赞" ON likes;
DROP POLICY IF EXISTS "用户可以删除自己的点赞" ON likes;

CREATE POLICY "允许所有人查看点赞" ON likes FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的点赞" ON likes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的点赞" ON likes 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

-- ============================================
-- 11. 确保 comment_likes 表存在且有正确策略
-- ============================================
SELECT '创建comment_likes表' as status;

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看评论点赞" ON comment_likes;
DROP POLICY IF EXISTS "用户可以创建自己的评论点赞" ON comment_likes;
DROP POLICY IF EXISTS "用户可以删除自己的评论点赞" ON comment_likes;

CREATE POLICY "允许所有人查看评论点赞" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论点赞" ON comment_likes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论点赞" ON comment_likes 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

-- ============================================
-- 12. 确保 scout_reports 表存在且有正确策略
-- ============================================
SELECT '创建scout_reports表' as status;

CREATE TABLE IF NOT EXISTS scout_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  structured_data JSONB,
  report_version VARCHAR(20),
  generation_status VARCHAR(20) DEFAULT 'pending',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scout_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看球探报告" ON scout_reports;
DROP POLICY IF EXISTS "用户可以创建自己的球探报告" ON scout_reports;
DROP POLICY IF EXISTS "用户可以更新自己的球探报告" ON scout_reports;
DROP POLICY IF EXISTS "用户可以删除自己的球探报告" ON scout_reports;

CREATE POLICY "允许所有人查看球探报告" ON scout_reports FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的球探报告" ON scout_reports 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的球探报告" ON scout_reports 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的球探报告" ON scout_reports 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scout_reports_user_id ON scout_reports(user_id);

-- ============================================
-- 13. 验证所有表结构
-- ============================================
SELECT '验证数据库状态' as status;

SELECT 
  '✅ 数据库初始化完成' as status,
  (SELECT COUNT(*) FROM comments) as comment_count,
  (SELECT COUNT(*) FROM reposts) as repost_count,
  (SELECT COUNT(*) FROM likes) as like_count,
  (SELECT COUNT(*) FROM comment_likes) as comment_like_count,
  (SELECT COUNT(*) FROM posts) as post_count,
  (SELECT COUNT(*) FROM scout_reports) as scout_report_count;