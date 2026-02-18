// 使用 Supabase 客户端直接修复头像上传 RLS 策略
import { createClient } from '@supabase/supabase-js'

// Supabase 配置（使用 service_role 密钥）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 创建具有 service_role 权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseSecretKey}`
    }
  }
})

async function fixAvatarRLS() {
  console.log('🚀 开始通过 Supabase 客户端修复头像上传 RLS 策略...')
  console.log(`项目 URL: ${supabaseUrl}`)
  
  try {
    // 1. 确保 avatars bucket 存在且公开
    console.log('1. 确保 avatars bucket 存在且公开...')
    
    // 尝试创建或更新存储桶
    // 注意：Supabase JS 客户端没有直接的存储桶管理 API，我们需要使用 REST API
    const bucketResponse = await fetch(`${supabaseUrl}/rest/v1/storage/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseSecretKey}`,
        'apikey': supabaseSecretKey
      },
      body: JSON.stringify({
        id: 'avatars',
        name: 'avatars',
        public: true,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
    }).catch(error => {
      console.error('创建存储桶请求失败:', error)
      return null
    })
    
    if (bucketResponse && bucketResponse.status === 409) {
      console.log('✅ avatars bucket 已存在，尝试更新为公开...')
      // 尝试更新现有存储桶
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/storage/buckets/avatars`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseSecretKey}`,
          'apikey': supabaseSecretKey
        },
        body: JSON.stringify({
          public: true
        })
      })
      
      if (updateResponse.ok) {
        console.log('✅ avatars bucket 已更新为公开')
      } else {
        console.log('⚠️  无法更新存储桶，状态:', updateResponse.status)
      }
    } else if (bucketResponse && bucketResponse.ok) {
      console.log('✅ avatars bucket 创建成功')
    } else {
      console.log('⚠️  存储桶操作可能失败，继续执行策略修复...')
    }
    
    // 2. 由于无法直接通过客户端删除/创建策略，我们提供一个 SQL 执行方案
    console.log('\n2. 准备执行 RLS 策略修复 SQL...')
    
    // 尝试使用数据库连接执行 SQL
    console.log('尝试使用 REST API 执行 SQL...')
    
    // 方法：使用 Supabase 的 SQL API（如果启用）
    const sqlScript = `
BEGIN;

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

-- 启用 RLS（确保已启用）
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
    
    // 尝试通过 pg REST 扩展执行 SQL（如果启用）
    const sqlApiUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`
    const sqlResponse = await fetch(sqlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseSecretKey}`,
        'apikey': supabaseSecretKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ sql: sqlScript })
    }).catch(error => {
      console.error('SQL API 请求失败:', error)
      return null
    })
    
    if (sqlResponse && sqlResponse.ok) {
      console.log('✅ SQL 执行成功！')
      const result = await sqlResponse.json()
      console.log('结果:', result)
    } else {
      console.log('❌ 无法通过 REST API 执行 SQL')
      console.log('\n📋 请手动在 Supabase SQL Editor 中执行以下 SQL：')
      console.log('========================================')
      console.log(sqlScript)
      console.log('========================================')
      console.log('\n手动执行步骤：')
      console.log('1. 登录 Supabase 仪表板 (https://supabase.com/dashboard)')
      console.log('2. 进入项目: finjgjjqcyjdaucyxchp')
      console.log('3. 点击左侧 "SQL Editor"')
      console.log('4. 点击 "Use service_role key" 按钮')
      console.log('5. 粘贴上述 SQL 并执行')
      console.log('6. 执行成功后，测试头像上传功能')
      
      // 尝试使用 pg 连接（需要密码）
      console.log('\n💡 或者使用 psql 命令行工具：')
      console.log('1. 获取数据库密码：进入 Supabase 仪表板 → Settings → Database → Connection String')
      console.log('2. 执行: psql "postgresql://postgres:[YOUR_PASSWORD]@db.finjgjjqcyjdaucyxchp.supabase.co:5432/postgres" -c "YOUR_SQL"')
    }
    
    // 3. 验证修复
    console.log('\n3. 验证存储桶和策略状态...')
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets()
      
      if (bucketsError) {
        console.log('无法获取存储桶列表:', bucketsError.message)
      } else {
        const avatarBucket = buckets.find(b => b.name === 'avatars')
        if (avatarBucket) {
          console.log(`✅ 找到 avatars 存储桶: ID=${avatarBucket.id}, 公开=${avatarBucket.public}`)
        } else {
          console.log('❌ 未找到 avatars 存储桶')
        }
      }
    } catch (error) {
      console.log('验证存储桶失败:', error.message)
    }
    
    console.log('\n✨ 修复流程完成！')
    console.log('\n下一步：')
    console.log('1. 如果 SQL 已执行成功，请测试头像上传功能')
    console.log('2. 启动应用: npm run dev')
    console.log('3. 登录并进入个人主页')
    console.log('4. 点击头像上传按钮，选择图片文件')
    console.log('5. 检查浏览器控制台是否有错误信息')
    
  } catch (error) {
    console.error('执行过程中出错:', error)
    console.log('\n💡 请手动执行 SQL 修复 RLS 策略')
  }
}

// 执行
fixAvatarRLS().then(() => {
  console.log('\n🔚 脚本执行结束')
  process.exit(0)
})