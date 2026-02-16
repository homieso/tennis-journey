// 执行所有SQL脚本并部署Edge Function
import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Supabase配置
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

async function executeAddProfileFields() {
  console.log('\n=== 执行 add_profile_fields.sql ===')
  const sql = `
    -- 添加username字段（用户名/昵称）
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS username VARCHAR(50);

    -- 添加bio字段（个人签名/简介）
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS bio TEXT;

    -- 为现有用户设置默认用户名（使用邮箱前缀）
    UPDATE profiles 
    SET username = SPLIT_PART(email, '@', 1)
    WHERE username IS NULL;

    -- 为现有用户设置默认个人签名
    UPDATE profiles 
    SET bio = '热爱网球，享受每一次击球的快乐！'
    WHERE bio IS NULL;

    -- 创建索引以提高查询性能
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
  `
  
  return await executeSQL(sql)
}

async function executeUpdateScoutReports() {
  console.log('\n=== 执行 update_scout_reports_table.sql ===')
  const sql = `
    -- 添加structured_data字段（存储结构化JSON数据）
    ALTER TABLE scout_reports 
    ADD COLUMN IF NOT EXISTS structured_data JSONB;

    -- 添加report_version字段（报告版本）
    ALTER TABLE scout_reports 
    ADD COLUMN IF NOT EXISTS report_version VARCHAR(10) DEFAULT 'v1.0';

    -- 添加shareable_image_url字段（可分享的长图URL）
    ALTER TABLE scout_reports 
    ADD COLUMN IF NOT EXISTS shareable_image_url TEXT;

    -- 添加qr_code_url字段（分享二维码URL）
    ALTER TABLE scout_reports 
    ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

    -- 为现有报告设置默认版本
    UPDATE scout_reports 
    SET report_version = 'v1.0'
    WHERE report_version IS NULL;

    -- 创建索引以提高JSON查询性能
    CREATE INDEX IF NOT EXISTS idx_scout_reports_structured_data ON scout_reports USING GIN (structured_data);
  `
  
  return await executeSQL(sql)
}

async function verifyTables() {
  console.log('\n=== 验证表结构 ===')
  
  try {
    // 验证profiles表
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .order('ordinal_position')
    
    if (profilesError) {
      console.error('验证profiles表失败:', profilesError)
    } else {
      console.log('✅ profiles表结构：')
      profilesColumns.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? '可为空' : '非空'}`)
      })
    }
    
    // 验证scout_reports表
    const { data: reportsColumns, error: reportsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'scout_reports')
      .order('ordinal_position')
    
    if (reportsError) {
      console.error('验证scout_reports表失败:', reportsError)
    } else {
      console.log('\n✅ scout_reports表结构：')
      reportsColumns.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? '可为空' : '非空'}`)
      })
    }
    
    return true
  } catch (error) {
    console.error('验证表结构失败:', error)
    return false
  }
}

async function deployEdgeFunction() {
  console.log('\n=== 部署Edge Function ===')
  
  try {
    // 使用Supabase CLI部署Edge Function
    const { stdout, stderr } = await execAsync(
      'cd /Users/homieso/Desktop/tennis-journey && npx supabase functions deploy generate-scout-report'
    )
    
    console.log('部署输出:', stdout)
    if (stderr) {
      console.error('部署错误:', stderr)
    }
    
    console.log('✅ Edge Function部署完成')
    return true
  } catch (error) {
    console.error('部署Edge Function失败:', error.message)
    
    // 如果CLI部署失败，提供手动部署指南
    console.log('\n💡 手动部署指南：')
    console.log('1. 登录Supabase仪表板：https://supabase.com/dashboard')
    console.log('2. 进入Edge Functions页面')
    console.log('3. 选择generate-scout-report函数')
    console.log('4. 上传更新后的index.ts文件')
    console.log('5. 点击部署')
    
    return false
  }
}

async function main() {
  console.log('🚀 开始执行数据库更新和Edge Function部署')
  
  // 执行SQL脚本
  const profileSuccess = await executeAddProfileFields()
  const reportsSuccess = await executeUpdateScoutReports()
  
  if (profileSuccess && reportsSuccess) {
    console.log('\n✅ 所有SQL脚本执行成功')
    
    // 验证表结构
    await verifyTables()
    
    // 部署Edge Function
    await deployEdgeFunction()
    
    console.log('\n🎊 所有任务完成！')
    console.log('\n📋 下一步：')
    console.log('1. 测试新报告页面：http://localhost:5174/report/new')
    console.log('2. 触发一次测试报告生成')
    console.log('3. 验证结构化数据存储')
    console.log('4. 测试分享功能')
  } else {
    console.log('\n❌ SQL执行失败，请手动执行SQL脚本')
    console.log('\n💡 手动执行步骤：')
    console.log('1. 登录Supabase仪表板：https://supabase.com/dashboard')
    console.log('2. 进入SQL编辑器')
    console.log('3. 分别执行两个SQL文件中的语句')
  }
}

// 执行主函数
main().catch(console.error)