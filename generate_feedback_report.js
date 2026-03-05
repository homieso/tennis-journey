// 生成用户反馈与打卡审核报表
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

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生成Markdown表格
function generateMarkdownTable(title, headers, rows) {
  let markdown = `### ${title}\n\n`
  
  if (rows.length === 0) {
    markdown += `**无数据**\n\n`
    return markdown
  }
  
  // 表头
  markdown += `| ${headers.join(' | ')} |\n`
  markdown += `| ${headers.map(() => '---').join(' | ')} |\n`
  
  // 数据行
  rows.forEach(row => {
    markdown += `| ${row.join(' | ')} |\n`
  })
  
  markdown += '\n'
  return markdown
}

// 执行SQL查询
async function executeQuery(query, queryName) {
  console.log(`执行查询: ${queryName}`)
  
  try {
    // 使用Supabase的RPC执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })
    
    if (error) {
      console.error(`查询 ${queryName} 错误:`, error.message)
      // 尝试使用另一种方法 - 直接查询表
      return await executeDirectQuery(query, queryName)
    }
    
    console.log(`查询 ${queryName} 成功，返回 ${data?.length || 0} 条记录`)
    return data || []
  } catch (err) {
    console.error(`查询 ${queryName} 异常:`, err.message)
    return []
  }
}

// 直接查询表（备用方法）
async function executeDirectQuery(query, queryName) {
  console.log(`尝试直接查询: ${queryName}`)
  
  try {
    // 解析查询类型
    if (query.includes('FROM feedback')) {
      const { data, error } = await supabase
        .from('feedback')
        .select('*, users:user_id(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data.map(item => ({
        created_at: item.created_at,
        email: item.users?.email || 'N/A',
        title: item.title,
        content: item.content,
        contact: item.contact,
        status: item.status,
        admin_reply: item.admin_reply
      }))
    } else if (query.includes('FROM daily_logs')) {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*, users:user_id(email)')
        .eq('status', 'pending')
        .order('log_date', { ascending: false })
      
      if (error) throw error
      return data.map(item => ({
        log_date: item.log_date,
        email: item.users?.email || 'N/A',
        text_content: item.text_content,
        image_urls: item.image_urls,
        status: item.status
      }))
    }
    
    return []
  } catch (err) {
    console.error(`直接查询 ${queryName} 失败:`, err.message)
    return []
  }
}

