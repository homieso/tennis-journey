// 生成双语球探报告脚本
import { readFileSync } from 'fs'

// 读取.env文件
const envContent = readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY
const supabaseUrl = envVars.VITE_SUPABASE_URL

if (!supabaseAnonKey || !supabaseUrl) {
  console.error('错误：缺少Supabase环境变量')
  process.exit(1)
}

const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

async function callEdgeFunction(userId, language, origin) {
  try {
    console.log(`正在为用户 ${userId} 调用Edge Function，语言：${language}，域名：${origin}...`)
    
    const response = await fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Origin': origin,
        'Referer': `${origin}/report`
      },
      body: JSON.stringify({ 
        user_id: userId,
        test_mode: false  // 使用真实数据
      })
    })
    
    const result = await response.json()
    console.log('Edge Function响应:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log(`🎉 ${language}球探报告生成成功！`)
      console.log('报告ID:', result.report_id)
      console.log('帖子ID:', result.post_id || '无')
      return result
    } else {
      console.error(`❌ ${language}球探报告生成失败:`, result.error)
      return null
    }
    
  } catch (error) {
    console.error(`调用Edge Function失败 (${language}):`, error)
    return null
  }
}

async function generateBilingualReports() {
  console.log('开始生成双语球探报告...')
  console.log('管理员UUID:', ADMIN_UUID)
  
  // 1. 英文报告（国际域名）
  const englishResult = await callEdgeFunction(
    ADMIN_UUID, 
    '英文',
    'https://tj-7.vercel.app'
  )
  
  // 等待2秒，避免请求冲突
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 2. 中文报告（国内域名）
  const chineseResult = await callEdgeFunction(
    ADMIN_UUID,
    '中文',
    'https://tennisjourney.top'
  )
  
  console.log('\n=== 双语报告生成结果 ===')
  console.log('英文报告:', englishResult ? '成功' : '失败')
  console.log('中文报告:', chineseResult ? '成功' : '失败')
  
  if (englishResult && chineseResult) {
    console.log('\n✅ 双语报告生成完成！')
    console.log('英文报告ID:', englishResult.report_id)
    console.log('中文报告ID:', chineseResult.report_id)
    
    // 显示下一步操作
    console.log('\n📋 下一步：')
    console.log('1. 登录Supabase仪表板查看scout_reports表')
    console.log('2. 检查报告语言是否正确')
    console.log('3. 验证社区帖子是否自动生成')
  } else {
    console.log('\n⚠️  部分报告生成失败，请检查错误信息')
  }
}

generateBilingualReports().then(() => {
  console.log('\n脚本执行完成')
  process.exit(0)
}).catch(error => {
  console.error('脚本执行出错:', error)
  process.exit(1)
})