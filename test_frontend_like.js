// 模拟前端点赞流程测试
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// 模拟前端环境
global.fetch = fetch

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseAnonKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function simulateFrontendLike() {
  console.log('=== 模拟前端点赞流程 ===')
  
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
  console.log(`帖子 ID: ${post.id}, 当前点赞数: ${post.like_count}`)
  
  // 2. 模拟用户登录（使用已知用户）
  const testUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  console.log(`模拟用户 ID: ${testUserId}`)
  
  // 3. 检查用户是否已点赞（模拟 checkUserInteractions）
  console.log('检查用户互动状态...')
  const { data: existingLikes, error: checkError } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', testUserId)
    .eq('post_id', post.id)
  
  if (checkError) {
    console.error('检查点赞失败:', checkError.message)
    return
  }
  
  const alreadyLiked = existingLikes && existingLikes.length > 0
  console.log(`用户已点赞: ${alreadyLiked}`)
  
  // 4. 模拟点赞操作（如果未点赞）
  if (!alreadyLiked) {
    console.log('执行点赞操作...')
    const { data: likeData, error: insertError } = await supabase
      .from('likes')
      .insert([{ user_id: testUserId, post_id: post.id }])
      .select()
    
    if (insertError) {
      console.error('点赞失败:', insertError.message)
      return
    }
    
    console.log('点赞成功，ID:', likeData[0].id)
    
    // 5. 验证点赞计数更新
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: updatedPost, error: fetchError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', post.id)
      .single()
    
    if (fetchError) {
      console.error('获取更新后帖子失败:', fetchError.message)
    } else {
      console.log(`更新后点赞数: ${updatedPost.like_count}`)
      if (updatedPost.like_count === post.like_count + 1) {
        console.log('✅ 点赞计数正确更新')
      } else {
        console.log(`❌ 点赞计数更新错误，期望 ${post.like_count + 1}，实际 ${updatedPost.like_count}`)
      }
    }
    
    // 6. 再次检查点赞状态
    const { data: recheckLikes, error: recheckError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', testUserId)
      .eq('post_id', post.id)
    
    if (recheckError) {
      console.error('重新检查点赞失败:', recheckError.message)
    } else {
      console.log(`重新检查点赞数量: ${recheckLikes.length}`)
    }
    
    // 7. 取消点赞
    console.log('取消点赞...')
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', testUserId)
      .eq('post_id', post.id)
    
    if (deleteError) {
      console.error('取消点赞失败:', deleteError.message)
    } else {
      console.log('取消点赞成功')
      
      // 8. 验证取消点赞后计数
      await new Promise(resolve => setTimeout(resolve, 500))
      const { data: finalPost, error: finalError } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', post.id)
        .single()
      
      if (finalError) {
        console.error('获取最终帖子失败:', finalError.message)
      } else {
        console.log(`最终点赞数: ${finalPost.like_count}`)
        if (finalPost.like_count === post.like_count) {
          console.log('✅ 取消点赞后计数正确恢复')
        } else {
          console.log(`❌ 取消点赞后计数错误，期望 ${post.like_count}，实际 ${finalPost.like_count}`)
        }
      }
    }
  } else {
    console.log('用户已点赞，跳过测试')
  }
  
  // 9. 测试并发点赞（模拟多个用户同时点赞）
  console.log('\n=== 测试并发点赞 ===')
  const testUserIds = [
    'dcee2e34-45f0-4506-9bac-4bdf0956273c',
    '00000000-0000-0000-0000-000000000001', // 虚拟用户1
    '00000000-0000-0000-0000-000000000002'  // 虚拟用户2
  ]
  
  // 先清理可能存在的点赞
  for (const userId of testUserIds) {
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', post.id)
      .catch(() => {})
  }
  
  // 获取初始计数
  const { data: initialPost } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', post.id)
    .single()
  
  console.log(`初始点赞数: ${initialPost.like_count}`)
  
  // 模拟两个用户点赞（使用真实存在的用户ID）
  const realUserIds = ['dcee2e34-45f0-4506-9bac-4bdf0956273c'] // 只使用真实用户
  for (const userId of realUserIds) {
    try {
      const { error: likeError } = await supabase
        .from('likes')
        .insert([{ user_id: userId, post_id: post.id }])
      
      if (likeError) {
        console.error(`用户 ${userId} 点赞失败:`, likeError.message)
      } else {
        console.log(`用户 ${userId} 点赞成功`)
      }
    } catch (error) {
      console.error(`用户 ${userId} 点赞异常:`, error.message)
    }
  }
  
  // 等待触发器执行
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 检查最终计数
  const { data: finalPost } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', post.id)
    .single()
  
  console.log(`最终点赞数: ${finalPost.like_count}`)
  console.log(`点赞增加数: ${finalPost.like_count - initialPost.like_count}`)
  
  // 清理测试数据
  console.log('\n清理测试数据...')
  for (const userId of realUserIds) {
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', post.id)
      .catch(() => {})
  }
  
  console.log('测试完成')
}

simulateFrontendLike().catch(console.error)