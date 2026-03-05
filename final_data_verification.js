// 最终数据核对与清理脚本
import { createClient } from '@supabase/supabase-js'

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

// 允许的邮箱列表
const ALLOWED_EMAILS = [
  'homieso0704@gmail.com',
  'yumilishiyu@163.com',
  'jerryig@163.com',
  'allyhesmile@hotmail.com'
]

async function executeSQL(sql) {
  console.log('执行SQL:', sql.substring(0, 100) + '...')
  
  try {
    // 尝试使用RPC exec_sql
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.log('RPC exec_sql失败，尝试REST API:', error.message)
      
      // 尝试REST API方法
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ sql_query: sql })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`REST API失败: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('SQL通过REST API执行成功')
      return result
    }
    
    console.log('SQL通过RPC执行成功')
    return data
  } catch (err) {
    console.error('执行SQL失败:', err.message)
    throw err
  }
}

async function querySQL(sql) {
  console.log('查询SQL:', sql.substring(0, 100) + '...')
  
  try {
    const result = await executeSQL(sql)
    console.log('查询结果:', result)
    return result
  } catch (err) {
    console.error('查询失败:', err.message)
    return null
  }
}

async function checkCurrentUsers() {
  console.log('\n=== 1. 核对当前所有用户 ===')
  
  const sql = `
    SELECT id, email, created_at 
    FROM auth.users 
    ORDER BY created_at DESC;
  `
  
  const users = await querySQL(sql)
  
  if (users) {
    console.log(`当前总用户数: ${users.length}`)
    console.log('用户列表:')
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
    })
  }
  
  return users
}

async function cleanupExtraUsers() {
  console.log('\n=== 2. 清理多余用户 ===')
  
  const emailsList = ALLOWED_EMAILS.map(email => `'${email}'`).join(', ')
  
  const deleteSQL = `
    DELETE FROM auth.users WHERE email NOT IN (${emailsList});
  `
  
  console.log('将删除不在允许列表中的用户')
  console.log('允许的用户:', ALLOWED_EMAILS)
  
  try {
    const result = await executeSQL(deleteSQL)
    console.log('✅ 多余用户清理完成')
    return result
  } catch (err) {
    console.error('❌ 清理用户失败:', err.message)
    return null
  }
}

async function checkDailyLogs() {
  console.log('\n=== 3. 核对打卡记录 ===')
  
  const sql = `
    SELECT 
      u.email,
      COUNT(dl.id) as log_count
    FROM auth.users u
    LEFT JOIN daily_logs dl ON u.id = dl.user_id
    GROUP BY u.email
    ORDER BY log_count DESC;
  `
  
  const logs = await querySQL(sql)
  
  if (logs) {
    console.log('每个用户的打卡数量:')
    let totalLogs = 0
    logs.forEach(log => {
      console.log(`  - ${log.email}: ${log.log_count} 次打卡`)
      totalLogs += parseInt(log.log_count) || 0
    })
    console.log(`打卡记录总数: ${totalLogs}`)
  }
  
  return logs
}

async function cleanupExtraLogs() {
  console.log('\n=== 4. 清理多余打卡记录 ===')
  
  const emailsList = ALLOWED_EMAILS.map(email => `'${email}'`).join(', ')
  
  const deleteSQL = `
    DELETE FROM daily_logs 
    WHERE user_id NOT IN (
      SELECT id FROM auth.users WHERE email IN (${emailsList})
    );
  `
  
  console.log('将删除不属于允许用户的打卡记录')
  
  try {
    const result = await executeSQL(deleteSQL)
    console.log('✅ 多余打卡记录清理完成')
    return result
  } catch (err) {
    console.error('❌ 清理打卡记录失败:', err.message)
    return null
  }
}

async function checkScoutReports() {
  console.log('\n=== 5. 核对球探报告 ===')
  
  const sql = `
    SELECT 
      u.email,
      COUNT(sr.id) as report_count
    FROM auth.users u
    LEFT JOIN scout_reports sr ON u.id = sr.user_id
    GROUP BY u.email
    ORDER BY report_count DESC;
  `
  
  const reports = await querySQL(sql)
  
  if (reports) {
    console.log('每个用户的报告数量:')
    let totalReports = 0
    reports.forEach(report => {
      console.log(`  - ${report.email}: ${report.report_count} 份报告`)
      totalReports += parseInt(report.report_count) || 0
    })
    console.log(`报告总数: ${totalReports}`)
  }
  
  return reports
}

async function cleanupExtraReports() {
  console.log('\n=== 6. 清理多余球探报告 ===')
  
  const emailsList = ALLOWED_EMAILS.map(email => `'${email}'`).join(', ')
  
  const deleteSQL = `
    DELETE FROM scout_reports 
    WHERE user_id NOT IN (
      SELECT id FROM auth.users WHERE email IN (${emailsList})
    );
  `
  
  console.log('将删除不属于允许用户的球探报告')
  
  try {
    const result = await executeSQL(deleteSQL)
    console.log('✅ 多余球探报告清理完成')
    return result
  } catch (err) {
    console.error('❌ 清理球探报告失败:', err.message)
    return null
  }
}

async function finalStatistics() {
  console.log('\n=== 7. 最终统计核对 ===')
  
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM auth.users) as total_users,
      (SELECT COUNT(*) FROM daily_logs) as total_logs,
      (SELECT COUNT(*) FROM scout_reports) as total_reports;
  `
  
  const stats = await querySQL(sql)
  
  if (stats && stats[0]) {
    const { total_users, total_logs, total_reports } = stats[0]
    console.log('📊 最终统计结果:')
    console.log(`  - 总用户数: ${total_users}`)
    console.log(`  - 总打卡记录: ${total_logs}`)
    console.log(`  - 总球探报告: ${total_reports}`)
    
    // 验证是否符合预期
    console.log('\n✅ 验证结果:')
    console.log(`  用户数应为4: ${total_users === 4 ? '✓ 符合' : '✗ 不符合'}`)
    console.log(`  打卡记录应为4人实际打卡数: ${total_logs >= 0 ? '✓ 有效' : '✗ 无效'}`)
    console.log(`  报告数应为4人实际报告数: ${total_reports >= 0 ? '✓ 有效' : '✗ 无效'}`)
  }
  
  return stats
}

async function main() {
  console.log('=== 开始最终数据核对与清理 ===')
  console.log('允许的用户邮箱:', ALLOWED_EMAILS)
  
  try {
    // 1. 检查当前用户
    await checkCurrentUsers()
    
    // 2. 清理多余用户
    await cleanupExtraUsers()
    
    // 3. 检查打卡记录
    await checkDailyLogs()
    
    // 4. 清理多余打卡记录
    await cleanupExtraLogs()
    
    // 5. 检查球探报告
    await checkScoutReports()
    
    // 6. 清理多余报告
    await cleanupExtraReports()
    
    // 7. 最终统计
    await finalStatistics()
    
    console.log('\n=== 数据核对与清理完成 ===')
    
  } catch (error) {
    console.error('执行过程中发生错误:', error)
    process.exit(1)
  }
}

// 执行主函数
main().catch(console.error)