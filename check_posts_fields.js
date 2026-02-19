import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function checkPostsFields() {
  console.log('检查 posts 表字段...')
  
  // 查询表结构
  const { data, error } = await supabase
    .rpc('exec_sql', { sql: `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'posts'
        AND column_name IN ('is_published', 'published_at', 'report_id')
      ORDER BY column_name
    ` })
  
  if (error) {
    console.error('无法查询字段信息:', error.message)
    // 尝试直接查询
    const { data: directData, error: directError } = await supabase
      .from('posts')
      .select('id')
      .limit(1)
    
    if (directError) {
      console.error('无法查询 posts 表:', directError.message)
      return
    }
    
    console.log('posts 表存在，但无法获取字段详情')
    
    // 尝试插入测试数据检查字段是否存在
    const testPost = {
      user_id: 'dcee2e34-45f0-4506-9bac-4bdf0956273c',
      content: '测试字段检查',
      is_published: false
    }
    
    const { error: insertError } = await supabase
      .from('posts')
      .insert([testPost])
    
    if (insertError) {
      console.log('插入测试数据失败，可能缺少字段:', insertError.message)
    } else {
      console.log('posts 表可以正常插入数据')
      // 清理测试数据
      await supabase
        .from('posts')
        .delete()
        .eq('content', '测试字段检查')
        .catch(() => {})
    }
    
    return
  }
  
  console.log('字段检查结果:')
  if (data && data.length > 0) {
    data.forEach(field => {
      console.log(`  ${field.column_name}: ${field.data_type} (nullable: ${field.is_nullable})`)
    })
  } else {
    console.log('  未找到指定字段')
  }
  
  // 检查 posts 表是否有数据
  const { data: postCount, error: countError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
  
  if (countError) {
    console.error('无法获取帖子数量:', countError.message)
  } else {
    console.log(`posts 表现有记录数: ${postCount}`)
  }
}

checkPostsFields().catch(console.error)