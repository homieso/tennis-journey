// 清理除管理员外的所有用户数据
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

async function executeSQLViaRPC(sql) {
  // 尝试使用 RPC 调用 exec_sql（如果存在）
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      console.log('RPC exec_sql 不可用，尝试其他方法:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.log('RPC 调用失败:', err.message)
    return false
  }
}

async function executeViaFetch(sql) {
  // 使用 REST API 直接执行 SQL（需要 service_role 密钥）
  const sqlApiUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`
  try {
    const response = await fetch(sqlApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseSecretKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ sql })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`SQL 执行失败 (${response.status}):`, errorText)
      return false
    }
    
    return true
  } catch (err) {
    console.log('Fetch 调用失败:', err.message)
    return false
  }
}

async function executeRawSQL(sql) {
  console.log('执行 SQL:')
  console.log(sql.substring(0, 200) + '...')
  
  // 首先尝试 RPC
  const rpcSuccess = await executeSQLViaRPC(sql)
  if (rpcSuccess) {
    console.log('✅ SQL 通过 RPC 执行成功')
    return true
  }
  
  // 如果 RPC 不可用，尝试 fetch
  const fetchSuccess = await executeViaFetch(sql)
  if (fetchSuccess) {
    console.log('✅ SQL 通过 Fetch 执行成功')
    return true
  }
  
  console.log('❌ 无法通过 API 执行 SQL，请手动执行')
  console.log('请前往 Supabase 仪表板 → SQL Editor → 使用 service_role 密钥执行以下 SQL:')
  console.log('---')
  console.log(sql)
  console.log('---')
  return false
}

async function cleanupAllExceptAdmin() {
  console.log('开始清理除管理员外的所有用户数据...')
  console.log(`管理员 UUID: ${ADMIN_UUID}`)
  
  // 定义 SQL 命令（按正确顺序避免外键约束）
  const sqlCommands = [
    // 删除其他用户的社交互动
    `DELETE FROM likes WHERE user_id != '${ADMIN_UUID}';`,
    `DELETE FROM comments WHERE user_id != '${ADMIN_UUID}';`,
    `DELETE FROM reposts WHERE user_id != '${ADMIN_UUID}';`,
    `DELETE FROM follows WHERE follower_id != '${ADMIN_UUID}' OR followed_id != '${ADMIN_UUID}';`,
    
    // 删除其他用户的打卡记录
    `DELETE FROM daily_logs WHERE user_id != '${ADMIN_UUID}';`,
    
    // 删除其他用户的球探报告
    `DELETE FROM scout_reports WHERE user_id != '${ADMIN_UUID}';`,
    
    // 删除其他用户的帖子
    `DELETE FROM posts WHERE user_id != '${ADMIN_UUID}';`,
    
    // 删除其他用户的档案
    `DELETE FROM profiles WHERE id != '${ADMIN_UUID}';`,
    
    // 最后删除其他用户（谨慎执行）
    `DELETE FROM auth.users WHERE id != '${ADMIN_UUID}';`
  ]
  
  let successCount = 0
  let totalCount = sqlCommands.length
  
  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i]
    console.log(`\n[${i + 1}/${totalCount}] 执行命令 ${i + 1}...`)
    
    const success = await executeRawSQL(sql)
    if (success) {
      successCount++
    }
    
    // 短暂延迟以避免速率限制
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n--- 清理完成 ---`)
  console.log(`成功执行: ${successCount}/${totalCount} 条命令`)
  
  if (successCount === totalCount) {
    console.log('✅ 所有清理命令执行成功')
  } else {
    console.log('⚠️ 部分命令可能未执行，请检查上方日志')
  }
  
  return successCount === totalCount
}

async function verifyCleanup() {
  console.log('\n--- 验证清理结果 ---')
  
  try {
    // 检查各表记录数
    const tables = [
      { name: 'likes', query: `SELECT COUNT(*) FROM likes WHERE user_id != '${ADMIN_UUID}'` },
      { name: 'comments', query: `SELECT COUNT(*) FROM comments WHERE user_id != '${ADMIN_UUID}'` },
      { name: 'reposts', query: `SELECT COUNT(*) FROM reposts WHERE user_id != '${ADMIN_UUID}'` },
      { name: 'follows', query: `SELECT COUNT(*) FROM follows WHERE follower_id != '${ADMIN_UUID}' OR followed_id != '${ADMIN_UUID}'` },
      { name: 'daily_logs', query: `SELECT COUNT(*) FROM daily_logs WHERE user_id != '${ADMIN_UUID}'` },
      { name: 'scout_reports', query: `SELECT COUNT(*) FROM scout_reports WHERE user_id != '${ADMIN_UUID}'` },
      { name: 'posts', query: `SELECT COUNT(*) FROM posts WHERE user_id != '${ADMIN_UUID}'` },
      { name: 'profiles', query: `SELECT COUNT(*) FROM profiles WHERE id != '${ADMIN_UUID}'` }
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: table.query })
        if (!error) {
          console.log(`表 ${table.name} 中非管理员记录数: ${data}`)
        } else {
          // 尝试使用 SELECT 查询
          const { data: countData } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .neq('user_id', ADMIN_UUID)
          console.log(`表 ${table.name} 中非管理员记录数: ${countData?.length || 0}`)
        }
      } catch (err) {
        console.log(`表 ${table.name} 验证失败: ${err.message}`)
      }
    }
    
    // 检查总用户数
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    console.log(`总用户档案数: ${profiles?.length || 0}`)
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email')
    console.log('剩余用户档案:', allProfiles || [])
    
  } catch (err) {
    console.log('验证过程中出错:', err.message)
  }
}

// 主执行函数
async function main() {
  console.log('=== Tennis Journey 数据库清理脚本 ===')
  console.log('此脚本将删除除管理员外的所有用户数据。')
  console.log('请确保您已备份重要数据！')
  
  // 可选：询问确认（在非交互式环境中跳过）
  // 直接执行
  
  const cleanupSuccess = await cleanupAllExceptAdmin()
  
  if (cleanupSuccess) {
    await verifyCleanup()
  }
  
  console.log('\n=== 脚本执行完成 ===')
}

main().catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})