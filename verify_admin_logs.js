// 验证管理员打卡记录
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'
const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verify() {
  console.log('验证管理员打卡记录...')
  
  // 1. 检查 daily_logs
  const { data: logs, error: logsError } = await supabase
    .from('daily_logs')
    .select('id, log_date, text_content, status, image_urls')
    .eq('user_id', ADMIN_UUID)
    .eq('status', 'approved')
    .order('log_date')
  
  if (logsError) {
    console.error('❌ 查询打卡记录失败:', logsError)
    return
  }
  
  console.log(`✅ 找到 ${logs.length} 条打卡记录`)
  logs.forEach(log => {
    console.log(`  ${log.log_date}: "${log.text_content.substring(0, 50)}..."`)
  })
  
  // 2. 检查 profiles 挑战状态
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('challenge_status, challenge_success_date, challenge_start_date')
    .eq('id', ADMIN_UUID)
    .single()
  
  if (profileError) {
    console.error('❌ 查询用户档案失败:', profileError)
    return
  }
  
  console.log('\n用户挑战状态:')
  console.log(`  challenge_status: ${profile.challenge_status}`)
  console.log(`  challenge_success_date: ${profile.challenge_success_date}`)
  console.log(`  challenge_start_date: ${profile.challenge_start_date}`)
  
  // 3. 检查是否满足7天
  const startDate = new Date('2026-02-12')
  const endDate = new Date('2026-02-18')
  const expectedDays = 7
  const dateSet = new Set(logs.map(l => l.log_date))
  const missingDates = []
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    if (!dateSet.has(dateStr)) missingDates.push(dateStr)
  }
  
  if (missingDates.length === 0) {
    console.log(`\n✅ 所有 ${expectedDays} 天打卡记录完整 (2月12日-18日)`)
  } else {
    console.log(`\n⚠️  缺少以下日期: ${missingDates.join(', ')}`)
  }
  
  // 4. 总结
  console.log('\n' + '='.repeat(50))
  console.log('验证完成')
  console.log(`打卡记录: ${logs.length} 条`)
  console.log(`挑战状态: ${profile.challenge_status}`)
  console.log(`是否可生成球探报告: ${logs.length >= 7 ? '是' : '否'}`)
}

verify().catch(console.error)