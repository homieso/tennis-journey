// 查找用户UUID的脚本
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
    
    // 方法1：从auth.users表查找
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('从auth.users查询失败:', authError)
    } else {
      const user = authData.users.find(u => u.email === email)
      if (user) {
        console.log('从auth.users找到用户:')
        console.log(`UUID: ${user.id}`)
        console.log(`Email: ${user.email}`)
        console.log(`创建时间: ${user.created_at}`)
        return user.id
      }
    }
    
    // 方法2：从profiles表查找
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()
    
    if (profileError) {
      console.error('从profiles查询失败:', profileError)
    } else if (profileData) {
      console.log('从profiles找到用户:')
      console.log(`UUID: ${profileData.id}`)
      console.log(`Email: ${profileData.email}`)
      return profileData.id
    }
    
    console.log(`未找到用户: ${email}`)
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
    console.log(`\n用户 ${userEmail} 的UUID是: ${uuid}`)
    console.log('\n使用以下命令调用Edge Function:')
    console.log(`curl -X POST https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report \\`)
    console.log(`  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \\`)
    console.log(`  -H "Content-Type: application/json" \\`)
    console.log(`  -d '{"user_id": "${uuid}"}'`)
  } else {
    console.log(`\n未找到用户 ${userEmail}`)
  }
  process.exit(0)
})