// 使用 Supabase 服务角色密钥执行 Storage RLS 修复脚本
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 从环境变量或用户输入获取服务角色密钥
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceRoleKey) {
  console.error('❌ 未找到服务角色密钥')
  console.log('请设置环境变量 SUPABASE_SERVICE_ROLE_KEY')
  console.log('或者在命令行中提供：')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_key_here node execute_storage_rls_fix.js')
  console.log('\n获取服务角色密钥的方法：')
  console.log('1. 登录 Supabase 仪表板 (https://supabase.com/dashboard)')
  console.log('2. 进入项目设置 → API')
  console.log('3. 复制 service_role 密钥（以 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 开头）')
  console.log('\n您也可以手动执行 SQL 脚本：')
  console.log('1. 登录 Supabase 仪表板')
  console.log('2. 进入 SQL 编辑器')
  console.log('3. 点击 "Use service_role key" 按钮')
  console.log('4. 粘贴并执行 fix_storage_rls.sql 中的内容')
  process.exit(1)
}

// 创建具有服务角色权限的客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeRLSFix() {
  try {
    console.log('🚀 开始执行 Storage RLS 修复脚本...')
    console.log(`项目 URL: ${supabaseUrl}`)
    
    // 读取 SQL 文件
    const sqlFilePath = path.join(process.cwd(), 'fix_storage_rls.sql')
    let sqlContent
    try {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
      console.log(`📄 读取 SQL 文件: ${sqlFilePath}`)
      console.log(`文件大小: ${sqlContent.length} 字符`)
    } catch (error) {
      console.error(`❌ 无法读取 SQL 文件: ${error.message}`)
      console.log('请确保 fix_storage_rls.sql 文件存在')
      process.exit(1)
    }
    
    // 将 SQL 分割为单独的语句（以分号分隔）
    // 注意：我们使用更简单的方法，直接执行整个脚本
    console.log('⚡ 正在执行 SQL 脚本...')
    
    // 使用 Supabase 的 SQL API 执行
    // 注意：Supabase JavaScript 客户端没有直接的 SQL 执行方法
    // 我们需要使用 REST API 或使用 pg 库
    // 这里我们使用 REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    }).catch(error => {
      console.error('❌ 网络请求失败:', error.message)
      return null
    })
    
    if (response && response.ok) {
      const result = await response.json()
      console.log('✅ SQL 执行成功！')
      console.log('结果:', JSON.stringify(result, null, 2))
    } else {
      console.log('⚠️  REST API 方法可能不支持直接 SQL 执行')
      console.log('\n📋 请手动执行 SQL 脚本：')
      console.log('========================================')
      console.log(sqlContent.substring(0, 1000) + '...')
      console.log('========================================')
      console.log('\n或者，您可以在 Supabase SQL 编辑器中执行以下操作：')
      console.log('1. 登录 Supabase 仪表板')
      console.log('2. 进入 SQL 编辑器')
      console.log('3. 点击 "Use service_role key" 按钮')
      console.log('4. 粘贴上述 SQL 内容并执行')
    }
    
    // 尝试通过 pg 连接执行（可选）
    console.log('\n💡 提示：要自动执行 SQL，您可能需要使用 psql 命令行工具：')
    console.log(`psql "postgresql://postgres:[YOUR_PASSWORD]@db.finjgjjqcyjdaucyxchp.supabase.co:5432/postgres" -f fix_storage_rls.sql`)
    
    console.log('\n🎯 修复完成后，请测试头像上传功能：')
    console.log('1. 启动应用: npm run dev')
    console.log('2. 登录并进入个人主页')
    console.log('3. 点击头像上传按钮')
    console.log('4. 检查浏览器控制台是否有错误')
    
  } catch (error) {
    console.error('❌ 执行过程中出错:', error)
  }
}

// 执行
executeRLSFix().then(() => {
  console.log('\n✨ 脚本执行完成')
  console.log('请根据上述说明完成 RLS 策略修复')
})