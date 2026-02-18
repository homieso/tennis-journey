-- Tennis Journey - 彻底修复 Storage RLS 策略（解决头像上传失败问题）
-- 错误信息："new row violates row-level security policy"
-- 必须在 Supabase SQL Editor 中以 service_role 权限执行此脚本

BEGIN;

-- ========================================
-- 1. 确保 avatars bucket 存在且公开
-- ========================================
DO $$
BEGIN
    -- 创建或更新 avatars bucket
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('avatars', 'avatars', true, false, 5242880, '{image/jpeg,image/png,image/webp,image/gif}')
    ON CONFLICT (id) DO UPDATE SET 
        public = true,
        file_size_limit = 5242880,
        allowed_mime_types = '{image/jpeg,image/png,image/webp,image/gif}';
    
    -- 创建或更新 tennis-journey bucket（用于帖子图片）
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('tennis-journey', 'tennis-journey', true, false, 10485760, '{image/jpeg,image/png,image/webp,image/gif,video/mp4}')
    ON CONFLICT (id) DO UPDATE SET 
        public = true,
        file_size_limit = 10485760,
        allowed_mime_types = '{image/jpeg,image/png,image/webp,image/gif,video/mp4}';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.buckets 表不存在，请确保已启用Storage功能';
END $$;

-- ========================================
-- 2. 删除所有可能冲突的旧策略
-- ========================================
DO $$
BEGIN
    -- 删除 avatars bucket 的所有旧策略
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users on avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read on avatars" ON storage.objects;
    
    -- 删除 tennis-journey bucket 的所有旧策略
    DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users on tennis-journey" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read on tennis-journey" ON storage.objects;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects 表不存在，跳过策略删除';
END $$;

-- ========================================
-- 3. 为 avatars bucket 创建新策略（简化版）
-- ========================================
DO $$
BEGIN
    -- 允许所有认证用户在 avatars bucket 上进行所有操作
    CREATE POLICY "Allow all authenticated operations on avatars"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');
    
    -- 允许公开读取 avatars bucket 中的文件
    CREATE POLICY "Allow public read on avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
    
    RAISE NOTICE '✅ avatars bucket 策略创建成功';
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'avatars bucket 策略已存在，跳过创建';
END $$;

-- ========================================
-- 4. 为 tennis-journey bucket 创建新策略
-- ========================================
DO $$
BEGIN
    -- 允许所有认证用户在 tennis-journey bucket 上进行所有操作
    CREATE POLICY "Allow all authenticated operations on tennis-journey"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'tennis-journey')
    WITH CHECK (bucket_id = 'tennis-journey');
    
    -- 允许公开读取 tennis-journey bucket 中的文件
    CREATE POLICY "Allow public read on tennis-journey"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'tennis-journey');
    
    RAISE NOTICE '✅ tennis-journey bucket 策略创建成功';
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'tennis-journey bucket 策略已存在，跳过创建';
END $$;

-- ========================================
-- 5. 验证配置
-- ========================================
SELECT '✅ Storage RLS 策略修复完成' AS status;
SELECT 
    b.id AS bucket_id,
    b.name AS bucket_name,
    b.public,
    COUNT(p.policyname) AS policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects' 
    AND p.schemaname = 'storage'
    AND p.policyqual::text LIKE '%bucket_id = ''' || b.id || '''%'
WHERE b.id IN ('avatars', 'tennis-journey')
GROUP BY b.id, b.name, b.public
ORDER BY b.id;

-- ========================================
-- 6. 可选：临时禁用 RLS 进行测试（如果仍然有问题）
-- ========================================
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- 注意：禁用 RLS 仅用于测试，生产环境应重新启用

COMMIT;

-- ========================================
-- 执行说明
-- ========================================
SELECT '📋 执行说明' AS note;
SELECT '1. 在 Supabase Dashboard → SQL Editor 中执行此脚本' AS step;
SELECT '2. 使用 service_role 密钥连接（点击"Use service_role key"）' AS step;
SELECT '3. 执行后测试头像上传功能' AS step;
SELECT '4. 如果仍然失败，尝试执行第6步的 DISABLE ROW LEVEL SECURITY' AS step;