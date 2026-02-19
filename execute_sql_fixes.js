import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function executeSQL(sql) {
  try {
    console.log('执行SQL语句...')
    // 尝试使用RPC执行SQL
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

async function runFixes() {
  console.log('=== 执行数据库修复 ===')
  
  // 1. 添加 posts 表缺失字段
  const sql1 = `
    -- 添加 is_published 字段（如果不存在）
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
    
    -- 添加 published_at 字段
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
    
    -- 添加 report_id 字段
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES scout_reports(id);
  `
  
  console.log('1. 添加 posts 表缺失字段...')
  const success1 = await executeSQL(sql1)
  
  if (!success1) {
    console.log('❌ 无法通过RPC执行SQL，请手动执行以下SQL语句：')
    console.log(sql1)
    console.log('\n请登录Supabase仪表板，进入SQL编辑器，粘贴并执行上述SQL。')
  }
  
  // 2. 添加 scout_reports 表缺失字段（如果尚未添加）
  const sql2 = `
    -- 确保 scout_reports 表有 is_published 字段
    ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
    
    -- 确保 scout_reports 表有 published_at 字段
    ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
    
    -- 确保 scout_reports 表有 post_id 字段
    ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id);
  `
  
  console.log('\n2. 添加 scout_reports 表缺失字段...')
  const success2 = await executeSQL(sql2)
  
  if (!success2) {
    console.log('❌ 无法通过RPC执行SQL，请手动执行以下SQL语句：')
    console.log(sql2)
  }
  
  // 3. 验证字段添加结果
  const sql3 = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns 
    WHERE table_name IN ('posts', 'scout_reports')
      AND column_name IN ('is_published', 'published_at', 'report_id', 'post_id')
    ORDER BY table_name, column_name;
  `
  
  console.log('\n3. 验证字段添加结果...')
  const { data: result, error: resultError } = await supabase.rpc('exec_sql', { sql: sql3 })
  
  if (resultError) {
    console.error('无法验证字段:', resultError.message)
  } else {
    console.log('字段检查结果:')
    if (result && result.length > 0) {
      result.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
      })
    } else {
      console.log('  未找到指定字段')
    }
  }
  
  console.log('\n=== 数据库修复完成 ===')
  console.log('如果SQL执行失败，请手动执行上述SQL语句。')
}

runFixes().catch(console.error)