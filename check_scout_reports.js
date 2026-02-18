// 检查scout_reports表
import { createClient } from '@supabase/supabase-js'

// Supabase 配置（使用服务角色密钥）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

// 创建具有 service_role 权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkScoutReports() {
  console.log('检查 scout_reports 表...')
  
  // 1. 检查表是否存在
  const { data: tables, error: tablesError } = await supabase
    .from('scout_reports')
    .select('*', { count: 'exact', head: true })
  
  if (tablesError) {
    console.error('无法访问 scout_reports 表:', tablesError.message)
    return
  }
  
  // 2. 获取所有报告
  const { data: reports, error: reportsError } = await supabase
    .from('scout_reports')
    .select('*')
    .order('generated_at', { ascending: false })
  
  if (reportsError) {
    console.error('查询报告失败:', reportsError.message)
    return
  }
  
  console.log(`\n=== scout_reports 表报告 (${reports.length} 条记录) ===`)
  
  reports.forEach((report, index) => {
    console.log(`\n[${index + 1}] 报告ID: ${report.id}`)
    console.log(`   用户ID: ${report.user_id}`)
    console.log(`   生成时间: ${report.generated_at}`)
    console.log(`   报告版本: ${report.report_version}`)
    console.log(`   状态: ${report.generation_status}`)
    console.log(`   已发布: ${report.is_published}`)
    console.log(`   帖子ID: ${report.post_id}`)
    
    // 检查结构化数据中的语言线索
    if (report.structured_data) {
      try {
        const structured = typeof report.structured_data === 'string' 
          ? JSON.parse(report.structured_data)
          : report.structured_data
        
        const title = structured?.cover?.title || '未知标题'
        console.log(`   报告标题: ${title}`)
        
        // 判断语言：标题包含中文还是英文
        const isChinese = /[\u4e00-\u9fa5]/.test(title)
        console.log(`   语言: ${isChinese ? '中文' : '英文'}`)
      } catch (e) {
        console.log(`   结构化数据解析失败: ${e.message}`)
      }
    }
    
    // 检查HTML内容
    if (report.content_html && report.content_html.length > 0) {
      const firstLine = report.content_html.split('\n')[0].trim()
      console.log(`   内容预览: ${firstLine.substring(0, 60)}...`)
    }
  })
  
  // 3. 检查管理员用户的报告
  console.log('\n=== 管理员用户报告 ===')
  const { data: adminReports, error: adminError } = await supabase
    .from('scout_reports')
    .select('*')
    .eq('user_id', ADMIN_UUID)
  
  if (adminError) {
    console.error('查询管理员报告失败:', adminError.message)
  } else {
    console.log(`管理员有 ${adminReports.length} 份报告`)
    
    adminReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ID: ${report.id}, 生成于: ${report.generated_at}`)
    })
  }
  
  // 4. 检查 daily_logs 表确保有数据
  console.log('\n=== 管理员打卡记录检查 ===')
  const { data: logs, error: logsError } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', ADMIN_UUID)
    .eq('status', 'approved')
    .order('log_date', { ascending: true })
  
  if (logsError) {
    console.error('查询打卡记录失败:', logsError.message)
  } else {
    console.log(`管理员有 ${logs.length} 条已批准的打卡记录`)
    
    if (logs.length >= 7) {
      console.log('✅ 满足7天打卡要求')
      logs.slice(0, 3).forEach(log => {
        console.log(`  - ${log.log_date}: ${log.text_content.substring(0, 40)}...`)
      })
      if (logs.length > 3) console.log(`  ... 还有 ${logs.length - 3} 条`)
    } else {
      console.log(`⚠️  只有 ${logs.length} 条记录，需要7条`)
    }
  }
}

checkScoutReports().then(() => {
  console.log('\n检查完成')
  process.exit(0)
}).catch(error => {
  console.error('脚本执行出错:', error)
  process.exit(1)
})