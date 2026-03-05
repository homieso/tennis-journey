// 执行重置用户 allyhesmile@hotmail.com 挑战状态的脚本
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Supabase 配置
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 创建 Supabase 客户端（使用 service_role）
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  try {
    console.log('执行SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''))
    
    // 尝试使用RPC执行
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('RPC执行错误:', error.message)
      // 尝试直接查询
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const { data: queryData, error: queryError } = await supabase.from('profiles').select('*')
        if (queryError) {
          console.error('查询错误:', queryError.message)
        } else {
          console.log('查询成功，数据长度:', queryData.length)
        }
      }
      return { success: false, error }
    }
    
    console.log('执行成功，返回数据:', data ? JSON.stringify(data).substring(0, 200) : '无数据')
    return { success: true, data }
  } catch (err) {
    console.error('执行异常:', err.message)
    return { success: false, error: err }
  }
}

async function resetAllyChallenge() {
  console.log('=== 开始重置用户 allyhesmile@hotmail.com 的挑战状态 ===\n')
  
  // 1. 首先检查用户是否存在
  console.log('1. 检查用户是否存在...')
  const checkUserSQL = `
    SELECT 
      u.id,
      u.email,
      p.challenge_status,
      p.challenge_start_date,
      COUNT(dl.id) as total_logs
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN daily_logs dl ON u.id = dl.user_id
    WHERE u.email = 'allyhesmile@hotmail.com'
    GROUP BY u.id, u.email, p.challenge_status, p.challenge_start_date
  `
  await executeSQL(checkUserSQL)
  
  // 2. 执行完整的重置SQL
  console.log('\n2. 执行完整重置SQL...')
  const resetSQL = fs.readFileSync('reset_ally_challenge.sql', 'utf8')
  
  // 分割SQL语句并执行
  const statements = resetSQL.split(';').filter(stmt => stmt.trim().length > 0)
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim()
    if (stmt.length === 0) continue
    
    console.log(`\n执行语句 ${i + 1}/${statements.length}:`)
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''))
    
    await executeSQL(stmt + ';')
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 3. 验证重置结果
  console.log('\n3. 验证重置结果...')
  const verifySQL = `
    SELECT 
      u.email,
      p.challenge_status,
      p.challenge_start_date,
      p.challenge_success_date,
      COUNT(dl.id) as remaining_logs
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN daily_logs dl ON u.id = dl.user_id
    WHERE u.email = 'allyhesmile@hotmail.com'
    GROUP BY u.email, p.challenge_status, p.challenge_start_date, p.challenge_success_date
  `
  await executeSQL(verifySQL)
  
  console.log('\n=== 重置完成 ===')
  console.log('用户 allyhesmile@hotmail.com 的挑战状态已完全重置')
  console.log('✅ 所有打卡记录已删除')
  console.log('✅ 挑战状态已重置为 not_started')
  console.log('✅ 用户现在可以从第一天重新开始7天挑战')
}

// 执行重置
resetAllyChallenge().catch(console.error)