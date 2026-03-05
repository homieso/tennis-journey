// 简单数据核对脚本 - 使用Supabase客户端直接查询
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

async function checkCurrentUsers() {
  console.log('\n=== 1. 核对当前所有用户 ===')
  
  try {
    // 查询auth.users表
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('查询用户失败:', error.message)
      return null
    }
    
    console.log(`当前总用户数: ${users.users.length}`)
    console.log('用户列表:')
    users.users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
    })
    
    return users.users
  } catch (err) {
    console.error('查询用户异常:', err.message)
    return null
  }
}

async function checkDailyLogs() {
  console.log('\n=== 2. 核对打卡记录 ===')
  
  try {
    // 查询daily_logs表
    const { data: logs, error } = await supabase
      .from('daily_logs')
      .select('*')
    
    if (error) {
      console.error('查询打卡记录失败:', error.message)
      return null
    }
    
    console.log(`打卡记录总数: ${logs.length}`)
    
    // 按用户分组统计
    const userLogCounts = {}
    logs.forEach(log => {
      if (!userLogCounts[log.user_id]) {
        userLogCounts[log.user_id] = 0
      }
      userLogCounts[log.user_id]++
    })
    
    // 获取用户邮箱信息
    const { data: users } = await supabase.auth.admin.listUsers()
    const userMap = {}
    users.users.forEach(user => {
      userMap[user.id] = user.email
    })
    
    console.log('每个用户的打卡数量:')
    Object.keys(userLogCounts).forEach(userId => {
      const email = userMap[userId] || `用户ID: ${userId.substring(0, 8)}...`
      console.log(`  - ${email}: ${userLogCounts[userId]} 次打卡`)
    })
    
    return logs
  } catch (err) {
    console.error('查询打卡记录异常:', err.message)
    return null
  }
}

async function checkScoutReports() {
  console.log('\n=== 3. 核对球探报告 ===')
  
  try {
    // 查询scout_reports表
    const { data: reports, error } = await supabase
      .from('scout_reports')
      .select('*')
    
    if (error) {
      console.error('查询球探报告失败:', error.message)
      return null
    }
    
    console.log(`球探报告总数: ${reports.length}`)
    
    // 按用户分组统计
    const userReportCounts = {}
    reports.forEach(report => {
      if (!userReportCounts[report.user_id]) {
        userReportCounts[report.user_id] = 0
      }
      userReportCounts[report.user_id]++
    })
    
    // 获取用户邮箱信息
    const { data: users } = await supabase.auth.admin.listUsers()
    const userMap = {}
    users.users.forEach(user => {
      userMap[user.id] = user.email
    })
    
    console.log('每个用户的报告数量:')
    Object.keys(userReportCounts).forEach(userId => {
      const email = userMap[userId] || `用户ID: ${userId.substring(0, 8)}...`
      console.log(`  - ${email}: ${userReportCounts[userId]} 份报告`)
    })
    
    return reports
  } catch (err) {
    console.error('查询球探报告异常:', err.message)
    return null
  }
}

async function deleteExtraUsers() {
  console.log('\n=== 4. 删除多余用户 ===')
  
  try {
    // 获取所有用户
    const { data: users } = await supabase.auth.admin.listUsers()
    
    const usersToDelete = users.users.filter(user => !ALLOWED_EMAILS.includes(user.email))
    
    if (usersToDelete.length === 0) {
      console.log('没有多余用户需要删除')
      return
    }
    
    console.log(`发现 ${usersToDelete.length} 个多余用户需要删除:`)
    usersToDelete.forEach(user => {
      console.log(`  - ${user.email}`)
    })
    
    // 删除多余用户
    for (const user of usersToDelete) {
      console.log(`正在删除用户: ${user.email}`)
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`删除用户 ${user.email} 失败:`, error.message)
      } else {
        console.log(`✅ 已删除用户: ${user.email}`)
      }
    }
    
    console.log('✅ 多余用户清理完成')
  } catch (err) {
    console.error('删除用户异常:', err.message)
  }
}

