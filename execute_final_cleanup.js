// Execute final data cleanup using Supabase REST API
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Supabase configuration
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  console.log(`Executing SQL: ${sql.substring(0, 100)}...`)
  
  try {
    // Try to execute via supabase.rpc if exec_sql exists
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.log(`RPC error: ${error.message}, trying REST API...`)
      return await executeViaRestAPI(sql)
    }
    
    console.log('✅ SQL executed successfully via RPC')
    return data
  } catch (err) {
    console.log(`RPC failed: ${err.message}, trying REST API...`)
    return await executeViaRestAPI(sql)
  }
}

async function executeViaRestAPI(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })
    
    if (!response.ok) {
      throw new Error(`REST API error: ${response.status} ${response.statusText}`)
    }
    
    console.log('✅ SQL executed successfully via REST API')
    return await response.json()
  } catch (error) {
    console.log(`❌ REST API failed: ${error.message}`)
    
    // Try the SQL Editor API endpoint
    return await executeViaSQLEditorAPI(sql)
  }
}

async function executeViaSQLEditorAPI(sql) {
  try {
    // This is a different endpoint that might work
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgsodium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: sql })
    })
    
    if (!response.ok) {
      throw new Error(`SQL Editor API error: ${response.status} ${response.statusText}`)
    }
    
    console.log('✅ SQL executed successfully via SQL Editor API')
    return await response.json()
  } catch (error) {
    console.log(`❌ All execution methods failed: ${error.message}`)
    console.log('⚠️  SQL needs to be executed manually in Supabase SQL Editor')
    return null
  }
}

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`Reading SQL file: ${filePath}`)
    console.log(`SQL length: ${sql.length} characters`)
    
    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    console.log(`Found ${statements.length} SQL statements`)
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim()
      if (!stmt) continue
      
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`)
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''))
      
      await executeSQL(stmt)
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('\n✅ SQL file execution completed')
  } catch (error) {
    console.error('❌ Failed to execute SQL file:', error)
  }
}

async function main() {
  console.log('=== Starting Final Data Cleanup ===')
  
  // Execute the cleanup SQL
  await executeSQLFile(path.join(process.cwd(), 'final_data_cleanup.sql'))
  
  console.log('\n=== Cleanup Execution Complete ===')
  console.log('\n⚠️  IMPORTANT: If SQL execution failed via API, please execute manually:')
  console.log('1. Go to Supabase Dashboard → SQL Editor')
  console.log('2. Copy the SQL from final_data_cleanup.sql')
  console.log('3. Execute it manually')
}

main().catch(console.error)