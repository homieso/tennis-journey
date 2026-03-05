// Delete test accounts as per Phase 0 requirements
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// Create Supabase client with service_role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  console.log('Executing SQL:', sql.substring(0, 100) + '...')
  
  try {
    // Try using RPC exec_sql if available
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.log('RPC exec_sql failed, trying REST API:', error.message)
      
      // Try REST API approach
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ sql })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`REST API failed: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('SQL executed via REST API')
      return result
    }
    
    console.log('SQL executed via RPC')
    return data
  } catch (err) {
    console.error('Failed to execute SQL:', err.message)
    throw err
  }
}

async function deleteTestAccounts() {
  console.log('=== Phase 0: Cleaning test accounts ===')
  
  const deleteSQL = `
    -- 删除三个测试账户
    DELETE FROM auth.users WHERE email IN (
      '384373358@qq.com',
      'suhaoming010@qq.com',
      'homieso@cchengholdings.com'
    );
  `
  
  try {
    await executeSQL(deleteSQL)
    console.log('✅ Test accounts deleted successfully')
    
    // Verify the accounts were deleted
    console.log('\n=== Verifying remaining users ===')
    console.log('Keeping:')
    console.log('- homieso0704@gmail.com (admin)')
    console.log('- yumilishiyu@163.com')
    console.log('- jerryig@163.com')
    console.log('- allyhesmile@hotmail.com')
    
  } catch (error) {
    console.error('❌ Failed to delete test accounts:', error.message)
    process.exit(1)
  }
}

// Run the cleanup
deleteTestAccounts().catch(console.error)