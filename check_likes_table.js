import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function checkLikesTable() {
  console.log('检查 likes 表...')
  // 检查 likes 表是否存在
  const { data: tableExists, error: tableError } = await supabase
    .from('likes')
    .select('count', { count: 'exact', head: true })
  
  if (tableError) {
    console.error('likes 表可能不存在:', tableError.message)
    return false
  }
  
  console.log('✅ likes 表存在')
  
  // 检查触发器
  console.log('检查触发器...')
  const { data: triggerData, error: triggerError } = await supabase
    .rpc('check_trigger_existence', { table_name: 'likes', trigger_name: 'trigger_update_post_like_count' })
  
  if (triggerError) {
    console.log('无法直接检查触发器，尝试查询信息模式')
    // 使用 SQL 查询信息模式
    const { data: infoData, error: infoError } = await supabase
      .rpc('exec_sql', { sql: `
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'likes'
          AND trigger_name = 'trigger_update_post_like_count'
      ` })
    
    if (infoError) {
      console.error('无法查询触发器:', infoError.message)
    } else {
      if (infoData && infoData.length > 0) {
        console.log('✅ 点赞触发器存在:', infoData[0])
      } else {
        console.log('❌ 点赞触发器不存在')
      }
    }
  } else {
    console.log('触发器检查结果:', triggerData)
  }
  
  // 检查 posts 表的 like_count 字段
  console.log('检查 posts.like_count 字段...')
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('id, like_count')
    .limit(1)
  
  if (postError) {
    console.error('无法查询 posts 表:', postError.message)
  } else {
    console.log('✅ posts.like_count 字段存在，示例:', postData[0])
  }
  
  // 测试插入点赞
  console.log('测试点赞功能...')
  const testPostId = '00000000-0000-0000-0000-000000000000' // 虚拟ID
  const testUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c' // 管理员ID
  
  // 先检查是否有帖子
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id')
    .limit(1)
  
  if (postsError || !posts || posts.length === 0) {
    console.log('没有找到帖子，跳过插入测试')
    return
  }
  
  const realPostId = posts[0].id
  console.log('使用帖子 ID:', realPostId)
  
  // 尝试插入点赞
  const { data: insertData, error: insertError } = await supabase
    .from('likes')
    .insert([
      { user_id: testUserId, post_id: realPostId }
    ])
    .select()
  
  if (insertError) {
    console.error('❌ 插入点赞失败:', insertError.message)
    console.log('可能原因：RLS 策略、唯一约束、外键约束')
  } else {
    console.log('✅ 插入点赞成功:', insertData)
    
    // 删除测试点赞
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', testUserId)
      .eq('post_id', realPostId)
    
    if (deleteError) {
      console.error('删除测试点赞失败:', deleteError.message)
    } else {
      console.log('✅ 删除测试点赞成功')
    }
  }
}

checkLikesTable().catch(console.error)