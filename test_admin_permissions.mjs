import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('=== 管理员权限测试 ===')
  
  // 1. 检查 posts 表是否有 is_announcement 字段
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('查询 posts 失败:', error)
    } else {
      console.log('posts 表列:', Object.keys(data).sort())
      const hasAnnouncement = 'is_announcement' in data
      console.log('✅ 是否有 is_announcement 字段:', hasAnnouncement)
      if (hasAnnouncement) {
        console.log('  示例值:', data.is_announcement)
      }
    }
  } catch (err) {
    console.error('异常:', err)
  }

  // 2. 测试管理员删除权限（通过尝试删除一个不存在的帖子来验证RLS策略是否存在）
  // 注意：这不会实际删除，因为帖子ID无效
  console.log('\n=== 测试管理员删除权限 ===')
  const fakePostId = '00000000-0000-0000-0000-000000000000'
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', fakePostId)
  
  // 预期错误应为 "row not found" 或 "RLS policy violation"
  console.log('删除操作错误:', deleteError?.message || '无错误（可能策略允许）')
  
  // 3. 测试公告创建（模拟管理员发布）
  console.log('\n=== 测试公告创建 ===')
  const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  // 不实际插入，仅检查字段结构
  console.log('管理员 UUID:', adminUserId)
  
  // 4. 检查翻译键是否存在（无法检查，仅提醒）
  console.log('\n=== 翻译键检查 ===')
  console.log('请确保以下键存在于 i18n.js 中:')
  console.log('  - admin.announcement_label')
  console.log('  - admin.mark_as_announcement')
  console.log('  - admin.announcement_hint')
  
  console.log('\n✅ 测试完成')
}

test()