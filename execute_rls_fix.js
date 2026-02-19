// 执行RLS修复脚本
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
    // 使用Supabase的rpc方法执行SQL
    // 注意：Supabase JavaScript客户端不直接支持执行任意SQL
    // 我们需要使用Edge Function或REST API
    
    console.log('警告：Supabase JavaScript客户端不支持直接执行SQL');
    console.log('请通过以下方式之一执行SQL：');
    console.log('1. 使用Supabase Dashboard的SQL编辑器');
    console.log('2. 使用psql命令行工具');
    console.log('3. 创建Edge Function来执行SQL');
    
    console.log('\nSQL内容预览：');
    console.log('---');
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('---');
    
    // 尝试使用Supabase的REST API
    console.log('\n尝试通过REST API执行SQL...');
    
    // 将SQL拆分为多个语句
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`找到 ${sqlStatements.length} 条SQL语句`);
    
    // 由于Supabase REST API限制，我们无法直接执行任意SQL
    // 这里只显示SQL内容，需要手动执行
    
    console.log('\n请手动在Supabase Dashboard中执行以下SQL：');
    console.log('1. 登录Supabase Dashboard');
    console.log('2. 进入你的项目');
    console.log('3. 点击左侧菜单的"SQL Editor"');
    console.log('4. 粘贴以下SQL并执行：');
    console.log('\n' + sqlContent);
    
  } catch (error) {
    console.error('执行SQL时出错:', error.message);
  }
}

executeSQL();