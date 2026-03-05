// 直接执行SQL脚本
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

// 读取SQL文件
import fs from 'fs'
import path from 'path'

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
      if (stmt.length === 0) continue
      
      console.log(`\n执行语句 ${i + 1}/${statements.length}:`)
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''))
      
      try {
        // 使用RPC执行SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' })
        
        if (error) {
          console.error(`语句 ${i + 1} 执行错误:`, error.message)
          // 尝试使用另一种方法
          await executeViaRestAPI(stmt)
        } else {
          console.log(`语句 ${i + 1} 执行成功`)
          if (data) {
            console.log('返回数据:', JSON.stringify(data).substring(0, 200))
          }
        }
      } catch (err) {
        console.error(`语句 ${i + 1} 执行异常:`, err.message)
      }
      
      // 短暂延迟，避免速率限制
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n✅ SQL文件执行完成')
  } catch (error) {
    console.error('执行SQL文件失败:', error)
  }
}

async function executeViaRestAPI(sql) {
  console.log('尝试通过REST API执行...')
  
  try {
    // 使用Supabase的REST API执行SQL
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
      console.error(`REST API错误: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    console.log('REST API执行成功:', data)
  } catch (error) {
    console.error('REST API执行失败:', error.message)
  }
}

async function main() {
  console.log('=== 开始执行数据库修复SQL ===')
  
  // 执行SQL文件
  await executeSQLFile(path.join(process.cwd(), 'database_complete_fix_final.sql'))
  
  console.log('\n=== 执行完成 ===')
}

main().catch(console.error)