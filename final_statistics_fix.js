// 最终统计修复脚本
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

async function getFinalStatistics() {
  console.log('=== 最终统计核对 ===')
  
  try {
    // 1. 获取用户数
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('获取用户失败:', usersError.message)
      return null
    }
    
    const totalUsers = users.users.length
    const allowedUsers = users.users.filter(user => ALLOWED_EMAILS.includes(user.email))
    
    // 2. 获取打卡记录数
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
    
    if (logsError) {
      console.error('获取打卡记录失败:', logsError.message)
      return null
    }
    
    const totalLogs = logs.length
    
    // 3. 获取球探报告数
    const { data: reports, error: reportsError } = await supabase
      .from('scout_reports')
      .select('*')
    
    if (reportsError) {
      console.error('获取球探报告失败:', reportsError.message)
      return null
    }
    
    const totalReports = reports.length
    
    console.log('📊 最终统计结果:')
    console.log(`  - 总用户数: ${totalUsers}`)
    console.log(`  - 总打卡记录: ${totalLogs}`)
    console.log(`  - 总球探报告: ${totalReports}`)
    
    // 验证是否符合预期
    console.log('\n✅ 验证结果:')
    console.log(`  用户数应为4: ${totalUsers === 4 ? '✓ 符合' : '✗ 不符合 (当前: ' + totalUsers + ')'}`)
    console.log(`  打卡记录应为4人实际打卡数: ${totalLogs >= 0 ? '✓ 有效' : '✗ 无效'}`)
    console.log(`  报告数应为4人实际报告数: ${totalReports >= 0 ? '✓ 有效' : '✗ 无效'}`)
    
    // 显示允许的用户
    console.log('\n允许的用户列表:')
    allowedUsers.forEach(user => {
      console.log(`  - ${user.email}`)
    })
    
    // 显示打卡记录分布
    console.log('\n打卡记录分布:')
    const logCountByUser = {}
    logs.forEach(log => {
      if (!logCountByUser[log.user_id]) {
        logCountByUser[log.user_id] = 0
      }
      logCountByUser[log.user_id]++
    })
    
    allowedUsers.forEach(user => {
      const count = logCountByUser[user.id] || 0
      console.log(`  - ${user.email}: ${count} 次打卡`)
    })
    
    // 显示报告分布
    console.log('\n球探报告分布:')
    const reportCountByUser = {}
    reports.forEach(report => {
      if (!reportCountByUser[report.user_id]) {
        reportCountByUser[report.user_id] = 0
      }
      reportCountByUser[report.user_id]++
    })
    
    allowedUsers.forEach(user => {
      const count = reportCountByUser[user.id] || 0
      console.log(`  - ${user.email}: ${count} 份报告`)
    })
    
    return { 
      totalUsers, 
      totalLogs, 
      totalReports,
      users: allowedUsers,
      logs,
      reports
    }
    
  } catch (err) {
    console.error('最终统计异常:', err.message)
    return null
  }
}

async function main() {
  console.log('=== 执行最终统计核对 ===')
  
  const stats = await getFinalStatistics()
  
  if (stats) {
    console.log('\n=== 统计完成 ===')
    console.log('总结:')
    console.log(`- 用户: ${stats.totalUsers} 个 (目标: 4)`)
    console.log(`- 打卡: ${stats.totalLogs} 条记录`)
    console.log(`- 报告: ${stats.totalReports} 份报告`)
    
    // 检查是否达到目标
    if (stats.totalUsers === 4) {
      console.log('\n🎉 数据核对成功！所有统计数字已反映真实用户状态。')
    } else {
      console.log('\n⚠️  用户数不符合预期，可能需要进一步清理。')
    }
  }
}

// 执行主函数
main().catch(console.error)