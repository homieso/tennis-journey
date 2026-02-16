-- Tennis Journey 社区功能数据库表结构
-- 执行前请确认：这些表将支持完整的社交功能

-- ========================================
-- 1. 扩展现有 posts 表（添加社交功能字段）
-- ========================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 媒体类型：image, video, none
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'none';
-- 媒体URL（多个用逗号分隔）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT DEFAULT '';

-- 原始帖子ID（如果是转发）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- 帖子可见性：public（公开）, private（私有）, friends_only（仅好友）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(15) DEFAULT 'public';

-- ========================================
-- 2. 点赞表 likes
-- ========================================

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 确保用户不能对同一帖子点赞多次
  UNIQUE(user_id, post_id)
);

-- 为 likes 表启用 RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看所有点赞，但只能管理自己的点赞
CREATE POLICY "允许所有人查看点赞" ON likes
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的点赞" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的点赞" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- ========================================
-- 3. 评论表 comments
-- ========================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 多级评论支持
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为 comments 表启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有人查看评论
CREATE POLICY "允许所有人查看评论" ON comments
  FOR SELECT USING (true);

-- 用户只能创建自己的评论
CREATE POLICY "用户只能创建自己的评论" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新/删除自己的评论
CREATE POLICY "用户只能更新自己的评论" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的评论" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ========================================
-- 4. 转发表 reposts
-- ========================================

CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT, -- 转发时的评论
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 确保用户不能对同一帖子转发多次（或允许多次？我们不允许多次转发）
  UNIQUE(user_id, post_id)
);

-- 为 reposts 表启用 RLS
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "允许所有人查看转发" ON reposts
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的转发" ON reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的转发" ON reposts
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_original_post_id ON reposts(original_post_id);

-- ========================================
-- 5. 关注表 follows
-- ========================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 不能重复关注同一用户
  UNIQUE(follower_id, followed_id),
  -- 不能关注自己
  CHECK (follower_id != followed_id)
);

-- 为 follows 表启用 RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许查看关注关系
CREATE POLICY "允许查看关注关系" ON follows
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的关注" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "用户只能删除自己的关注" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id);

-- ========================================
-- 6. 触发器函数：更新帖子计数
-- ========================================

-- 当点赞变化时更新帖子点赞数
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET like_count = like_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 当评论变化时更新帖子评论数
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 当转发变化时更新帖子转发数
CREATE OR REPLACE FUNCTION update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET repost_count = repost_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET repost_count = repost_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. 创建触发器
-- ========================================

-- 点赞触发器
DROP TRIGGER IF EXISTS trigger_update_post_like_count ON likes;
CREATE TRIGGER trigger_update_post_like_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 评论触发器（只统计顶级评论）
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW 
WHEN (NEW.parent_id IS NULL OR OLD.parent_id IS NULL) -- 只统计顶级评论
EXECUTE FUNCTION update_post_comment_count();

-- 转发触发器
DROP TRIGGER IF EXISTS trigger_update_post_repost_count ON reposts;
CREATE TRIGGER trigger_update_post_repost_count
AFTER INSERT OR DELETE ON reposts
FOR EACH ROW EXECUTE FUNCTION update_post_repost_count();

-- ========================================
-- 8. 更新现有 posts 表的 RLS 策略（如果需要）
-- ========================================

-- 确保 posts 表已启用 RLS（应该已经有了）
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看公开帖子
CREATE POLICY IF NOT EXISTS "允许所有人查看公开帖子" ON posts
  FOR SELECT USING (visibility = 'public');

-- 允许用户查看自己的所有帖子（包括私有）
CREATE POLICY IF NOT EXISTS "允许用户查看自己的帖子" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- 允许用户创建自己的帖子
CREATE POLICY IF NOT EXISTS "允许用户创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的帖子
CREATE POLICY IF NOT EXISTS "允许用户更新自己的帖子" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 允许用户删除自己的帖子
CREATE POLICY IF NOT EXISTS "允许用户删除自己的帖子" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 9. 注释说明
-- ========================================

/*
数据库表结构说明：

1. posts 表扩展字段：
   - like_count: 点赞总数
   - comment_count: 评论总数
   - repost_count: 转发总数
   - media_type: 媒体类型（image/video/none）
   - media_urls: 多个媒体URL，用逗号分隔
   - original_post_id: 如果是转发，指向原帖
   - visibility: 可见性（public/private/friends_only）

2. likes 表：
   - 记录用户对帖子的点赞
   - 唯一约束防止重复点赞

3. comments 表：
   - 支持多级评论（parent_id指向父评论）
   - 有自己的点赞数（comment_like_count）

4. reposts 表：
   - 记录用户的转发
   - 包含转发时的评论

5. follows 表：
   - 记录用户关注关系

触发器：
   - 自动更新帖子的点赞、评论、转发计数
   - 确保数据一致性

使用建议：
   1. 先在 Supabase SQL Editor 中执行此脚本
   2. 测试点赞/评论/转发功能
   3. 如有问题，检查 RLS 策略是否冲突
*/

-- 执行完成后，请验证表结构是否正确
SELECT '✅ 社区功能数据库表结构已准备就绪' AS status;