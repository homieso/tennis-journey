import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
  try {
    const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
    console.log('Checking profiles for user:', adminUserId)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUserId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      console.error('Code:', error.code, 'Message:', error.message)
      return
    }
    
    console.log('Profile found:', JSON.stringify(data, null, 2))
    
    // Check if profiles table has username column
    console.log('Profile columns:', Object.keys(data))
  } catch (err) {
    console.error('Exception:', err)
  }
}

checkProfiles()