// 清理帖子并插入管理员公告
import { createClient } from '@supabase/supabase-js'

// 直接从.env文件中复制值（这些值在客户端也是公开的）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseAnonKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

// 使用匿名密钥创建客户端（需要服务角色密钥来绕过RLS）
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function cleanupAndInsert() {
  console.log('开始清理社区帖子并插入管理员公告...')
  
  try {
    // 1. 首先获取当前所有帖子
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id, content, created_at')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('获取帖子失败:', fetchError)
      return
    }
    
    console.log(`当前有 ${posts?.length || 0} 条帖子`)
    
    // 2. 删除所有非管理员发布的帖子
    const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .neq('user_id', adminUserId)
    
    if (deleteError) {
      console.error('删除非管理员帖子失败:', deleteError)
      // 可能是RLS限制，继续执行插入
    } else {
      console.log('已删除所有非管理员帖子')
    }
    
    // 3. 获取管理员现有帖子，只保留最新的3条
    const { data: adminPosts, error: adminError } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', adminUserId)
      .order('created_at', { ascending: false })
    
    if (!adminError && adminPosts && adminPosts.length > 3) {
      const idsToDelete = adminPosts.slice(3).map(p => p.id)
      if (idsToDelete.length > 0) {
        const { error: deleteOldError } = await supabase
          .from('posts')
          .delete()
          .in('id', idsToDelete)
        
        if (!deleteOldError) {
          console.log(`已删除 ${idsToDelete.length} 条旧的管理员帖子`)
        }
      }
    }
    
    // 4. 插入新的管理员公告帖子
    const newPosts = [
      {
        user_id: adminUserId,
        content: '欢迎来到 Tennis Journey！🏆\n\n本产品希望帮助每一位网球爱好者记录成长，连接全球球友。我是开发者兼社区管理人员 Homie。完成7天挑战，解锁你的专属AI球探报告！',
        created_at: new Date().toISOString()
      },
      {
        user_id: adminUserId,
        content: '新用户必读 📖\n\n作为新用户，希望你完成7天挑战，审核通过后立即解锁专属AI球探报告以及全球网球社区交流平台。7天，遇见更好的自己。',
        created_at: new Date(Date.now() - 60 * 1000).toISOString() // 1分钟前
      },
      {
        user_id: adminUserId,
        content: '社区交流规范 🤝\n\n友善互动，分享网球心得，禁止广告与不当言论。让我们共同维护一个高质量的网球社区。',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2分钟前
      }
    ]
    
    const { error: insertError } = await supabase
      .from('posts')
      .insert(newPosts)
    
    if (insertError) {
      console.error('插入管理员帖子失败:', insertError)
    } else {
      console.log('成功插入3条管理员公告帖子')
    }
    
    // 5. 验证结果
    const { data: finalPosts } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('清理后的帖子:')
    finalPosts?.forEach((post, i) => {
      console.log(`${i + 1}. ${post.content.substring(0, 50)}... (${post.created_at})`)
    })
    
    console.log('✅ 社区帖子清理完成')
    
  } catch (error) {
    console.error('清理过程中出现错误:', error)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupAndInsert()
}

export { cleanupAndInsert }