async function main() {
  console.log('=== 开始生成用户反馈与打卡审核报表 ===')
  
  // 1. 用户反馈汇总表
  const feedbackQuery = `
    SELECT 
      f.created_at,
      u.email,
      f.title,
      f.content,
      f.contact,
      f.status,
      f.admin_reply
    FROM feedback f
    LEFT JOIN auth.users u ON f.user_id = u.id
    WHERE f.status = 'pending'
    ORDER BY f.created_at DESC;
  `
  
  const feedbackData = await executeQuery(feedbackQuery, '用户反馈汇总表')
  
  // 2. 待审核打卡记录
  const dailyLogsQuery = `
    SELECT 
      dl.log_date,
      u.email,
      dl.text_content,
      dl.image_urls,
      dl.status
    FROM daily_logs dl
    JOIN auth.users u ON dl.user_id = u.id
    WHERE dl.status = 'pending'
    ORDER BY dl.log_date DESC;
  `
  
  const dailyLogsData = await executeQuery(dailyLogsQuery, '待审核打卡记录')
  
  // 3. 已完成7天挑战的用户
  const challengeQuery = `
    SELECT 
      u.email,
      p.username,
      p.challenge_success_date,
      COUNT(dl.id) as total_logs
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    LEFT JOIN daily_logs dl ON u.id = dl.user_id AND dl.status = 'approved'
    WHERE p.challenge_status = 'success'
    GROUP BY u.email, p.username, p.challenge_success_date
    ORDER BY p.challenge_success_date DESC;
  `
  
  const challengeData = await executeQuery(challengeQuery, '已完成7天挑战的用户')
  
  // 4. 统计概览
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
      (SELECT COUNT(*) FROM daily_logs WHERE created_at > NOW() - INTERVAL '7 days') as logs_7d,
      (SELECT COUNT(*) FROM feedback WHERE status = 'pending') as pending_feedback,
      (SELECT COUNT(*) FROM daily_logs WHERE status = 'pending') as pending_logs;
  `
  
  const statsData = await executeQuery(statsQuery, '统计概览')
  
  // 生成Markdown报告
  let report = `# 用户反馈与打卡审核报表\n\n`
  report += `**生成时间:** ${new Date().toLocaleString('zh-CN')}\n\n`
  
  // 统计概览
  if (statsData && statsData.length > 0) {
    const stats = statsData[0]
    report += `## 📈 统计概览\n\n`
    report += `- **过去7天新用户:** ${stats.new_users_7d || 0}\n`
    report += `- **过去7天打卡记录:** ${stats.logs_7d || 0}\n`
    report += `- **待处理反馈:** ${stats.pending_feedback || 0}\n`
    report += `- **待审核打卡:** ${stats.pending_logs || 0}\n\n`
  }
  
  // 1. 用户反馈汇总表
  const feedbackRows = feedbackData.map(item => [
    formatDate(item.created_at),
    item.email || 'N/A',
    item.title || '无标题',
    item.content?.substring(0, 50) + (item.content?.length > 50 ? '...' : '') || '无内容',
    item.contact || '未提供',
    item.status || 'pending',
    item.admin_reply || '未回复'
  ])
  
  report += generateMarkdownTable(
    '📊 1. 用户反馈汇总表（待处理）',
    ['提交时间', '用户邮箱', '标题', '内容摘要', '联系方式', '状态', '管理员回复'],
    feedbackRows
  )
  
  // 2. 待审核打卡记录
  const dailyLogsRows = dailyLogsData.map(item => {
    const imageInfo = item.image_urls 
      ? `📸 ${Array.isArray(item.image_urls) ? item.image_urls.length : 1} 张图片` 
      : '无图片'
    
    return [
      formatDate(item.log_date),
      item.email || 'N/A',
      item.text_content?.substring(0, 60) + (item.text_content?.length > 60 ? '...' : '') || '无文字内容',
      imageInfo,
      item.status || 'pending'
    ]
  })
  
  report += generateMarkdownTable(
    '📸 2. 待审核打卡记录',
    ['打卡日期', '用户邮箱', '内容摘要', '图片信息', '状态'],
    dailyLogsRows
  )
  
  // 3. 已完成7天挑战的用户
  const challengeRows = challengeData.map(item => [
    item.email || 'N/A',
    item.username || '未设置',
    formatDate(item.challenge_success_date),
    item.total_logs || 0
  ])
  
  report += generateMarkdownTable(
    '🏆 3. 已完成7天挑战的用户',
    ['用户邮箱', '用户名', '挑战完成日期', '总打卡数'],
    challengeRows
  )
  
  // 图片URL查看说明
  report += `## 🔍 图片URL查看说明\n\n`
  report += `如果打卡记录中包含图片URL，可以通过以下方式快速查看：\n\n`
  report += `1. **直接访问URL**: 复制图片URL到浏览器地址栏\n`
  report += `2. **Supabase Storage**: 图片存储在Supabase Storage的 \`daily-log-images\` 桶中\n`
  report += `3. **格式**: URL通常为 \`https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/daily-log-images/{filename}\`\n\n`
  
  // 操作建议
  report += `## 📋 操作建议\n\n`
  report += `1. **优先处理**: 按时间倒序处理最早的待审核记录\n`
  report += `2. **反馈回复**: 及时回复用户反馈，更新 \`admin_reply\` 字段\n`
  report += `3. **打卡审核**: 审核打卡记录，更新 \`status\` 为 'approved' 或 'rejected'\n`
  report += `4. **挑战完成**: 祝贺完成7天挑战的用户\n\n`
  
  // 保存报告
  fs.writeFileSync('user-feedback-report.md', report, 'utf8')
  console.log(`✅ 报表已保存到 user-feedback-report.md`)
  
  // 显示摘要
  console.log(`\n=== 报表摘要 ===`)
  console.log(`- 待处理反馈: ${feedbackData.length} 条`)
  console.log(`- 待审核打卡: ${dailyLogsData.length} 条`)
  console.log(`- 完成挑战用户: ${challengeData.length} 人`)
  
  if (statsData && statsData.length > 0) {
    const stats = statsData[0]
    console.log(`- 过去7天新用户: ${stats.new_users_7d || 0}`)
    console.log(`- 过去7天打卡: ${stats.logs_7d || 0}`)
  }
}

main().catch(console.error)