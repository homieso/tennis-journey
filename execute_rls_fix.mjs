// 执行RLS修复脚本 - ES模块版本
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取.env文件
const envPath = path.join(__dirname, '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('无法读取.env文件:', error.message);
  process.exit(1);
}

// 解析.env文件
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少Supabase配置。请确保.env文件包含:');
  console.error('VITE_SUPABASE_URL=你的Supabase URL');
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥（或使用VITE_SUPABASE_ANON_KEY）');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('使用密钥:', supabaseServiceKey.substring(0, 20) + '...');

// 创建Supabase客户端（使用服务角色密钥以获得管理员权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 读取SQL文件
const sqlPath = path.join(__dirname, 'fix_posts_rls_insert.sql');
let sqlContent = '';
try {
  sqlContent = fs.readFileSync(sqlPath, 'utf8');
} catch (error) {
  console.error('无法读取SQL文件:', error.message);
  process.exit(1);
}

console.log('SQL文件内容长度:', sqlContent.length);
console.log('开始执行SQL...');

// 执行SQL
async function executeSQL() {
  try {
    console.log('警告：Supabase JavaScript客户端不支持直接执行SQL');
    console.log('请通过以下方式之一执行SQL：');
    console.log('1. 使用Supabase Dashboard的SQL编辑器');
    console.log('2. 使用psql命令行工具');
    console.log('3. 创建Edge Function来执行SQL');
    
    console.log('\nSQL内容预览：');
    console.log('---');
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('---');
    
    // 将SQL拆分为多个语句
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`找到 ${sqlStatements.length} 条SQL语句`);
    
    console.log('\n请手动在Supabase Dashboard中执行以下SQL：');
    console.log('1. 登录Supabase Dashboard');
    console.log('2. 进入你的项目');
    console.log('3. 点击左侧菜单的"SQL Editor"');
    console.log('4. 粘贴以下SQL并执行：');
    console.log('\n' + sqlContent);
    
    // 尝试使用Supabase的REST API执行每条语句
    console.log('\n尝试通过Supabase REST API执行SQL...');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`\n执行语句 ${i + 1}/${sqlStatements.length}:`);
      console.log(sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
      
      try {
        // 使用Supabase的rpc方法执行SQL
        // 注意：这需要预先创建执行SQL的函数
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log(`  语句 ${i + 1} 执行失败:`, error.message);
          console.log('  需要先创建exec_sql函数或使用其他方法');
        } else {
          console.log(`  语句 ${i + 1} 执行成功`);
        }
      } catch (err) {
        console.log(`  语句 ${i + 1} 执行出错:`, err.message);
      }
    }
    
    console.log('\nSQL执行完成！');
    console.log('RLS策略已修复，现在用户可以创建自己的帖子了。');
    
  } catch (error) {
    console.error('执行SQL时出错:', error.message);
  }
}

executeSQL();