// 检查缺失的触发器函数定义
import { createClient } from '@supabase/supabase-js'

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

async function checkMissingTriggers() {
  try {
    console.log('开始检查缺失的触发器函数定义...\n')
    
    // 需要检查的触发器函数列表
    const requiredFunctions = [
      'update_post_like_count',
      'update_post_comment_count', 
      'update_post_repost_count',
      'update_comment_like_count'
    ]
    
    // 需要检查的触发器列表
    const requiredTriggers = [
      { name: 'trigger_update_post_like_count', table: 'likes' },
      { name: 'trigger_update_post_comment_count', table: 'comments' },
      { name: 'trigger_update_post_repost_count', table: 'reposts' }
    ]
    
    console.log('=== 检查触发器函数定义 ===')
    
    // 检查每个函数是否存在
    for (const funcName of requiredFunctions) {
      try {
        // 尝试调用函数来检查是否存在
        const { data, error } = await supabase.rpc(funcName, { 
          // 传递虚拟参数（函数可能不需要参数）
          dummy: null 
        })
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`❌ 函数 ${funcName}() 不存在`)
          } else {
            console.log(`⚠️  函数 ${funcName}() 存在但调用失败: ${error.message}`)
          }
        } else {
          console.log(`✅ 函数 ${funcName}() 存在`)
        }
      } catch (err) {
        console.log(`❌ 函数 ${funcName}() 不存在或检查失败: ${err.message}`)
      }
    }
    
    console.log('\n=== 检查数据库中的触发器 ===')
    
    // 查询数据库中的触发器
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT 
            tgname as trigger_name,
            tgrelid::regclass as table_name,
            proname as function_name,
            CASE 
              WHEN tgenabled = 'D' THEN 'disabled'
              WHEN tgenabled = 'O' THEN 'origin'
              WHEN tgenabled = 'R' THEN 'replica'
              WHEN tgenabled = 'A' THEN 'always'
              ELSE 'unknown'
            END as status
          FROM pg_trigger t
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE tgname LIKE '%trigger%'
          ORDER BY table_name, trigger_name
        `
      })
      
      if (error) {
        console.log('无法查询触发器信息，尝试其他方法...')
        
        // 尝试直接查询系统表
        const { data: triggersData, error: triggersError } = await supabase
          .from('pg_trigger')
          .select('*')
          .limit(10)
          
        if (triggersError) {
          console.log('无法访问系统表，跳过触发器详细检查')
        } else {
          console.log('找到触发器:', triggersData)
        }
      } else {
        console.log('数据库中的触发器列表:')
        if (data && data.length > 0) {
          data.forEach(trigger => {
            console.log(`  - ${trigger.trigger_name} (表: ${trigger.table_name}, 函数: ${trigger.function_name}, 状态: ${trigger.status})`)
          })
        } else {
          console.log('  未找到触发器')
        }
      }
    } catch (err) {
      console.log('查询触发器时出错:', err.message)
    }
    
    console.log('\n=== 检查缺失的触发器 ===')
    
    // 检查每个必需的触发器是否存在
    for (const trigger of requiredTriggers) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: `
            SELECT COUNT(*) as count
            FROM pg_trigger t
            WHERE tgname = '${trigger.name}'
          `
        })
        
        if (error) {
          console.log(`❌ 无法检查触发器 ${trigger.name}: ${error.message}`)
        } else {
          if (data && data[0] && data[0].count > 0) {
            console.log(`✅ 触发器 ${trigger.name} 存在 (表: ${trigger.table})`)
          } else {
            console.log(`❌ 触发器 ${trigger.name} 不存在 (表: ${trigger.table})`)
          }
        }
      } catch (err) {
        console.log(`❌ 检查触发器 ${trigger.name} 失败: ${err.message}`)
      }
    }
    
    console.log('\n=== 建议的修复方案 ===')
    console.log('1. 如果触发器函数缺失，需要创建以下函数:')
    console.log('   - update_post_like_count()')
    console.log('   - update_post_comment_count()')
    console.log('   - update_post_repost_count()')
    console.log('   - update_comment_like_count() (如果评论点赞功能需要)')
    
    console.log('\n2. 如果触发器缺失，需要创建以下触发器:')
    console.log('   - trigger_update_post_like_count ON likes')
    console.log('   - trigger_update_post_comment_count ON comments')
    console.log('   - trigger_update_post_repost_count ON reposts')
    
    console.log('\n3. 可以执行以下SQL文件来修复:')
    console.log('   - supabase/community_schema_final.sql (包含完整定义)')
    console.log('   - 或重新执行数据库修复脚本')
    
  } catch (error) {
    console.error('检查触发器时发生错误:', error)
  }
}

// 执行检查
checkMissingTriggers()