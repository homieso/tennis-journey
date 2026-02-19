import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function testLikeTrigger() {
  console.log('=== 测试点赞触发器功能 ===')
  
  // 1. 获取一个帖子
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, like_count')
    .limit(1)
  
  if (postsError || !posts || posts.length === 0) {
    console.error('无法获取帖子:', postsError?.message)
    return
  }
  
  const post = posts[0]
  console.log(`初始状态 - 帖子 ID: ${post.id}, like_count: ${post.like_count}`)
  
  // 2. 插入点赞
  const testUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c' // 管理员ID
  console.log(`插入点赞，用户: ${testUserId}`)
  
  const { data: likeData, error: insertError } = await supabase
    .from('likes')
    .insert([{ user_id: testUserId, post_id: post.id }])
    .select()
  
  if (insertError) {
    console.error('插入点赞失败:', insertError.message)
    return
  }
  
  console.log('插入点赞成功，ID:', likeData[0].id)
  
  // 3. 等待一小段时间让触发器执行
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 4. 检查帖子 like_count 是否增加
  const { data: updatedPost, error: fetchError } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', post.id)
    .single()
  
  if (fetchError) {
    console.error('获取更新后帖子失败:', fetchError.message)
  } else {
    console.log(`更新后 like_count: ${updatedPost.like_count}`)
    if (updatedPost.like_count === post.like_count + 1) {
      console.log('✅ 触发器正常工作，like_count 已增加')
    } else {
      console.log(`❌ 触发器可能未工作，期望 ${post.like_count + 1}，实际 ${updatedPost.like_count}`)
    }
  }
  
  // 5. 删除点赞，检查 like_count 减少
  console.log('删除点赞...')
  const { error: deleteError } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', testUserId)
    .eq('post_id', post.id)
  
  if (deleteError) {
    console.error('删除点赞失败:', deleteError.message)
    return
  }
  
  console.log('点赞删除成功')
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 6. 再次检查 like_count
  const { data: finalPost, error: finalError } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', post.id)
    .single()
  
  if (finalError) {
    console.error('获取最终帖子失败:', finalError.message)
  } else {
    console.log(`最终 like_count: ${finalPost.like_count}`)
    if (finalPost.like_count === post.like_count) {
      console.log('✅ 触发器正常工作，like_count 已恢复')
    } else {
      console.log(`❌ 触发器可能未工作，期望 ${post.like_count}，实际 ${finalPost.like_count}`)
    }
  }
  
  // 7. 检查触发器是否存在
  console.log('\n=== 检查触发器信息 ===')
  const { data: triggerData, error: triggerError } = await supabase
    .rpc('exec_sql', { sql: `
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'likes'
    ` })
  
  if (triggerError) {
    console.log('无法通过 RPC 查询触发器，尝试直接 SQL（可能需要服务角色）')
    // 使用原始 SQL 查询（需要启用 SQL 执行）
    const { data: directData, error: directError } = await supabase
      .from('_execute')
      .select('*')
      .eq('query', `
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'likes'
      `)
    
    if (directError) {
      console.error('直接 SQL 查询失败:', directError.message)
    } else {
      console.log('触发器信息:', directData)
    }
  } else {
    console.log('触发器信息:', triggerData)
  }
}

testLikeTrigger().catch(console.error)