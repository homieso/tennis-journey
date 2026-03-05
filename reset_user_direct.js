// 直接使用Supabase客户端重置用户挑战状态
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

async function resetUserChallenge() {
  console.log('=== 直接重置用户 yumilishiyu@163.com 的挑战状态 ===\n')
  
  try {
    // 1. 首先查找用户ID
    console.log('1. 查找用户ID...')
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, challenge_status, challenge_start_date')
      .eq('email', 'yumilishiyu@163.com')
      .single()
    
    if (userError) {
      console.error('查找用户错误:', userError.message)
      return
    }
    
    console.log('找到用户:', {
      id: userData.id,
      email: userData.email,
      current_status: userData.challenge_status,
      start_date: userData.challenge_start_date
    })
    
    // 2. 查看用户的打卡记录
    console.log('\n2. 查看用户的打卡记录...')
    const { data: logsData, error: logsError } = await supabase
      .from('daily_logs')
      .select('id, log_date, status, content')
      .eq('user_id', userData.id)
      .order('log_date', { ascending: true })
    
    if (logsError) {
      console.error('查找打卡记录错误:', logsError.message)
    } else {
      console.log(`找到 ${logsData.length} 条打卡记录:`)
      logsData.forEach(log => {
        console.log(`  - ${log.log_date}: ${log.status} (${log.content?.substring(0, 30)}...)`)
      })
      
      // 统计状态
      const approvedCount = logsData.filter(l => l.status === 'approved').length
      const pendingCount = logsData.filter(l => l.status === 'pending').length
      const rejectedCount = logsData.filter(l => l.status === 'rejected').length
      console.log(`  状态统计: approved=${approvedCount}, pending=${pendingCount}, rejected=${rejectedCount}`)
    }
    
    // 3. 重置挑战状态
    console.log('\n3. 重置挑战状态...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        challenge_status: 'not_started',
        challenge_start_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)
    
    if (updateError) {
      console.error('更新挑战状态错误:', updateError.message)
    } else {
      console.log('✅ 挑战状态已重置为 not_started')
    }
    
    // 4. 删除非approved状态的打卡记录
    console.log('\n4. 删除非approved状态的打卡记录...')
    if (logsData && logsData.length > 0) {
      const nonApprovedLogs = logsData.filter(l => l.status !== 'approved')
      if (nonApprovedLogs.length > 0) {
        console.log(`找到 ${nonApprovedLogs.length} 条非approved记录需要删除`)
        
        // 批量删除
        for (const log of nonApprovedLogs) {
          const { error: deleteError } = await supabase
            .from('daily_logs')
            .delete()
            .eq('id', log.id)
          
          if (deleteError) {
            console.error(`删除记录 ${log.id} 错误:`, deleteError.message)
          } else {
            console.log(`✅ 已删除记录: ${log.log_date} (${log.status})`)
          }
        }
      } else {
        console.log('没有非approved记录需要删除')
      }
    }
    
    // 5. 验证结果
    console.log('\n5. 验证重置结果...')
    const { data: finalData, error: finalError } = await supabase
      .from('profiles')
      .select('id, email, challenge_status, challenge_start_date')
      .eq('email', 'yumilishiyu@163.com')
      .single()
    
    if (finalError) {
      console.error('验证错误:', finalError.message)
    } else {
      console.log('最终用户状态:', {
        email: finalData.email,
        challenge_status: finalData.challenge_status,
        challenge_start_date: finalData.challenge_start_date
      })
    }
    
    // 检查剩余打卡记录
    const { data: remainingLogs, error: remainingError } = await supabase
      .from('daily_logs')
      .select('id, log_date, status')
      .eq('user_id', userData.id)
    
    if (remainingError) {
      console.error('检查剩余记录错误:', remainingError.message)
    } else {
      console.log(`剩余打卡记录: ${remainingLogs.length} 条`)
      if (remainingLogs.length > 0) {
        remainingLogs.forEach(log => {
          console.log(`  - ${log.log_date}: ${log.status}`)
        })
      }
    }
    
    console.log('\n=== 重置完成 ===')
    console.log('用户 yumilishiyu@163.com 现在可以重新开始7天挑战')
    
  } catch (error) {
    console.error('执行过程中发生错误:', error.message)
  }
}

// 执行重置
resetUserChallenge().catch(console.error)