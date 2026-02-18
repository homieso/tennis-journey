-- Tennis Journey - 头像上传 RLS 策略修复（简化版）
-- 解决错误："new row violates row-level security policy"
-- 必须在 Supabase SQL Editor 中以 service_role 权限执行此脚本

BEGIN;

-- 1. 确保 avatars bucket 存在且公开
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, 
  '{"image/jpeg","image/png","image/webp","image/gif"}'
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = '{"image/jpeg","image/png","image/webp","image/gif"}';

-- 2. 删除所有可能冲突的旧策略
DO $$
BEGIN
    -- 删除 avatars bucket 的所有旧策略
    DROP POLICY IF EXISTS "Allow users to upload avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to update avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to delete avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public to view avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users on avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read on avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects 表不存在，跳过策略删除';
END $$;

-- 3. 启用 RLS（确保已启用）
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. 创建简化策略（允许所有认证用户上传/更新/删除 avatars 中的文件）
-- 策略 1：允许认证用户在 avatars bucket 中插入文件
CREATE POLICY "Allow authenticated upload to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 策略 2：允许认证用户更新 avatars 中的文件（基于文件名包含用户ID）
CREATE POLICY "Allow authenticated update in avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 策略 3：允许认证用户删除 avatars 中的文件
CREATE POLICY "Allow authenticated delete from avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 策略 4：允许所有人查看 avatars 中的文件（公开读取）
CREATE POLICY "Allow public read on avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

COMMIT;

-- 5. 验证配置
SELECT '✅ 头像上传 RLS 策略修复完成' AS status;

-- 检查存储桶状态
SELECT 
    id AS bucket_id,
    name AS bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- 检查策略数量
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual::text AS conditions
FROM pg_policies 
WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%avatars%'
ORDER BY policyname;

-- 执行说明
SELECT '📋 执行说明' AS note;
SELECT '1. 在 Supabase Dashboard → SQL Editor 中执行此脚本' AS step;
SELECT '2. 使用 service_role 密钥连接（点击"Use service_role key"）' AS step;
SELECT '3. 执行后测试头像上传功能' AS step;
SELECT '4. 如果仍然失败，请检查浏览器控制台错误信息' AS step;