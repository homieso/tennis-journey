// 直接重置用户 allyhesmile@hotmail.com 的挑战状态
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
  console.log(`查找用户: ${email}`)
  
  try {
    // 使用 auth.admin API 查找用户
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('获取用户列表失败:', error.message)
      return null
    }
    
    const user = data.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`未找到用户: ${email}`)
      return null
    }
    
    console.log(`✅ 找到用户: ${user.email} (ID: ${user.id})`)
    return user
  } catch (error) {
    console.error('查找用户时出错:', error.message)
    return null
  }
}

async function getUserProfile(userId) {
  console.log(`获取用户档案: ${userId}`)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('获取用户档案失败:', error.message)
      return null
    }
    
    console.log(`✅ 用户档案: challenge_status = ${data.challenge_status}`)
    return data
  } catch (error) {
    console.error('获取用户档案时出错:', error.message)
    return null
  }
}

async function getUserLogs(userId) {
  console.log(`获取用户打卡记录: ${userId}`)
  
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('获取打卡记录失败:', error.message)
      return []
    }
    
    console.log(`✅ 找到 ${data?.length || 0} 条打卡记录`)
    return data || []
  } catch (error) {
    console.error('获取打卡记录时出错:', error.message)
    return []
  }
}

async function deleteAllUserLogs(userId) {
  console.log(`删除用户所有打卡记录: ${userId}`)
  
  try {
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', userId)
    
    if (error) {
      console.error('删除打卡记录失败:', error.message)
      return false
    }
    
    console.log('✅ 所有打卡记录已删除')
    return true
  } catch (error) {
    console.error('删除打卡记录时出错:', error.message)
    return false
  }
}

async function resetUserChallenge(userId) {
  console.log(`重置用户挑战状态: ${userId}`)
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        challenge_status: 'not_started',
        challenge_start_date: null,
        challenge_success_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) {
      console.error('重置挑战状态失败:', error.message)
      return false
    }
    
    console.log('✅ 挑战状态已重置为 not_started')
    return true
  } catch (error) {
    console.error('重置挑战状态时出错:', error.message)
    return false
  }
}

async function verifyReset(userId) {
  console.log(`验证重置结果: ${userId}`)
  
  try {
    // 获取更新后的档案
    const profile = await getUserProfile(userId)
    
    // 获取更新后的打卡记录
    const logs = await getUserLogs(userId)
    
    console.log('\n📊 验证结果:')
    console.log(`- 挑战状态: ${profile?.challenge_status || '未知'}`)
    console.log(`- 挑战开始日期: ${profile?.challenge_start_date || 'null'}`)
    console.log(`- 剩余打卡记录: ${logs?.length || 0} 条`)
    
    return {
      profile,
      logCount: logs?.length || 0
    }
  } catch (error) {
    console.error('验证时出错:', error.message)
    return null
  }
}

async function main() {
  console.log('=== 开始重置用户 allyhesmile@hotmail.com 的挑战状态 ===\n')
  
  const targetEmail = 'allyhesmile@hotmail.com'
  
  // 1. 查找用户
  const user = await getUserByEmail(targetEmail)
  if (!user) {
    console.error('❌ 无法继续，用户未找到')
    return
  }
  
  // 2. 获取当前状态
  console.log('\n📋 当前状态:')
  const profile = await getUserProfile(user.id)
  const logs = await getUserLogs(user.id)
  
  console.log(`- 挑战状态: ${profile?.challenge_status || '未知'}`)
  console.log(`- 打卡记录数: ${logs?.length || 0}`)
  
  if (logs.length > 0) {
    console.log('打卡记录状态分布:')
    const statusCount = logs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1
      return acc
    }, {})
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} 条`)
    })
  }
  
  // 3. 确认重置
  console.log('\n⚠️  确认执行以下操作:')
  console.log('1. 删除所有打卡记录（无论状态）')
  console.log('2. 重置挑战状态为 not_started')
  console.log('3. 清空挑战开始日期和成功日期')
  
  // 4. 执行重置
  console.log('\n🔄 执行重置操作...')
  
  // 删除所有打卡记录
  const deleteSuccess = await deleteAllUserLogs(user.id)
  if (!deleteSuccess) {
    console.error('❌ 删除打卡记录失败')
    return
  }
  
  // 重置挑战状态
  const resetSuccess = await resetUserChallenge(user.id)
  if (!resetSuccess) {
    console.error('❌ 重置挑战状态失败')
    return
  }
  
  // 5. 验证结果
  console.log('\n✅ 重置操作完成，正在验证...')
  await verifyReset(user.id)
  
  console.log('\n🎉 重置完成！')
  console.log('用户 allyhesmile@hotmail.com 现在可以:')
  console.log('1. 重新开始7天挑战')
  console.log('2. 从第一天开始打卡')
  console.log('3. 所有历史记录已清除')
}

// 执行主函数
main().catch(console.error)