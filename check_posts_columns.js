import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching posts:', error)
      return
    }
    
    console.log('Post columns:', Object.keys(data))
    console.log('Post sample:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Exception:', err)
  }
}

check()