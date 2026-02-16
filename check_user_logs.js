// 检查用户打卡记录的脚本
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// 读取.env文件
const envContent = readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误：缺少Supabase环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUserLogs(userId) {
  try {
    console.log(`正在检查用户 ${userId} 的打卡记录...`)
    
    // 1. 检查用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('获取用户档案失败:', profileError)
    } else if (profile) {
      console.log('✅ 用户档案信息:')
      console.log(`   邮箱: ${profile.email}`)
      console.log(`   挑战状态: ${profile.challenge_status}`)
      console.log(`   挑战开始日期: ${profile.challenge_start_date}`)
    }
    
    // 2. 检查打卡记录
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: true })
    
    if (logsError) {
      console.error('获取打卡记录失败:', logsError)
    } else if (logs && logs.length > 0) {
      console.log(`\n📊 用户有 ${logs.length} 条打卡记录:`)
      logs.forEach(log => {
        console.log(`   ${log.log_date}: ${log.status} (${log.image_urls?.length || 0}张照片)`)
      })
      
      // 检查已审核通过的记录
      const approvedLogs = logs.filter(log => log.status === 'approved')
      console.log(`\n✅ 已审核通过的记录: ${approvedLogs.length} 条`)
      
      if (approvedLogs.length >= 7) {
        console.log('🎉 用户已完成7天打卡，可以生成球探报告！')
      } else {
        console.log(`❌ 用户只有 ${approvedLogs.length} 条已审核记录，需要 ${7 - approvedLogs.length} 条更多记录`)
      }
    } else {
      console.log('❌ 用户没有任何打卡记录')
    }
    
    // 3. 检查球探报告
    const { data: reports, error: reportsError } = await supabase
      .from('scout_reports')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
    
    if (reportsError) {
      console.error('获取球探报告失败:', reportsError)
    } else if (reports && reports.length > 0) {
      console.log(`\n📄 用户有 ${reports.length} 份球探报告:`)
      reports.forEach(report => {
        console.log(`   ${report.generated_at}: ${report.generation_status}`)
      })
    } else {
      console.log('\n📄 用户没有任何球探报告')
    }
    
  } catch (error) {
    console.error('检查失败:', error)
  }
}

// 执行查询
const userId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
checkUserLogs(userId).then(() => {
  console.log('\n💡 建议：')
  console.log('1. 如果用户没有足够的打卡记录，需要先创建测试数据')
  console.log('2. 或者修改Edge Function的逻辑，允许生成测试报告')
  console.log('3. 或者为用户手动创建7条已审核的打卡记录')
  process.exit(0)
})