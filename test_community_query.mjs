import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
  try {
    console.log('Testing Community.jsx query...')
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          gender,
          playing_years,
          self_rated_ntrp,
          idol,
          tennis_style,
          location,
          avatar_url
        ),
        scout_reports!posts_report_id_fkey (
          id,
          generated_at
        )
      `)
      .order('created_at', { ascending: false })
      .range(0, 9)
    
    if (error) {
      console.error('Query error:', error)
      console.error('Code:', error.code, 'Message:', error.message, 'Details:', error.details)
      return
    }
    
    console.log(`Found ${data?.length || 0} posts`)
    if (data && data.length > 0) {
      console.log('First post:', JSON.stringify(data[0], null, 2))
      console.log('Profiles relation:', data[0].profiles)
    }
  } catch (err) {
    console.error('Exception:', err)
  }
}

testQuery()