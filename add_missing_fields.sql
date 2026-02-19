-- Tennis Journey 缺失字段添加脚本
-- 用于修复球探报告生成失败问题（缺少 is_published 字段）

BEGIN;

-- 1. 为 posts 表添加 is_published 字段（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
        RAISE NOTICE '已添加 posts.is_published 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'posts.is_published 字段已存在，跳过';
    END;
END $$;

-- 2. 为 posts 表添加 published_at 字段（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
        RAISE NOTICE '已添加 posts.published_at 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'posts.published_at 字段已存在，跳过';
    END;
END $$;

-- 3. 确保 scout_reports 表有 is_published 字段（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
        RAISE NOTICE '已添加 scout_reports.is_published 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'scout_reports.is_published 字段已存在，跳过';
    END;
END $$;

-- 4. 确保 scout_reports 表有 published_at 字段（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
        RAISE NOTICE '已添加 scout_reports.published_at 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'scout_reports.published_at 字段已存在，跳过';
    END;
END $$;

-- 5. 确保 scout_reports 表有 post_id 字段（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS post_id UUID;
        RAISE NOTICE '已添加 scout_reports.post_id 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'scout_reports.post_id 字段已存在，跳过';
    END;
END $$;

-- 6. 检查 likes 表是否存在（点赞功能所需）
DO $$
BEGIN
    -- 检查 likes 表是否存在
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes') THEN
        -- 创建 likes 表
        CREATE TABLE likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, post_id) -- 一个用户对同一帖子只能点赞一次
        );
        RAISE NOTICE '已创建 likes 表';
        
        -- 添加索引
        CREATE INDEX idx_likes_user_id ON likes(user_id);
        CREATE INDEX idx_likes_post_id ON likes(post_id);
        CREATE INDEX idx_likes_created_at ON likes(created_at);
        
        -- 添加 RLS 策略
        ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
        
        -- 允许所有人查看点赞
        CREATE POLICY "允许所有人查看点赞" ON likes FOR SELECT USING (true);
        
        -- 允许用户创建自己的点赞
        CREATE POLICY "用户只能创建自己的点赞" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        -- 允许用户删除自己的点赞
        CREATE POLICY "用户只能删除自己的点赞" ON likes FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE '已为 likes 表添加 RLS 策略';
    ELSE
        RAISE NOTICE 'likes 表已存在，跳过创建';
    END IF;
END $$;

-- 7. 创建更新帖子点赞数的触发器函数
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

-- 8. 如果不存在则创建触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'likes' 
        AND trigger_name = 'trigger_update_post_like_count'
    ) THEN
        CREATE TRIGGER trigger_update_post_like_count
        AFTER INSERT OR DELETE ON likes
        FOR EACH ROW EXECUTE FUNCTION update_post_like_count();
        RAISE NOTICE '已创建点赞触发器';
    ELSE
        RAISE NOTICE '点赞触发器已存在，跳过创建';
    END IF;
END $$;

-- 9. 为管理员修复挑战状态（如果存在）
DO $$
BEGIN
    UPDATE profiles 
    SET challenge_status = 'success',
        challenge_success_date = COALESCE(challenge_success_date, NOW())
    WHERE id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
      AND (challenge_status != 'success' OR challenge_status IS NULL);
    
    IF FOUND THEN
        RAISE NOTICE '已修复管理员挑战状态';
    ELSE
        RAISE NOTICE '管理员挑战状态无需修复';
    END IF;
END $$;

COMMIT;

-- 验证结果
SELECT '✅ 数据库缺失字段修复完成' AS status;

-- 检查关键字段
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('posts', 'scout_reports', 'likes')
  AND column_name IN ('is_published', 'published_at', 'post_id')
ORDER BY table_name, column_name;

-- 检查 likes 表结构
SELECT 
    'likes' as table_name,
    COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'likes';