// 清理除管理员外的所有用户数据（使用服务角色密钥）
import { createClient } from '@supabase/supabase-js'

// Supabase 配置（使用服务角色密钥）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 管理员 UUID
const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

// 创建具有 service_role 权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function countTableRecords(tableName, condition = '') {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`  查询 ${tableName} 记录数失败: ${error.message}`)
      return -1
    }
    return count
  } catch (err) {
    console.log(`  查询 ${tableName} 记录数异常: ${err.message}`)
    return -1
  }
}

async function countNonAdminRecords(tableName, userIdColumn = 'user_id') {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .neq(userIdColumn, ADMIN_UUID)
    
    if (error) {
      // 可能列名不同，尝试其他列名
      if (userIdColumn !== 'user_id') {
        console.log(`  使用列 ${userIdColumn} 查询 ${tableName} 非管理员记录失败: ${error.message}`)
      }
      return -1
    }
    return count
  } catch (err) {
    return -1
  }
}

async function deleteFromTable(tableName, conditionColumn = 'user_id') {
  console.log(`  正在删除表 ${tableName} 中非管理员数据...`)
  
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq(conditionColumn, ADMIN_UUID)
    
    if (error) {
      console.log(`  删除失败: ${error.message}`)
      return false
    }
    
    console.log(`  删除完成`)
    return true
  } catch (err) {
    console.log(`  删除异常: ${err.message}`)
    return false
  }
}

async function deleteFromFollows() {
  console.log(`  正在删除表 follows 中非管理员数据...`)
  
  try {
    // follows 表有两个用户ID列：follower_id 和 followed_id
    // 删除任何涉及非管理员的关注关系
    const { error } = await supabase
      .from('follows')
      .delete()
      .or(`follower_id.neq.${ADMIN_UUID},followed_id.neq.${ADMIN_UUID}`)
    
    if (error) {
      console.log(`  删除失败: ${error.message}`)
      return false
    }
    
    console.log(`  删除完成`)
    return true
  } catch (err) {
    console.log(`  删除异常: ${err.message}`)
    return false
  }
}

async function deleteFromProfiles() {
  console.log(`  正在删除表 profiles 中非管理员数据...`)
  
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .neq('id', ADMIN_UUID)
    
    if (error) {
      console.log(`  删除失败: ${error.message}`)
      return false
    }
    
    console.log(`  删除完成`)
    return true
  } catch (err) {
    console.log(`  删除异常: ${err.message}`)
    return false
  }
}

async function deleteFromAuthUsers() {
  console.log(`  正在删除表 auth.users 中非管理员数据...`)
  
  // 注意：auth.users 表通常不能通过 Supabase JS 客户端直接访问
  // 我们需要使用管理 API 或 SQL
  console.log(`  ⚠️ 无法通过 JS 客户端直接删除 auth.users 表中的数据`)
  console.log(`  请手动在 Supabase SQL Editor 中执行:`)
  console.log(`  DELETE FROM auth.users WHERE id != '${ADMIN_UUID}';`)
  return false
}

async function verifyCurrentState() {
  console.log('\n=== 当前数据库状态 ===')
  
  const tables = [
    { name: 'likes', idColumn: 'user_id' },
    { name: 'comments', idColumn: 'user_id' },
    { name: 'reposts', idColumn: 'user_id' },
    { name: 'follows', idColumn: 'follower_id' },
    { name: 'daily_logs', idColumn: 'user_id' },
    { name: 'scout_reports', idColumn: 'user_id' },
    { name: 'posts', idColumn: 'user_id' },
    { name: 'profiles', idColumn: 'id' }
  ]
  
  for (const table of tables) {
    const total = await countTableRecords(table.name)
    const nonAdmin = await countNonAdminRecords(table.name, table.idColumn)
    console.log(`  ${table.name}: 总记录数=${total}, 非管理员记录数=${nonAdmin}`)
  }
  
  // 尝试获取 profiles 表中的所有用户
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(10)
    
    if (!error && profiles && profiles.length > 0) {
      console.log(`  当前用户档案 (最多10个):`)
      profiles.forEach(p => {
        const isAdmin = p.id === ADMIN_UUID ? ' (管理员)' : ''
        console.log(`    - ${p.id} ${p.email}${isAdmin}`)
      })
    }
  } catch (err) {
    // 忽略
  }
}

