// 直接执行SQL脚本修复性别约束
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

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

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`读取SQL文件: ${filePath}`)
    console.log(`SQL长度: ${sql.length} 字符`)
    
    // 将SQL分割成单独的语句执行
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    console.log(`发现 ${statements.length} 条SQL语句`)
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim()
      if (!stmt) continue
      
      console.log(`\n执行语句 ${i + 1}/${statements.length}:`)
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''))
      
      try {
        // 尝试通过 exec_sql 函数执行
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: stmt
        })
        
        if (error) {
          console.log(`语句 ${i + 1} 执行错误: ${error.message}`)
          console.log('尝试通过REST API执行...')
          
          // 尝试通过 REST API 执行
          await executeViaRestAPI(stmt)
        } else {
          console.log(`✅ 语句 ${i + 1} 执行成功`)
          if (data) console.log('结果:', data)
        }
      } catch (err) {
        console.log(`❌ 语句 ${i + 1} 执行失败:`, err.message)
      }
    }
    
    console.log('\n✅ SQL文件执行完成')
  } catch (error) {
    console.error('❌ 执行SQL文件失败:', error)
  }
}

async function executeViaRestAPI(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql_query: sql })
    })
    
    if (!response.ok) {
      throw new Error(`REST API错误: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ REST API执行成功')
    return data
  } catch (error) {
    console.log(`❌ REST API执行失败: ${error.message}`)
    throw error
  }
}

async function main() {
  console.log('=== 开始修复性别约束 ===')
  
  // 检查命令行参数
  const sqlFile = process.argv[2] || 'fix_gender_constraint.sql'
  
  // 执行SQL文件
  await executeSQLFile(path.join(process.cwd(), sqlFile))
  
  console.log('\n=== 执行完成 ===')
}

main().catch(console.error)