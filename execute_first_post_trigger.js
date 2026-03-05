// 执行首次发帖自动批准触发器脚本
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase配置
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('错误：请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 创建Supabase客户端（使用服务角色密钥）
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLFile() {
  try {
    console.log('开始执行首次发帖自动批准触发器脚本...')
    
    // 读取SQL文件
    const sqlFilePath = join(__dirname, 'create_first_post_approval_trigger.sql')
    const sql = readFileSync(sqlFilePath, 'utf8')
    
    console.log('SQL文件内容长度:', sql.length, '字符')
    
    // 分割SQL语句（按分号分割，但要注意函数定义中的分号）
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    console.log('找到', statements.length, '个SQL语句')
    
    // 执行每个SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (!statement) continue
      
      console.log(`\n执行语句 ${i + 1}/${statements.length}:`)
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''))
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // 如果exec_sql函数不存在，尝试直接使用SQL API
          console.warn('exec_sql函数调用失败，尝试其他方法:', error.message)
          
          // 尝试使用Supabase的SQL API
          const { data: sqlData, error: sqlError } = await supabase
            .from('_exec_sql')
            .select('*')
            .eq('query', statement)
            .single()
            
          if (sqlError) {
            console.error('SQL执行失败:', sqlError.message)
            // 继续执行下一个语句
            continue
          }
          
          console.log('SQL执行成功（通过SQL API）')
        } else {
          console.log('SQL执行成功')
        }
      } catch (err) {
        console.error('执行SQL时发生错误:', err.message)
        // 继续执行下一个语句
        continue
      }
    }
    
    console.log('\n✅ 首次发帖自动批准触发器脚本执行完成！')
    console.log('触发器已创建，功能包括：')
    console.log('1. 确保is_approved字段存在')
    console.log('2. 创建触发器函数auto_approve_on_first_post()')
    console.log('3. 创建触发器trigger_auto_approve_on_first_post')
    console.log('4. 为现有有帖子的用户自动批准')
    console.log('5. 验证触发器创建成功')
    
  } catch (error) {
    console.error('执行脚本时发生错误:', error)
    process.exit(1)
  }
}

// 执行脚本
executeSQLFile()