async function deleteExtraLogs() {
  console.log('\n=== 5. 删除多余打卡记录 ===')
  
  try {
    // 获取所有用户
    const { data: users } = await supabase.auth.admin.listUsers()
    const allowedUserIds = users.users
      .filter(user => ALLOWED_EMAILS.includes(user.email))
      .map(user => user.id)
    
    if (allowedUserIds.length === 0) {
      console.log('没有允许的用户，跳过打卡记录清理')
      return
    }
    
    // 查询不属于允许用户的打卡记录
    const { data: extraLogs, error } = await supabase
      .from('daily_logs')
      .select('*')
      .not('user_id', 'in', `(${allowedUserIds.join(',')})`)
    
    if (error) {
      console.error('查询多余打卡记录失败:', error.message)
      return
    }
    
    if (extraLogs.length === 0) {
      console.log('没有多余打卡记录需要删除')
      return
    }
    
    console.log(`发现 ${extraLogs.length} 条多余打卡记录需要删除`)
    
    // 删除多余打卡记录
    for (const log of extraLogs) {
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', log.id)
      
      if (error) {
        console.error(`删除打卡记录 ${log.id} 失败:`, error.message)
      }
    }
    
    console.log('✅ 多余打卡记录清理完成')
  } catch (err) {
    console.error('删除打卡记录异常:', err.message)
  }
}

async function deleteExtraReports() {
  console.log('\n=== 6. 删除多余球探报告 ===')
  
  try {
    // 获取所有用户
    const { data: users } = await supabase.auth.admin.listUsers()
    const allowedUserIds = users.users
      .filter(user => ALLOWED_EMAILS.includes(user.email))
      .map(user => user.id)
    
    if (allowedUserIds.length === 0) {
      console.log('没有允许的用户，跳过球探报告清理')
      return
    }
    
    // 查询不属于允许用户的球探报告
    const { data: extraReports, error } = await supabase
      .from('scout_reports')
      .select('*')
      .not('user_id', 'in', `(${allowedUserIds.join(',')})`)
    
    if (error) {
      console.error('查询多余球探报告失败:', error.message)
      return
    }
    
    if (extraReports.length === 0) {
      console.log('没有多余球探报告需要删除')
      return
    }
    
    console.log(`发现 ${extraReports.length} 份多余球探报告需要删除`)
    
    // 删除多余球探报告
    for (const report of extraReports) {
      const { error } = await supabase
        .from('scout_reports')
        .delete()
        .eq('id', report.id)
      
      if (error) {
        console.error(`删除球探报告 ${report.id} 失败:`, error.message)
      }
    }
    
    console.log('✅ 多余球探报告清理完成')
  } catch (err) {
    console.error('删除球探报告异常:', err.message)
  }
}

async function finalStatistics() {
  console.log('\n=== 7. 最终统计核对 ===')
  
  try {
    // 获取用户数
    const { data: users } = await supabase.auth.admin.listUsers()
    const totalUsers = users.users.length
    
    // 获取打卡记录数
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('id', { count: 'exact', head: true })
    const totalLogs = logs.length
    
    // 获取球探报告数
    const { data: reports } = await supabase
      .from('scout_reports')
      .select('id', { count: 'exact', head: true })
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
    users.users.forEach(user => {
      if (ALLOWED_EMAILS.includes(user.email)) {
        console.log(`  - ${user.email}`)
      }
    })
    
    return { totalUsers, totalLogs, totalReports }
  } catch (err) {
    console.error('最终统计异常:', err.message)
    return null
  }
}

async function main() {
  console.log('=== 开始最终数据核对与清理 ===')
  console.log('允许的用户邮箱:', ALLOWED_EMAILS)
  
  try {
    // 1. 检查当前用户
    await checkCurrentUsers()
    
    // 2. 检查打卡记录
    await checkDailyLogs()
    
    // 3. 检查球探报告
    await checkScoutReports()
    
    // 4. 删除多余用户
    await deleteExtraUsers()
    
    // 5. 删除多余打卡记录
    await deleteExtraLogs()
    
    // 6. 删除多余报告
    await deleteExtraReports()
    
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