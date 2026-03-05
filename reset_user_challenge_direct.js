// 直接重置用户挑战状态
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

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('email', email)
    .single()
  
  if (error) {
    console.error(`获取用户 ${email} 失败:`, error.message)
    return null
  }
  
  return data
}

async function getUserChallengeStatus(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('challenge_status, challenge_start_date, challenge_success_date')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error(`获取用户挑战状态失败:`, error.message)
    return null
  }
  
  return data
}

async function getUserLogs(userId) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: true })
  
  if (error) {
    console.error(`获取用户打卡记录失败:`, error.message)
    return []
  }
  
  return data || []
}

async function deleteUnapprovedLogs(userId) {
  console.log(`删除用户 ${userId} 的未审核记录...`)
  
  const { error } = await supabase
    .from('daily_logs')
    .delete()
    .eq('user_id', userId)
    .neq('status', 'approved') // 保留已通过的记录
  
  if (error) {
    console.error(`删除未审核记录失败:`, error.message)
    return false
  }
  
  console.log(`✅ 已删除用户 ${userId} 的未审核记录`)
  return true
}

async function resetUserChallenge(userId) {
  console.log(`重置用户 ${userId} 的挑战状态...`)
  
  const { error } = await supabase
    .from('profiles')
    .update({
      challenge_status: 'not_started',
      challenge_start_date: null,
      challenge_success_date: null
    })
    .eq('id', userId)
  
  if (error) {
    console.error(`重置挑战状态失败:`, error.message)
    return false
  }
  
  console.log(`✅ 已重置用户 ${userId} 的挑战状态`)
  return true
}

async function main() {
  console.log('=== 开始处理用户挑战重置 ===\n')
  
  const targetEmails = ['yumilishiyu@163.com', '31830347@qq.com']
  
  for (const email of targetEmails) {
    console.log(`\n🔍 处理用户: ${email}`)
    console.log('='.repeat(50))
    
    // 1. 获取用户信息
    const user = await getUserByEmail(email)
    if (!user) {
      console.log(`❌ 未找到用户: ${email}`)
      continue
    }
    
    console.log(`用户ID: ${user.id}`)
    
    // 2. 获取当前挑战状态
    const challengeStatus = await getUserChallengeStatus(user.id)
    if (challengeStatus) {
      console.log(`当前挑战状态: ${challengeStatus.challenge_status}`)
      console.log(`挑战开始日期: ${challengeStatus.challenge_start_date}`)
      console.log(`挑战成功日期: ${challengeStatus.challenge_success_date}`)
    }
    
    // 3. 获取打卡记录
    const logs = await getUserLogs(user.id)
    console.log(`打卡记录总数: ${logs.length}`)
    
    const approvedLogs = logs.filter(l => l.status === 'approved').length
    const pendingLogs = logs.filter(l => l.status === 'pending').length
    const rejectedLogs = logs.filter(l => l.status === 'rejected').length
    
    console.log(`- 已通过: ${approvedLogs}`)
    console.log(`- 待审核: ${pendingLogs}`)
    console.log(`- 已拒绝: ${rejectedLogs}`)
    
    // 4. 显示最近的打卡记录
    if (logs.length > 0) {
      console.log('\n最近的打卡记录:')
      logs.slice(0, 3).forEach(log => {
        console.log(`  ${log.log_date} - ${log.status} - ${log.text_content?.substring(0, 30)}...`)
      })
    }
    
    // 5. 询问是否重置（根据用户需求）
    if (email === 'yumilishiyu@163.com') {
      console.log('\n📋 根据用户反馈，需要重置挑战')
      console.log('执行重置操作...')
      
      // 删除未审核记录
      await deleteUnapprovedLogs(user.id)
      
      // 重置挑战状态
      await resetUserChallenge(user.id)
      
      console.log(`✅ ${email} 的挑战已重置，可以重新开始`)
    } else if (email === '31830347@qq.com') {
      console.log('\n⚠️  用户 31830347@qq.com 是否需要重置？')
      console.log('当前状态:', challengeStatus?.challenge_status)
      
      // 根据实际情况决定
      if (challengeStatus?.challenge_status === 'in_progress' && pendingLogs > 0) {
        console.log('检测到进行中的挑战有待审核记录，建议重置')
        // 如果需要重置，取消下面的注释
        // await deleteUnapprovedLogs(user.id)
        // await resetUserChallenge(user.id)
      } else {
        console.log('保持当前状态')
      }
    }
  }
  
  console.log('\n=== 处理完成 ===')
  console.log('\n下一步:')
  console.log('1. 用户 yumilishiyu@163.com 可以重新开始7天挑战')
  console.log('2. 用户 31830347@qq.com 保持当前状态（如需重置请手动执行）')
  console.log('3. 修复前端挑战机制逻辑')
}

main().catch(console.error)