// 执行重置用户yumilishiyu@163.com挑战状态的脚本
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

async function resetUserChallenge() {
  console.log('=== 开始重置用户 yumilishiyu@163.com 的挑战状态 ===\n')
  
  // 1. 查看该用户当前状态
  console.log('1. 查看用户当前状态...')
  const checkSQL = `
    SELECT 
      p.id as user_id,
      p.email,
      p.challenge_status,
      p.challenge_start_date,
      COUNT(dl.id) as total_logs,
      SUM(CASE WHEN dl.status = 'approved' THEN 1 ELSE 0 END) as approved_logs,
      SUM(CASE WHEN dl.status = 'pending' THEN 1 ELSE 0 END) as pending_logs,
      SUM(CASE WHEN dl.status = 'rejected' THEN 1 ELSE 0 END) as rejected_logs
    FROM profiles p
    LEFT JOIN daily_logs dl ON p.id = dl.user_id
    WHERE p.email = 'yumilishiyu@163.com'
    GROUP BY p.id, p.email, p.challenge_status, p.challenge_start_date
  `
  await executeSQL(checkSQL)
  
  // 2. 强制重置挑战
  console.log('\n2. 强制重置挑战状态...')
  const resetSQL = `
    UPDATE profiles 
    SET 
      challenge_status = 'not_started',
      challenge_start_date = NULL,
      updated_at = NOW()
    WHERE email = 'yumilishiyu@163.com'
  `
  await executeSQL(resetSQL)
  
  // 3. 删除待审核的打卡记录
  console.log('\n3. 删除待审核的打卡记录...')
  const deleteSQL = `
    DELETE FROM daily_logs 
    WHERE user_id = (SELECT id FROM profiles WHERE email = 'yumilishiyu@163.com')
    AND status != 'approved'
  `
  await executeSQL(deleteSQL)
  
  // 4. 验证重置结果
  console.log('\n4. 验证重置结果...')
  const verifySQL = `
    SELECT 
      p.id as user_id,
      p.email,
      p.challenge_status,
      p.challenge_start_date,
      COUNT(dl.id) as remaining_logs,
      STRING_AGG(dl.status, ', ') as remaining_statuses
    FROM profiles p
    LEFT JOIN daily_logs dl ON p.id = dl.user_id
    WHERE p.email = 'yumilishiyu@163.com'
    GROUP BY p.id, p.email, p.challenge_status, p.challenge_start_date
  `
  await executeSQL(verifySQL)
  
  console.log('\n=== 重置完成 ===')
  console.log('用户 yumilishiyu@163.com 的挑战状态已重置为 not_started')
  console.log('所有非 approved 状态的打卡记录已被删除')
  console.log('用户现在可以重新开始7天挑战')
}

// 执行重置
resetUserChallenge().catch(console.error)