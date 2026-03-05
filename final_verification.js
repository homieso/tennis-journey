// 最终验证用户 allyhesmile@hotmail.com 的状态
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

async function verifyUserStatus() {
  console.log('=== 最终验证用户 allyhesmile@hotmail.com 的状态 ===\n')
  
  const targetEmail = 'allyhesmile@hotmail.com'
  
  // 1. 查找用户
  console.log('1. 查找用户...')
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('获取用户列表失败:', usersError.message)
    return
  }
  
  const user = users.users.find(u => u.email === targetEmail)
  
  if (!user) {
    console.error(`❌ 未找到用户: ${targetEmail}`)
    return
  }
  
  console.log(`✅ 用户ID: ${user.id}`)
  console.log(`✅ 邮箱: ${user.email}`)
  console.log(`✅ 创建时间: ${user.created_at}`)
  
  // 2. 获取用户档案
  console.log('\n2. 获取用户档案...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.error('获取用户档案失败:', profileError.message)
  } else {
    console.log(`✅ 挑战状态: ${profile.challenge_status}`)
    console.log(`✅ 挑战开始日期: ${profile.challenge_start_date || 'null'}`)
    console.log(`✅ 挑战成功日期: ${profile.challenge_success_date || 'null'}`)
    console.log(`✅ 最后更新: ${profile.updated_at}`)
  }
  
  // 3. 获取打卡记录
  console.log('\n3. 获取打卡记录...')
  const { data: logs, error: logsError } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
  
  if (logsError) {
    console.error('获取打卡记录失败:', logsError.message)
  } else {
    console.log(`✅ 打卡记录总数: ${logs?.length || 0}`)
    
    if (logs && logs.length > 0) {
      console.log('打卡记录详情:')
      logs.forEach(log => {
        console.log(`  - ${log.log_date}: ${log.status} - ${log.text_content?.substring(0, 30)}...`)
      })
    } else {
      console.log('✅ 无打卡记录 - 已完全清除')
    }
  }
  
  // 4. 总结
  console.log('\n📋 状态总结:')
  console.log('='.repeat(50))
  
  const challengeStatus = profile?.challenge_status || '未知'
  const logCount = logs?.length || 0
  
  if (challengeStatus === 'not_started' && logCount === 0) {
    console.log('✅ 重置成功！')
    console.log('✅ 挑战状态: not_started (已重置)')
    console.log('✅ 打卡记录: 0 条 (已全部删除)')
    console.log('✅ 用户可以重新开始7天挑战')
  } else {
    console.log('⚠️  状态异常:')
    console.log(`- 挑战状态: ${challengeStatus}`)
    console.log(`- 打卡记录: ${logCount} 条`)
  }
  
  console.log('\n🎯 用户现在可以:')
  console.log('1. 登录 Tennis Journey 应用')
  console.log('2. 在挑战页面点击"开始挑战"')
  console.log('3. 从第一天开始打卡')
  console.log('4. 完成7天连续打卡获得奖励')
}

// 执行验证
verifyUserStatus().catch(console.error)