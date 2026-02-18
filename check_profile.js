import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'
const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', ADMIN_UUID)
    .single()
  
  if (error) {
    console.error(error)
    return
  }
  
  console.log('当前 profiles 记录:')
  Object.entries(data).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
}

check()