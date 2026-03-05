// 删除用户yumilishiyu@163.com的所有pending打卡记录
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

async function deletePendingLogs() {
  console.log('=== 删除用户 yumilishiyu@163.com 的pending打卡记录 ===\n')
  
  try {
    // 1. 查找用户ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'yumilishiyu@163.com')
      .single()
    
    if (userError) {
      console.error('查找用户错误:', userError.message)
      return
    }
    
    const userId = userData.id
    console.log(`用户ID: ${userId}`)
    
    // 2. 查找所有pending记录
    const { data: pendingLogs, error: logsError } = await supabase
      .from('daily_logs')
      .select('id, log_date, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
    
    if (logsError) {
      console.error('查找pending记录错误:', logsError.message)
      return
    }
    
    console.log(`找到 ${pendingLogs.length} 条pending记录:`)
    pendingLogs.forEach(log => {
      console.log(`  - ${log.log_date}: ${log.status} (ID: ${log.id})`)
    })
    
    // 3. 批量删除
    if (pendingLogs.length > 0) {
      const logIds = pendingLogs.map(log => log.id)
      console.log(`\n删除 ${logIds.length} 条记录...`)
      
      const { error: deleteError } = await supabase
        .from('daily_logs')
        .delete()
        .in('id', logIds)
      
      if (deleteError) {
        console.error('批量删除错误:', deleteError.message)
        
        // 如果批量删除失败，尝试逐个删除
        console.log('尝试逐个删除...')
        for (const logId of logIds) {
          const { error: singleDeleteError } = await supabase
            .from('daily_logs')
            .delete()
            .eq('id', logId)
          
          if (singleDeleteError) {
            console.error(`删除记录 ${logId} 错误:`, singleDeleteError.message)
          } else {
            console.log(`✅ 已删除记录 ID: ${logId}`)
          }
        }
      } else {
        console.log(`✅ 成功删除 ${logIds.length} 条pending记录`)
      }
    } else {
      console.log('没有pending记录需要删除')
    }
    
    // 4. 验证删除结果
    console.log('\n验证删除结果...')
    const { data: remainingLogs, error: remainingError } = await supabase
      .from('daily_logs')
      .select('id, log_date, status')
      .eq('user_id', userId)
    
    if (remainingError) {
      console.error('验证错误:', remainingError.message)
    } else {
      console.log(`剩余打卡记录: ${remainingLogs.length} 条`)
      if (remainingLogs.length > 0) {
        remainingLogs.forEach(log => {
          console.log(`  - ${log.log_date}: ${log.status}`)
        })
      } else {
        console.log('✅ 所有pending记录已成功删除')
      }
    }
    
    console.log('\n=== 删除完成 ===')
    
  } catch (error) {
    console.error('执行过程中发生错误:', error.message)
  }
}

// 执行删除
deletePendingLogs().catch(console.error)