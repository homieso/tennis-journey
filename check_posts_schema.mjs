import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  try {
    // Get one row to see columns
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching posts:', error)
      // Try to get error details
      console.error('Code:', error.code, 'Message:', error.message, 'Details:', error.details)
      return
    }
    
    console.log('Post columns:', Object.keys(data))
    console.log('Sample post:', JSON.stringify(data, null, 2))
    
    // Check if like_count exists
    if ('like_count' in data) {
      console.log('✅ like_count column exists')
    } else {
      console.log('❌ like_count column missing')
    }
    if ('comment_count' in data) {
      console.log('✅ comment_count column exists')
    } else {
      console.log('❌ comment_count column missing')
    }
    if ('repost_count' in data) {
      console.log('✅ repost_count column exists')
    } else {
      console.log('❌ repost_count column missing')
    }
    if ('media_urls' in data) {
      console.log('✅ media_urls column exists')
    } else {
      console.log('❌ media_urls column missing')
    }
  } catch (err) {
    console.error('Exception:', err)
  }
}

checkSchema()