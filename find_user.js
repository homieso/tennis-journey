// 查找用户UUID的简单脚本（ES模块版本）
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误：缺少Supabase环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findUserUUID(email) {
  try {
    console.log(`正在查找用户: ${email}`)
    
    // 从profiles表查找（这是最直接的方法）
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('email', email)
      .maybeSingle()
    
    if (profileError) {
      console.error('从profiles查询失败:', profileError)
    } else if (profileData) {
      console.log('从profiles找到用户:')
      console.log(`UUID: ${profileData.id}`)
      console.log(`Email: ${profileData.email}`)
      console.log(`创建时间: ${profileData.created_at}`)
      return profileData.id
    } else {
      console.log(`未在profiles表中找到用户: ${email}`)
      
      // 尝试从auth.users查找（需要service role key）
      console.log('\n提示：要查看所有用户，您需要：')
      console.log('1. 登录Supabase仪表板')
      console.log('2. 进入Authentication > Users')
      console.log('3. 查找用户的UUID')
    }
    
    return null
    
  } catch (error) {
    console.error('查询失败:', error)
    return null
  }
}

// 执行查询
const userEmail = 'homieso0704@gmail.com'
findUserUUID(userEmail).then(uuid => {
  if (uuid) {
    console.log(`\n✅ 用户 ${userEmail} 的UUID是: ${uuid}`)
    console.log('\n📋 使用以下命令调用Edge Function:')
    console.log(`curl -X POST https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report \\`)
    console.log(`  -H "Authorization: Bearer ${supabaseAnonKey}" \\`)
    console.log(`  -H "Content-Type: application/json" \\`)
    console.log(`  -d '{"user_id": "${uuid}"}'`)
    
    console.log('\n📝 或者使用以下JavaScript代码:')
    console.log(`fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {`)
    console.log(`  method: 'POST',`)
    console.log(`  headers: {`)
    console.log(`    'Authorization': 'Bearer ${supabaseAnonKey}',`)
    console.log(`    'Content-Type': 'application/json'`)
    console.log(`  },`)
    console.log(`  body: JSON.stringify({ user_id: "${uuid}" })`)
    console.log(`})`)
  } else {
    console.log(`\n❌ 未找到用户 ${userEmail}`)
    console.log('\n建议：')
    console.log('1. 确保用户已注册并登录过系统')
    console.log('2. 检查邮箱地址是否正确')
    console.log('3. 用户可能还没有创建profile记录')
  }
  process.exit(0)
})