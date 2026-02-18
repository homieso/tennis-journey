-- Tennis Journey 最终修复任务 SQL 脚本
-- 请在 Supabase SQL Editor 中执行此脚本
-- 执行顺序：1. 修复帖子内容 2. 修复头像上传权限

-- ========================================
-- 1. 修复帖子内容错误 + 转发按钮冗余
-- ========================================

-- 删除现有帖子（仅保留管理员帖子）
DELETE FROM posts WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c';

-- 插入正确的3条公告
INSERT INTO posts (user_id, content, created_at, like_count, comment_count, repost_count, view_count, media_type, media_urls, visibility) VALUES
('dcee2e34-45f0-4506-9bac-4bdf0956273c', '欢迎来到 Tennis Journey！🏆

本产品希望帮助每一位网球爱好者记录成长，连接全球球友。我是开发者兼社区管理人员 Homie。完成7天挑战，解锁你的专属AI球探报告！', NOW(), 0, 0, 0, 0, 'none', '', 'public'),
('dcee2e34-45f0-4506-9bac-4bdf0956273c', '新用户必读 📖

作为新用户，希望你完成7天挑战，审核通过后立即解锁专属AI球探报告以及全球网球社区交流平台。7天，遇见更好的自己。', NOW() - INTERVAL '1 minute', 0, 0, 0, 0, 'none', '', 'public'),
('dcee2e34-45f0-4506-9bac-4bdf0956273c', '社区交流规范 🤝

友善互动，分享网球心得，禁止广告与不当言论。让我们共同维护一个高质量的网球社区。', NOW() - INTERVAL '2 minutes', 0, 0, 0, 0, 'none', '', 'public');

-- 验证结果
SELECT '✅ 帖子内容修复完成' AS status;
SELECT COUNT(*) AS post_count FROM posts WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c';

-- ========================================
-- 2. 修复头像上传失败 + Storage bucket权限
-- ========================================

-- 检查 storage.buckets 表是否存在
DO $$
BEGIN
    -- 创建 avatars bucket（如果不存在）
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('avatars', 'avatars', true, false, 5242880, '{image/jpeg,image/png,image/webp,image/gif}')
    ON CONFLICT (id) DO UPDATE SET
        public = true,
        file_size_limit = 5242880,
        allowed_mime_types = '{image/jpeg,image/png,image/webp,image/gif}';
    
    -- 创建 tennis-journey bucket（用于帖子图片，如果不存在）
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('tennis-journey', 'tennis-journey', true, false, 10485760, '{image/jpeg,image/png,image/webp,image/gif,video/mp4}')
    ON CONFLICT (id) DO UPDATE SET
        public = true,
        file_size_limit = 10485760,
        allowed_mime_types = '{image/jpeg,image/png,image/webp,image/gif,video/mp4}';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.buckets 表不存在，请确保已启用Storage功能';
END $$;

-- 删除旧的RLS策略（如果存在）
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects 表不存在，跳过策略删除';
END $$;

-- 为 avatars bucket 创建RLS策略
DO $$
BEGIN
    -- 允许任何人查看头像
    CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
    
    -- 允许认证用户上传自己的头像（文件名格式: avatars/<user_id>-<timestamp>.<ext>）
    CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND (auth.role() = 'service_role' OR auth.uid()::text = (storage.foldername(name))[1])
    );
    
    -- 允许用户更新/删除自己的头像
    CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND (auth.role() = 'service_role' OR auth.uid()::text = (storage.foldername(name))[1])
    );
    
    CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND (auth.role() = 'service_role' OR auth.uid()::text = (storage.foldername(name))[1])
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '策略已存在，跳过创建';
END $$;

-- 为 tennis-journey bucket 创建RLS策略
DO $$
BEGIN
    -- 允许任何人查看帖子图片
    CREATE POLICY "Anyone can view post images" ON storage.objects
    FOR SELECT USING (bucket_id = 'tennis-journey');
    
    -- 允许认证用户上传帖子图片（文件名格式: posts/<user_id>_<timestamp>_<index>.<ext>）
    CREATE POLICY "Users can upload post images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'tennis-journey' 
        AND (auth.role() = 'service_role' OR auth.uid()::text = split_part(split_part(name, '_', 1), '/', 2))
    );
    
    -- 允许用户更新/删除自己的帖子图片
    CREATE POLICY "Users can update their own post images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'tennis-journey' 
        AND (auth.role() = 'service_role' OR auth.uid()::text = split_part(split_part(name, '_', 1), '/', 2))
    );
    
    CREATE POLICY "Users can delete their own post images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'tennis-journey' 
        AND (auth.role() = 'service_role' OR auth.uid()::text = split_part(split_part(name, '_', 1), '/', 2))
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '策略已存在，跳过创建';
END $$;

-- 验证Storage配置
SELECT '✅ Storage权限修复完成' AS status;
SELECT id, name, public FROM storage.buckets WHERE id IN ('avatars', 'tennis-journey');

-- ========================================
-- 3. 社区精选逻辑修正（可选）
-- ========================================

-- 确保 repost_count 默认值为0
UPDATE posts SET repost_count = 0 WHERE repost_count IS NULL;

-- 添加索引以优化查询性能（如果不存在）
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_posts_repost_count ON posts(repost_count);
    CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '索引已存在，跳过创建';
END $$;

SELECT '✅ SQL脚本执行完成' AS final_status;