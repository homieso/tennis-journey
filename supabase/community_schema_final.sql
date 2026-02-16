-- Tennis Journey 社区功能数据库表结构（最终修复版）
-- 修复了所有语法错误，可直接在 Supabase SQL Editor 执行

-- 开始事务
BEGIN;

-- ========================================
-- 1. 扩展现有 posts 表（添加社交功能字段）
-- ========================================

DO $$ 
BEGIN
    BEGIN ALTER TABLE posts ADD COLUMN like_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN comment_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN repost_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN media_type VARCHAR(10) DEFAULT 'none'; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN media_urls TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE posts ADD COLUMN visibility VARCHAR(15) DEFAULT 'public'; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ========================================
-- 2. 点赞表 likes
-- ========================================

DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看点赞" ON likes;
DROP POLICY IF EXISTS "用户只能创建自己的点赞" ON likes;
DROP POLICY IF EXISTS "用户只能删除自己的点赞" ON likes;

CREATE POLICY "允许所有人查看点赞" ON likes FOR SELECT USING (true);
CREATE POLICY "用户只能创建自己的点赞" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的点赞" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- ========================================
-- 3. 评论表 comments
-- ========================================

DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
DROP POLICY IF EXISTS "用户只能创建自己的评论" ON comments;
DROP POLICY IF EXISTS "用户只能更新自己的评论" ON comments;
DROP POLICY IF EXISTS "用户只能删除自己的评论" ON comments;

CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户只能创建自己的评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- ========================================
-- 4. 转发表 reposts
-- ========================================

DROP TABLE IF EXISTS reposts CASCADE;
CREATE TABLE reposts (
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
DROP POLICY IF EXISTS "用户只能创建自己的转发" ON reposts;
DROP POLICY IF EXISTS "用户只能删除自己的转发" ON reposts;

CREATE POLICY "允许所有人查看转发" ON reposts FOR SELECT USING (true);
CREATE POLICY "用户只能创建自己的转发" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的转发" ON reposts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_original_post_id ON reposts(original_post_id);

-- ========================================
-- 5. 关注表 follows
-- ========================================

DROP TABLE IF EXISTS follows CASCADE;
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许查看关注关系" ON follows;
DROP POLICY IF EXISTS "用户只能创建自己的关注" ON follows;
DROP POLICY IF EXISTS "用户只能删除自己的关注" ON follows;

CREATE POLICY "允许查看关注关系" ON follows FOR SELECT USING (true);
CREATE POLICY "用户只能创建自己的关注" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "用户只能删除自己的关注" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

-- ========================================
-- 6. 触发器函数
-- ========================================

CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    UPDATE posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
    UPDATE posts SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET repost_count = COALESCE(repost_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET repost_count = GREATEST(COALESCE(repost_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. 创建触发器
-- ========================================

DROP TRIGGER IF EXISTS trigger_update_post_like_count ON likes;
CREATE TRIGGER trigger_update_post_like_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

DROP TRIGGER IF EXISTS trigger_update_post_repost_count ON reposts;
CREATE TRIGGER trigger_update_post_repost_count
AFTER INSERT OR DELETE ON reposts
FOR EACH ROW EXECUTE FUNCTION update_post_repost_count();

-- ========================================
-- 8. 更新 posts 表的 RLS 策略
-- ========================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看公开帖子" ON posts;
DROP POLICY IF EXISTS "允许用户查看自己的帖子" ON posts;
DROP POLICY IF EXISTS "允许用户创建自己的帖子" ON posts;
DROP POLICY IF EXISTS "允许用户更新自己的帖子" ON posts;
DROP POLICY IF EXISTS "允许用户删除自己的帖子" ON posts;

-- 修复了语法错误的 DO 块
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "允许所有人查看公开帖子" ON posts
          FOR SELECT USING (COALESCE(visibility, 'public') = 'public');
    EXCEPTION WHEN undefined_column THEN
        CREATE POLICY "允许所有人查看公开帖子" ON posts
          FOR SELECT USING (true);
    END;
END $$;

CREATE POLICY "允许用户查看自己的帖子" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "允许用户创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "允许用户更新自己的帖子" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "允许用户删除自己的帖子" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 9. 初始化数据
-- ========================================

DO $$ 
BEGIN
    UPDATE posts SET like_count = 0 WHERE like_count IS NULL;
    UPDATE posts SET comment_count = 0 WHERE comment_count IS NULL;
    UPDATE posts SET repost_count = 0 WHERE repost_count IS NULL;
    UPDATE posts SET view_count = 0 WHERE view_count IS NULL;
    UPDATE posts SET media_urls = '' WHERE media_urls IS NULL;
    UPDATE posts SET media_type = 'none' WHERE media_type IS NULL;
    UPDATE posts SET visibility = 'public' WHERE visibility IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========================================
-- 10. 完成
-- ========================================

COMMIT;

SELECT '✅ 社区功能数据库表结构部署成功！' AS status;
SELECT '📊 posts表记录数: ' || COUNT(*) FROM posts;