async function performCleanup() {
  console.log('\n=== 开始清理操作 ===')
  
  // 按顺序删除（避免外键约束）
  const steps = [
    { name: 'likes', fn: () => deleteFromTable('likes', 'user_id') },
    { name: 'comments', fn: () => deleteFromTable('comments', 'user_id') },
    { name: 'reposts', fn: () => deleteFromTable('reposts', 'user_id') },
    { name: 'follows', fn: () => deleteFromFollows() },
    { name: 'daily_logs', fn: () => deleteFromTable('daily_logs', 'user_id') },
    { name: 'scout_reports', fn: () => deleteFromTable('scout_reports', 'user_id') },
    { name: 'posts', fn: () => deleteFromTable('posts', 'user_id') },
    { name: 'profiles', fn: () => deleteFromProfiles() },
    { name: 'auth.users', fn: () => deleteFromAuthUsers() }
  ]
  
  let successCount = 0
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    console.log(`\n[${i + 1}/${steps.length}] 清理 ${step.name}...`)
    
    const success = await step.fn()
    if (success) successCount++
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log(`\n--- 清理操作完成 ---`)
  console.log(`成功: ${successCount}/${steps.length} 个步骤`)
  
  return successCount
}

async function verifyAfterCleanup() {
  console.log('\n=== 清理后验证 ===')
  
  const tables = [
    { name: 'likes', idColumn: 'user_id' },
    { name: 'comments', idColumn: 'user_id' },
    { name: 'reposts', idColumn: 'user_id' },
    { name: 'follows', idColumn: 'follower_id' },
    { name: 'daily_logs', idColumn: 'user_id' },
    { name: 'scout_reports', idColumn: 'user_id' },
    { name: 'posts', idColumn: 'user_id' },
    { name: 'profiles', idColumn: 'id' }
  ]
  
  for (const table of tables) {
    const nonAdmin = await countNonAdminRecords(table.name, table.idColumn)
    const total = await countTableRecords(table.name)
    console.log(`  ${table.name}: 总记录数=${total}, 非管理员记录数=${nonAdmin}`)
  }
  
  // 检查管理员档案是否存在
  try {
    const { data: adminProfile, error } = await supabase
      .from('profiles')
      .select('id, email, username')
      .eq('id', ADMIN_UUID)
      .single()
    
    if (!error && adminProfile) {
      console.log(`\n✅ 管理员档案存在: ${adminProfile.email} (${adminProfile.username || '无用户名'})`)
    } else {
      console.log(`\n⚠️ 管理员档案可能不存在或查询失败: ${error?.message || '未找到'}`)
    }
  } catch (err) {
    console.log(`\n⚠️ 查询管理员档案异常: ${err.message}`)
  }
  
  // 检查总用户数
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email', { count: 'exact' })
    
    if (!error) {
      console.log(`\n📊 总用户档案数: ${profiles?.length || 0}`)
      if (profiles && profiles.length > 0) {
        console.log(`剩余用户:`)
        profiles.forEach(p => {
          console.log(`  - ${p.id} ${p.email}`)
        })
      }
    }
  } catch (err) {
    // 忽略
  }
}

async function main() {
  console.log('=== Tennis Journey 数据库清理脚本 (服务角色密钥) ===')
  console.log(`管理员 UUID: ${ADMIN_UUID}`)
  console.log('此脚本将删除除管理员外的所有用户数据。')
  console.log('请确保您已备份重要数据！\n')
  
  // 验证当前状态
  await verifyCurrentState()
  
  // 执行清理
  const successCount = await performCleanup()
  
  // 验证清理结果
  await verifyAfterCleanup()
  
  console.log('\n=== 脚本执行完成 ===')
  if (successCount >= 8) { // 不包括 auth.users
    console.log('✅ 主要清理操作已完成')
    console.log('💡 如需删除 auth.users 中的用户，请手动在 Supabase SQL Editor 中执行:')
    console.log(`   DELETE FROM auth.users WHERE id != '${ADMIN_UUID}';`)
  } else {
    console.log('⚠️ 部分清理操作可能未完成，请检查上方日志')
  }
}

main().catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})