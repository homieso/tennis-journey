-- 社区功能终极修复SQL
-- 修复所有4个问题：转发逻辑、评论区、国际化、RLS

-- ========================================
-- 1. 修复转发功能相关表结构
-- ========================================

-- 确保 reposts 表存在
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为 reposts 表启用 RLS
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "允许用户查看转发" ON reposts;
DROP POLICY IF EXISTS "允许用户创建转发" ON reposts;
DROP POLICY IF EXISTS "允许用户删除自己的转发" ON reposts;

-- 创建新策略
CREATE POLICY "允许所有人查看转发" ON reposts FOR SELECT USING (true);
CREATE POLICY "允许用户创建自己的转发" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户删除自己的转发" ON reposts FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_original_post_id ON reposts(original_post_id);

-- ========================================
-- 2. 修复 comments 表结构（确保完整）
-- ========================================

-- 确保 comments 表存在
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为 comments 表启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
DROP POLICY IF EXISTS "用户可以创建自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以更新自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;

-- 创建新策略
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ========================================
-- 3. 创建评论触发器（更新帖子评论数）
-- ========================================

-- 创建更新帖子评论数的函数
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

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ========================================
-- 4. 修复 posts 表 RLS 策略（确保插入权限）
-- ========================================

-- 确保 posts 表已启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以创建自己的帖子" ON posts;
DROP POLICY IF EXISTS "用户只能创建自己的帖子" ON posts;

-- 创建 INSERT 策略：用户只能创建自己的帖子
CREATE POLICY "用户可以创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 确保其他策略存在
DROP POLICY IF EXISTS "用户只能更新自己的帖子" ON posts;
CREATE POLICY "用户只能更新自己的帖子" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能删除自己的帖子" ON posts;
CREATE POLICY "用户只能删除自己的帖子" ON posts
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "允许所有人读取帖子" ON posts;
CREATE POLICY "允许所有人读取帖子" ON posts
  FOR SELECT USING (true);

-- ========================================
-- 5. 添加缺失的字段到 posts 表
-- ========================================

-- 添加多语言内容字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content_zh') THEN
    ALTER TABLE posts ADD COLUMN content_zh TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content_en') THEN
    ALTER TABLE posts ADD COLUMN content_en TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content_zh_tw') THEN
    ALTER TABLE posts ADD COLUMN content_zh_tw TEXT;
  END IF;
END $$;

-- 更新现有数据：将 content 字段复制到多语言字段
UPDATE posts SET content_zh = content WHERE content_zh IS NULL;
UPDATE posts SET content_en = content WHERE content_en IS NULL;
UPDATE posts SET content_zh_tw = content WHERE content_zh_tw IS NULL;

-- ========================================
-- 6. 验证所有表结构
-- ========================================

SELECT 
  'posts' as table_name,
  COUNT(*) as row_count
FROM posts
UNION ALL
SELECT 
  'comments' as table_name,
  COUNT(*) as row_count
FROM comments
UNION ALL
SELECT 
  'reposts' as table_name,
  COUNT(*) as row_count
FROM reposts;

-- 显示所有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('posts', 'comments', 'reposts')
ORDER BY tablename, policyname;