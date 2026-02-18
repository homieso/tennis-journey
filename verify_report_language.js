// 验证报告语言正确性
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

async function verifyReportLanguage() {
  console.log('验证报告语言正确性...')
  
  // 获取管理员的最新报告
  const { data: reports, error } = await supabase
    .from('scout_reports')
    .select('*')
    .eq('user_id', ADMIN_UUID)
    .order('generated_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('查询报告失败:', error.message)
    return
  }
  
  console.log(`管理员有 ${reports.length} 份报告`)
  
  if (reports.length === 0) {
    console.log('⚠️  没有找到报告，需要生成双语报告')
    return
  }
  
  console.log('\n=== 报告语言分析 ===')
  
  reports.forEach((report, index) => {
    console.log(`\n[${index + 1}] 报告ID: ${report.id}`)
    console.log(`   生成时间: ${report.generated_at}`)
    
    // 分析结构化数据
    if (report.structured_data) {
      try {
        const structured = typeof report.structured_data === 'string' 
          ? JSON.parse(report.structured_data)
          : report.structured_data
        
        const title = structured?.cover?.title || ''
        const subtitle = structured?.cover?.subtitle || ''
        
        console.log(`   标题: ${title}`)
        console.log(`   副标题: ${subtitle}`)
        
        // 语言检测
        const hasChinese = /[\u4e00-\u9fa5]/.test(title)
        const hasEnglish = /[a-zA-Z]/.test(title) && !hasChinese
        
        if (hasChinese) {
          console.log(`   ✅ 语言: 中文 (检测到中文字符)`)
        } else if (hasEnglish) {
          console.log(`   ✅ 语言: 英文 (检测到英文字符)`)
        } else {
          console.log(`   ⚠️  语言: 无法确定`)
        }
        
        // 检查关键字段的语言一致性
        const profileSummary = structured?.profile?.summary || ''
        const analysisStrengths = structured?.analysis?.strengths || []
        
        console.log(`   个人总结: ${profileSummary.substring(0, 40)}...`)
        console.log(`   优势数量: ${analysisStrengths.length}`)
        
      } catch (e) {
        console.log(`   结构化数据解析失败: ${e.message}`)
      }
    }
    
    // 分析HTML内容
    if (report.content_html) {
      const html = report.content_html
      const chineseChars = (html.match(/[\u4e00-\u9fa5]/g) || []).length
      const englishWords = (html.match(/\b[a-zA-Z]{3,}\b/g) || []).length
      
      console.log(`   HTML内容: ${chineseChars} 个中文字符, ${englishWords} 个英文单词`)
      
      // 提取前几行
      const lines = html.split('\n').filter(l => l.trim().length > 0)
      if (lines.length > 0) {
        console.log(`   首行: ${lines[0].substring(0, 60)}...`)
      }
    }
    
    // 检查帖子关联
    if (report.post_id) {
      console.log(`   关联帖子ID: ${report.post_id}`)
    }
  })
  
  // 检查是否有双语报告（至少一份中文和一份英文）
  const languageResults = reports.map(report => {
    if (!report.structured_data) return null
    try {
      const structured = typeof report.structured_data === 'string' 
        ? JSON.parse(report.structured_data)
        : report.structured_data
      const title = structured?.cover?.title || ''
      return /[\u4e00-\u9fa5]/.test(title) ? 'zh' : 'en'
    } catch {
      return null
    }
  }).filter(Boolean)
  
  const hasChinese = languageResults.includes('zh')
  const hasEnglish = languageResults.includes('en')
  
  console.log('\n=== 双语报告状态 ===')
  console.log(`中文报告: ${hasChinese ? '✅ 有' : '❌ 无'}`)
  console.log(`英文报告: ${hasEnglish ? '✅ 有' : '❌ 无'}`)
  
  if (hasChinese && hasEnglish) {
    console.log('🎉 双语报告生成成功！')
  } else if (reports.length >= 2) {
    console.log('⚠️  有多份报告但语言不完整')
  } else {
    console.log('❌ 需要生成双语报告')
  }
}

verifyReportLanguage().then(() => {
  console.log('\n验证完成')
  process.exit(0)
}).catch(error => {
  console.error('脚本执行出错:', error)
  process.exit(1)
})