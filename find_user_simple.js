// 查找用户UUID的简单脚本 - 直接从.env文件读取
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// 读取.env文件
const envContent = readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误：缺少Supabase环境变量')
  console.log('找到的环境变量:', Object.keys(envVars))
  process.exit(1)
}

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findUserUUID(email) {
  try {
    console.log(`\n正在查找用户: ${email}`)
    
    // 从profiles表查找
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('email', email)
      .maybeSingle()
    
    if (profileError) {
      console.error('从profiles查询失败:', profileError)
    } else if (profileData) {
      console.log('✅ 从profiles找到用户:')
      console.log(`   UUID: ${profileData.id}`)
      console.log(`   Email: ${profileData.email}`)
      console.log(`   创建时间: ${profileData.created_at}`)
      return profileData.id
    } else {
      console.log(`❌ 未在profiles表中找到用户: ${email}`)
      
      // 尝试查找所有用户
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5)
      
      if (!allError && allProfiles && allProfiles.length > 0) {
        console.log('\n📋 数据库中的用户（前5个）:')
        allProfiles.forEach(profile => {
          console.log(`   ${profile.email} -> ${profile.id}`)
        })
      }
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
    console.log(`\n🎉 用户 ${userEmail} 的UUID是: ${uuid}`)
    console.log('\n📋 使用以下命令调用Edge Function:')
    console.log(`curl -X POST https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report \\`)
    console.log(`  -H "Authorization: Bearer ${supabaseAnonKey}" \\`)
    console.log(`  -H "Content-Type: application/json" \\`)
    console.log(`  -d '{"user_id": "${uuid}"}'`)
  } else {
    console.log(`\n💡 建议：`)
    console.log('1. 确保用户已注册并登录过系统')
    console.log('2. 用户可能还没有创建profile记录')
    console.log('3. 您可以在Supabase仪表板中查看所有用户')
    console.log('   网址: https://supabase.com/dashboard/project/finjgjjqcyjdaucyxchp/auth/users')
  }
  process.exit(0)
})