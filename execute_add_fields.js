// 执行SQL添加用户名/昵称和个人签名字段
import { createClient } from '@supabase/supabase-js'

// 使用secret key（有service_role权限）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 创建具有service_role权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function executeSQL() {
  try {
    console.log('正在为profiles表添加新字段...')
    
    // SQL语句
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
    
    console.log('执行SQL语句...')
    
    // 尝试使用RPC执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.log('RPC执行失败，尝试直接执行...')
      
      // 尝试直接执行SQL（可能需要使用不同的方法）
      console.log('\n💡 请通过以下方式手动执行SQL：')
      console.log('1. 登录Supabase仪表板 (https://supabase.com/dashboard)')
      console.log('2. 进入SQL编辑器')
      console.log('3. 粘贴并执行以下SQL语句：')
      console.log(sql)
      
      return false
    }
    
    console.log('✅ SQL执行成功！')
    
    // 验证表结构
    console.log('\n验证表结构...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .order('ordinal_position')
    
    if (columnsError) {
      console.error('验证表结构失败:', columnsError)
    } else {
      console.log('✅ profiles表结构：')
      columns.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? '可为空' : '非空'}`)
      })
    }
    
    // 验证测试用户的数据
    console.log('\n验证测试用户数据...')
    const { data: testUser, error: testError } = await supabase
      .from('profiles')
      .select('username, bio, email')
      .eq('id', 'dcee2e34-45f0-4506-9bac-4bdf0956273c')
      .single()
    
    if (testError) {
      console.error('获取测试用户数据失败:', testError)
    } else {
      console.log('✅ 测试用户数据：')
      console.log(`  邮箱: ${testUser.email}`)
      console.log(`  用户名: ${testUser.username}`)
      console.log(`  个人签名: ${testUser.bio}`)
    }
    
    return true
    
  } catch (error) {
    console.error('执行SQL失败:', error)
    return false
  }
}

// 执行SQL
executeSQL().then(success => {
  if (success) {
    console.log('\n🎊 数据库表结构更新完成！')
    console.log('\n📋 下一步：')
    console.log('1. 更新Onboarding页面以包含新字段')
    console.log('2. 更新Profile页面以显示新字段')
    console.log('3. 更新auth.js中的updateProfile函数')
    console.log('4. 更新首页欢迎语使用用户名')
  } else {
    console.log('\n❌ 数据库更新失败，请手动执行SQL')
  }
  process.exit(0)
})