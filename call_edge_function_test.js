// 调用Edge Function的测试脚本
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

if (!supabaseAnonKey) {
  console.error('错误：缺少Supabase环境变量')
  process.exit(1)
}

async function callEdgeFunction(userId) {
  try {
    console.log(`正在为用户 ${userId} 调用Edge Function（测试模式）...`)
    
    const response = await fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        user_id: userId,
        test_mode: true
      })
    })
    
    const result = await response.json()
    console.log('Edge Function响应:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n🎉 球探报告生成成功！')
      console.log('报告ID:', result.report_id)
      
      // 显示下一步操作
      console.log('\n📋 下一步：')
      console.log('1. 登录Supabase仪表板查看报告')
      console.log('2. 访问 http://localhost:5174/report 查看报告')
      console.log('3. 报告会自动发布为社区帖子')
      
      return result.report_id
    } else {
      console.error('❌ 球探报告生成失败:', result.error)
      return null
    }
    
  } catch (error) {
    console.error('调用Edge Function失败:', error)
    return null
  }
}

// 执行调用
const userId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
callEdgeFunction(userId).then(reportId => {
  if (reportId) {
    console.log('\n✅ 测试完成！')
    console.log('🔗 开发服务器: http://localhost:5174/')
  } else {
    console.log('\n❌ 测试失败，请检查Edge Function配置')
  }
  process.exit(0)
})