import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminProfile() {
  const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  
  // First check if profile exists
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', adminUserId)
    .maybeSingle()
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking profile:', fetchError)
    return
  }
  
  if (existing) {
    console.log('Admin profile already exists:', existing)
    return
  }
  
  console.log('Creating admin profile...')
  
  // Create profile
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: adminUserId,
        email: 'admin@tennisjourney.com',
        username: 'TennisJourney',
        gender: 'male',
        playing_years: 10,
        self_rated_ntrp: 5.0,
        idol: 'Roger Federer',
        tennis_style: 'All-around',
        location: 'Global',
        avatar_url: '',
        challenge_status: 'success',
        bio: 'Welcome to Tennis Journey! I\'m the community manager.'
      }
    ])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating profile:', error)
    console.error('Details:', error.details)
    console.error('Hint:', error.hint)
    
    // Try with service role key (if we have it)
    console.log('Trying with service role key...')
    const supabaseService = createClient(supabaseUrl, 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V')
    const { data: data2, error: error2 } = await supabaseService
      .from('profiles')
      .insert([
        {
          id: adminUserId,
          email: 'admin@tennisjourney.com',
          username: 'TennisJourney',
          gender: 'male',
          playing_years: 10,
          self_rated_ntrp: 5.0,
          idol: 'Roger Federer',
          tennis_style: 'All-around',
          location: 'Global',
          avatar_url: '',
          challenge_status: 'success',
          bio: 'Welcome to Tennis Journey! I\'m the community manager.'
        }
      ])
      .select()
      .single()
    
    if (error2) {
      console.error('Service role also failed:', error2)
    } else {
      console.log('Admin profile created with service role:', data2)
    }
  } else {
    console.log('Admin profile created:', data)
  }
}

createAdminProfile()