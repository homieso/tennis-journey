// 直接执行头像上传 RLS 修复 SQL（使用 service_role 密钥）
import { createClient } from '@supabase/supabase-js'

// Supabase 配置（使用 service_role 密钥）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 创建具有 service_role 权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 用户提供的 SQL 脚本
const sqlScript = `
BEGIN;

-- 确保 avatars bucket 存在且公开
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 删除所有可能冲突的旧策略
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

-- 启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 允许认证用户上传头像（按用户ID分文件夹）
CREATE POLICY "Allow users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的头像
CREATE POLICY "Allow users to update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的头像
CREATE POLICY "Allow users to delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许所有人查看头像
CREATE POLICY "Allow public to view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

COMMIT;
`

async function executeAvatarRLSFix() {
  console.log('🚀 开始执行头像上传 RLS 修复脚本...')
  console.log(`项目 URL: ${supabaseUrl}`)
  console.log('使用 service_role 密钥执行 SQL...')
  
  try {
    // 方法1：尝试使用 RPC exec_sql（如果存在）
    console.log('尝试通过 RPC 执行 SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript })
    
    if (error) {
      console.log('RPC exec_sql 失败，错误:', error.message)
      console.log('尝试使用 raw SQL 查询...')
      
      // 方法2：尝试使用 SQL API（可能需要不同的端点）
      // 注意：Supabase JS 客户端不直接支持 raw SQL，我们可以使用 REST API
      // 但由于我们有 service_role 密钥，我们可以尝试使用 pg 连接
      // 这里提供一个替代方案
      console.log('\n⚠️  无法通过 RPC 执行 SQL')
      console.log('请手动在 Supabase SQL Editor 中执行以下 SQL：')
      console.log('========================================')
      console.log(sqlScript)
      console.log('========================================')
      console.log('\n步骤：')
      console.log('1. 登录 Supabase 仪表板 (https://supabase.com/dashboard)')
      console.log('2. 进入项目: finjgjjqcyjdaucyxchp')
      console.log('3. 点击左侧 "SQL Editor"')
      console.log('4. 点击 "Use service_role key" 按钮')
      console.log('5. 粘贴上述 SQL 并执行')
      return false
    }
    
    console.log('✅ SQL 执行成功！')
    console.log('结果:', data)
    
    // 验证修复是否生效
    console.log('\n验证存储桶状态...')
    const { data: buckets, error: bucketsError } = await supabase
      .from('storage.buckets')
      .select('id, name, public')
      .eq('id', 'avatars')
    
    if (bucketsError) {
      console.log('无法查询存储桶:', bucketsError.message)
    } else {
      console.log('存储桶状态:', buckets)
    }
    
    return true
    
  } catch (error) {
    console.error('执行过程中出错:', error)
    console.log('\n备用方案：请手动执行 SQL')
    return false
  }
}

// 执行
executeAvatarRLSFix().then(success => {
  if (success) {
    console.log('\n✨ RLS 策略修复完成！')
    console.log('现在可以测试头像上传功能：')
    console.log('1. 启动应用: npm run dev')
    console.log('2. 登录并进入个人主页')
    console.log('3. 点击头像上传按钮')
    console.log('4. 检查浏览器控制台是否有错误')
  } else {
    console.log('\n💡 请按上述说明手动执行 SQL')
  }
  process.exit(0)
})