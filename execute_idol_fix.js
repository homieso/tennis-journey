import { createClient } from '@supabase/supabase-js'

// Supabase配置 - 使用服务角色密钥
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 创建具有service_role权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function executeSQL(sql) {
  try {
    console.log('执行SQL语句...')
    console.log(sql)
    
    // 使用Supabase的RPC执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('RPC执行失败:', error.message)
      return false
    }
    
    console.log('✅ SQL执行成功')
    return true
  } catch (error) {
    console.error('执行SQL失败:', error.message)
    return false
  }
}

async function main() {
  console.log('=== 开始修复 idol 字段约束 ===')
  
  const sql = `
-- 放开 idol 字段约束
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_idol_check;
ALTER TABLE public.profiles ALTER COLUMN idol TYPE TEXT;
`
  
  const success = await executeSQL(sql)
  
  if (success) {
    console.log('\n🎉 idol 字段约束已成功移除！')
    console.log('现在 idol 字段可以接受任意文本。')
  } else {
    console.log('\n❌ SQL执行失败，可能需要手动执行')
    console.log('请前往 Supabase SQL Editor 执行以下SQL：')
    console.log(sql)
  }
}

main().catch(console.error)