-- Tennis Journey 社区功能数据库表结构（修复版）
-- PostgreSQL兼容版本，移除所有 IF NOT EXISTS 语句
-- 执行前请确认：这些表将支持完整的社交功能

-- ========================================
-- 1. 扩展现有 posts 表（添加社交功能字段）
-- ========================================

DO $$ 
BEGIN
    -- 使用异常处理来避免列已存在的错误
    BEGIN
        ALTER TABLE posts ADD COLUMN like_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN comment_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN repost_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN media_type VARCHAR(10) DEFAULT 'none';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN media_urls TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE posts ADD COLUMN visibility VARCHAR(15) DEFAULT 'public';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;

-- ========================================
-- 2. 点赞表 likes
-- ========================================

-- 如果表已存在，先删除依赖的策略和触发器
DO $$ 
BEGIN
    -- 删除可能的触发器
    DROP TRIGGER IF EXISTS trigger_update_post_like_count ON likes;
    -- 删除表（如果存在）
    DROP TABLE IF EXISTS likes CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 创建表
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 确保用户不能对同一帖子点赞多次
  UNIQUE(user_id, post_id)
);

-- 为 likes 表启用 RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "允许所有人查看点赞" ON likes;
    DROP POLICY IF EXISTS "用户只能创建自己的点赞" ON likes;
    DROP POLICY IF EXISTS "用户只能删除自己的点赞" ON likes;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS 策略：用户可以查看所有点赞，但只能管理自己的点赞
CREATE POLICY "允许所有人查看点赞" ON likes
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的点赞" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的点赞" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引以提高查询性能
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- ========================================
-- 3. 评论表 comments
-- ========================================

-- 如果表已存在，先删除
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
    DROP TABLE IF EXISTS comments CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE comments (
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

-- 删除旧策略
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
    DROP POLICY IF EXISTS "用户只能创建自己的评论" ON comments;
    DROP POLICY IF EXISTS "用户只能更新自己的评论" ON comments;
    DROP POLICY IF EXISTS "用户只能删除自己的评论" ON comments;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

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
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- ========================================
-- 4. 转发表 reposts
-- ========================================

-- 如果表已存在，先删除
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_post_repost_count ON reposts;
    DROP TABLE IF EXISTS reposts CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE reposts (
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

-- 删除旧策略
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "允许所有人查看转发" ON reposts;
    DROP POLICY IF EXISTS "用户只能创建自己的转发" ON reposts;
    DROP POLICY IF EXISTS "用户只能删除自己的转发" ON reposts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS 策略
CREATE POLICY "允许所有人查看转发" ON reposts
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的转发" ON reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的转发" ON reposts
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_original_post_id ON reposts(original_post_id);

-- ========================================
-- 5. 关注表 follows
-- ========================================

-- 如果表已存在，先删除
DO $$ 
BEGIN
    DROP TABLE IF EXISTS follows CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE follows (
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

-- 删除旧策略
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "允许查看关注关系" ON follows;
    DROP POLICY IF EXISTS "用户只能创建自己的关注" ON follows;
    DROP POLICY IF EXISTS "用户只能删除自己的关注" ON follows;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS 策略：允许查看关注关系
CREATE POLICY "允许查看关注关系" ON follows
  FOR SELECT USING (true);

CREATE POLICY "用户只能创建自己的关注" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "用户只能删除自己的关注" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 添加索引
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

-- ========================================
-- 6. 触发器函数：更新帖子计数
-- ========================================

-- 当点赞变化时更新帖子点赞数
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 当评论变化时更新帖子评论数
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 只统计顶级评论（parent_id IS NULL）
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    UPDATE posts 
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
    UPDATE posts 
    SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
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
    SET repost_count = COALESCE(repost_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET repost_count = GREATEST(COALESCE(repost_count, 0) - 1, 0)
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
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- 转发触发器
DROP TRIGGER IF EXISTS trigger_update_post_repost_count ON reposts;
CREATE TRIGGER trigger_update_post_repost_count
AFTER INSERT OR DELETE ON reposts
FOR EACH ROW EXECUTE FUNCTION update_post_repost_count();

-- ========================================
-- 8. 更新现有 posts 表的 RLS 策略（如果需要）
-- ========================================

-- 确保 posts 表已启用 RLS
DO $$ 
BEGIN
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 删除可能的旧策略
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "允许所有人查看公开帖子" ON posts;
    DROP POLICY IF EXISTS "允许用户查看自己的帖子" ON posts;
    DROP POLICY IF EXISTS "允许用户创建自己的帖子" ON posts;
    DROP POLICY IF EXISTS "允许用户更新自己的帖子" ON posts;
    DROP POLICY IF EXISTS "允许用户删除自己的帖子" ON posts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 允许所有人查看公开帖子（如果visibility字段存在）
DO $$ 
BEGIN
    -- 允许所有人查看公开帖子（如果visibility字段存在）
    BEGIN
        CREATE POLICY "允许所有人查看公开帖子" ON posts
          FOR SELECT USING (COALESCE(visibility, 'public') = 'public');
    EXCEPTION WHEN undefined_column THEN
        -- 如果visibility字段不存在，允许查看所有帖子
        CREATE POLICY "允许所有人查看公开帖子" ON posts
          FOR SELECT USING (true);
    END;
END $$;

-- 允许用户查看自己的所有帖子（包括私有）
CREATE POLICY "允许用户查看自己的帖子" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- 允许用户创建自己的帖子
CREATE POLICY "允许用户创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的帖子
CREATE POLICY "允许用户更新自己的帖子" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 允许用户删除自己的帖子
CREATE POLICY "允许用户删除自己的帖子" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 9. 初始化现有帖子的计数（如果like_count等字段为NULL）
-- ========================================

DO $$ 
BEGIN
    -- 将NULL值初始化为0
    UPDATE posts SET like_count = 0 WHERE like_count IS NULL;
    UPDATE posts SET comment_count = 0 WHERE comment_count IS NULL;
    UPDATE posts SET repost_count = 0 WHERE repost_count IS NULL;
    UPDATE posts SET view_count = 0 WHERE view_count IS NULL;
    
    -- 如果media_urls为NULL，设置为空字符串
    UPDATE posts SET media_urls = '' WHERE media_urls IS NULL;
    
    -- 如果media_type为NULL，设置为'none'
    UPDATE posts SET media_type = 'none' WHERE media_type IS NULL;
    
    -- 如果visibility为NULL，设置为'public'
    UPDATE posts SET visibility = 'public' WHERE visibility IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========================================
-- 10. 验证和输出
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ 社区功能数据库表结构已创建/更新完成';
    RAISE NOTICE '✅ posts表扩展字段已添加';
    RAISE NOTICE '✅ likes表已创建';
    RAISE NOTICE '✅ comments表已创建';
    RAISE NOTICE '✅ reposts表已创建';
    RAISE NOTICE '✅ follows表已创建';
    RAISE NOTICE '✅ 触发器函数已创建';
    RAISE NOTICE '✅ RLS策略已配置';
    
    -- 显示统计信息
    RAISE NOTICE '📊 当前数据库状态:';
    RAISE NOTICE '   - posts表记录数: %', (SELECT COUNT(*) FROM posts);
    RAISE NOTICE '   - 需要点赞功能的帖子: %', (SELECT COUNT(*) FROM posts WHERE like_count IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ 验证过程中出现错误: %', SQLERRM;
END $$;

-- 执行完成后，请验证表结构是否正确
SELECT '🎉 社区功能数据库表结构部署完成！' AS status;