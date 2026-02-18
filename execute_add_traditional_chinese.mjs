import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function executeSQLFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`)
    const sql = readFileSync(filePath, 'utf8')
    console.log('SQL content (first 500 chars):')
    console.log(sql.substring(0, 500))
    
    // Use rpc exec_sql if exists, but it doesn't. We'll use raw query via fetch
    console.log('⚠️ Direct SQL execution via RPC not available.')
    console.log('Please manually execute the SQL in Supabase SQL Editor.')
    console.log('File path:', filePath)
    console.log('Copy the content and run it at: https://supabase.com/dashboard/project/finjgjjqcyjdaucyxchp/sql/editor')
    
    // Try to execute via pg query (likely won't work)
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      console.error('RPC error:', error.message)
      console.log('As expected, exec_sql function not found.')
    } else {
      console.log('Success:', data)
    }
  } catch (err) {
    console.error('Exception:', err.message)
  }
}

executeSQLFile('add_traditional_chinese_content.sql')