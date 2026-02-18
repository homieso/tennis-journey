import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
  // Get all profiles (limit 5)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('Error fetching profiles:', error)
    return
  }
  
  console.log(`Found ${data.length} profiles`)
  data.forEach((p, i) => {
    console.log(`Profile ${i}:`, JSON.stringify(p, null, 2))
  })
  
  // Get table schema via query
  console.log('\n--- Checking gender column constraints ---')
  // Try to get check constraint info (limited in Supabase)
  // We can query information_schema if we have permission
  const { data: schema, error: schemaError } = await supabase
    .rpc('exec_sql', { sql: `
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'profiles'::regclass AND contype = 'c'
    ` })
  
  if (schemaError) {
    console.log('Cannot query pg_constraint:', schemaError.message)
  } else {
    console.log('Check constraints:', schema)
  }
}

inspect()