// 生成用户反馈与打卡审核报表 - 版本2（使用REST API直接查询）
import fs from 'fs'

// Supabase 配置
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 使用REST API执行SQL查询
async function executeSQLViaRestAPI(sql) {
  try {
    console.log(`执行SQL: ${sql.substring(0, 100)}...`)
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })
    
    if (!response.ok) {
      console.error(`HTTP错误: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`执行SQL失败: ${error.message}`)
    return null
  }
}

// 使用Supabase JS客户端查询表
async function queryTable(tableName, select = '*', filters = {}, orderBy = 'created_at', ascending = false) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    let query = supabase.from(tableName).select(select)
    
    // 应用过滤器
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    // 排序
    query = query.order(orderBy, { ascending })
    
    const { data, error } = await query
    
    if (error) {
      console.error(`查询表 ${tableName} 失败:`, error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error(`查询表 ${tableName} 异常:`, error.message)
    return []
  }
}

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

async function main() {
  console.log('=== 开始生成用户反馈与打卡审核报表 (版本2) ===')
  
  // 1. 查询待审核的打卡记录
  console.log('查询待审核打卡记录...')
  const pendingLogs = await queryTable(
    'daily_logs',
    '*, user:user_id(email)',
    { status: 'pending' },
    'log_date',
    false
  )
  
  console.log(`找到 ${pendingLogs.length} 条待审核打卡记录`)
  
  // 2. 查询用户反馈
  console.log('查询用户反馈...')
  const feedbacks = await queryTable(
    'feedback',
    '*',
    { status: 'pending' },
    'created_at',
    false
  )
  
  console.log(`找到 ${feedbacks.length} 条待处理反馈`)
  
  // 3. 查询用户信息以获取邮箱
  console.log('查询用户信息...')
  const users = await queryTable(
    'auth.users',
    'id, email',
    {},
    'created_at',
    false
  )
  
  const userMap = {}
  users.forEach(user => {
    userMap[user.id] = user.email
  })
  
  // 4. 查询已完成挑战的用户
  console.log('查询已完成挑战的用户...')
  const profiles = await queryTable(
    'profiles',
    '*',
    { challenge_status: 'success' },
    'challenge_success_date',
    false
  )
  
  console.log(`找到 ${profiles.length} 位已完成挑战的用户`)
  
  // 5. 查询统计信息
  console.log('查询统计信息...')
  const allUsers = await queryTable('auth.users', 'id, created_at')
  const allLogs = await queryTable('daily_logs', 'id, created_at, status')
  
  // 计算统计
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const newUsers7d = allUsers.filter(user => 
    new Date(user.created_at) > sevenDaysAgo
  ).length
  
  const logs7d = allLogs.filter(log => 
    new Date(log.created_at) > sevenDaysAgo
  ).length
  
  const pendingFeedbackCount = feedbacks.length
  const pendingLogsCount = pendingLogs.length
  
  // 生成Markdown报告
  let report = `# 用户反馈与打卡审核报表\n\n`
  report += `**生成时间:** ${new Date().toLocaleString('zh-CN')}\n\n`
  
  // 统计概览
  report += `## 📈 统计概览\n\n`
  report += `- **过去7天新用户:** ${newUsers7d}\n`
  report += `- **过去7天打卡记录:** ${logs7d}\n`
  report += `- **待处理反馈:** ${pendingFeedbackCount}\n`
  report += `- **待审核打卡:** ${pendingLogsCount}\n\n`
  
  // 1. 用户反馈汇总表
  const feedbackRows = feedbacks.map(item => [
    formatDate(item.created_at),
    userMap[item.user_id] || item.user_id?.substring(0, 8) + '...' || 'N/A',
    item.title || '无标题',
    item.content?.substring(0, 50) + (item.content?.length > 50 ? '...' : '') || '无内容',
    item.contact || '未提供',
    item.status || 'pending',
    item.admin_reply || '未回复'
  ])
  
  report += generateMarkdownTable(
    '📊 1. 用户反馈汇总表（待处理）',
    ['提交时间', '用户邮箱/ID', '标题', '内容摘要', '联系方式', '状态', '管理员回复'],
    feedbackRows
  )
  
  // 2. 待审核打卡记录
  const dailyLogsRows = pendingLogs.map(item => {
    const email = item.user?.email || userMap[item.user_id] || item.user_id?.substring(0, 8) + '...' || 'N/A'
    const imageInfo = item.image_urls 
      ? `📸 ${Array.isArray(item.image_urls) ? item.image_urls.length : 1} 张图片` 
      : '无图片'
    
    return [
      formatDate(item.log_date),
      email,
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
  const challengeRows = profiles.map(item => {
    const email = userMap[item.id] || item.id?.substring(0, 8) + '...' || 'N/A'
    
    // 计算该用户的打卡数
    const userLogs = allLogs.filter(log => 
      log.user_id === item.id && log.status === 'approved'
    ).length
    
    return [
      email,
      item.username || '未设置',
      formatDate(item.challenge_success_date),
      userLogs
    ]
  })
  
  report += generateMarkdownTable(
    '🏆 3. 已完成7天挑战的用户',
    ['用户邮箱/ID', '用户名', '挑战完成日期', '总打卡数'],
    challengeRows
  )
  
  // 图片URL查看说明
  report += `## 🔍 图片URL查看说明\n\n`
  report += `如果打卡记录中包含图片URL，可以通过以下方式快速查看：\n\n`
  report += `1. **直接访问URL**: 复制图片URL到浏览器地址栏\n`
  report += `2. **Supabase Storage**: 图片存储在Supabase Storage的 \`daily-log-images\` 桶中\n`
  report += `3. **格式**: URL通常为 \`https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/daily-log-images/{filename}\`\n\n`
  
  // 显示图片URL示例（如果有）
  const logsWithImages = pendingLogs.filter(item => item.image_urls)
  if (logsWithImages.length > 0) {
    report += `### 当前待审核记录中的图片URL示例\n\n`
    logsWithImages.slice(0, 3).forEach((item, index) => {
      const email = item.user?.email || userMap[item.user_id] || item.user_id?.substring(0, 8) + '...'
      report += `${index + 1}. **${email}** (${formatDate(item.log_date)}):\n`
      
      if (Array.isArray(item.image_urls)) {
        item.image_urls.forEach((url, i) => {
          report += `   - 图片 ${i + 1}: \`${url}\`\n`
        })
      } else if (item.image_urls) {
        report += `   - 图片: \`${item.image_urls}\`\n`
      }
      report += '\n'
    })
  }
  
  // 操作建议
  report += `## 📋 操作建议\n\n`
  report += `1. **优先处理**: 按时间倒序处理最早的待审核记录\n`
  report += `2. **反馈回复**: 及时回复用户反馈，更新 \`admin_reply\` 字段\n`
  report += `3. **打卡审核**: 审核打卡记录，更新 \`status\` 为 'approved' 或 'rejected'\n`
  report += `4. **挑战完成**: 祝贺完成7天挑战的用户\n`
  report += `5. **图片审核**: 检查图片内容是否符合社区规范\n\n`
  
  // 保存报告
  fs.writeFileSync('user-feedback-report.md', report, 'utf8')
  console.log(`✅ 报表已保存到 user-feedback-report.md`)
  
  // 显示摘要
  console.log(`\n=== 报表摘要 ===`)
  console.log(`- 待处理反馈: ${feedbacks.length} 条`)
  console.log(`- 待审核打卡: ${pendingLogs.length} 条`)
  console.log(`- 完成挑战用户: ${profiles.length} 人`)
  console.log(`- 过去7天新用户: ${newUsers7d}`)
  console.log(`- 过去7天打卡: ${logs7d}`)
  console.log(`- 带图片的打卡记录: ${logsWithImages.length} 条`)
}

main().catch(console.error)