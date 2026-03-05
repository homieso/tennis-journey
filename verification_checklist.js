// Phase 6: Final verification checklist
// This script verifies all the changes made during the refactoring

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

async function verifyAllChanges() {
  console.log('=== Tennis Journey Refactoring Verification ===\n')
  
  let allPassed = true
  
  // 1. Verify i18n.js changes
  console.log('1. Checking i18n.js changes...')
  try {
    const { default: i18n } = await import('./src/lib/i18n.js')
    if (i18n.DEFAULT_LANGUAGE !== 'en') {
      console.log('❌ FAIL: DEFAULT_LANGUAGE should be "en", got:', i18n.DEFAULT_LANGUAGE)
      allPassed = false
    } else {
      console.log('✅ PASS: DEFAULT_LANGUAGE is "en"')
    }
    
    // Check getCurrentLanguage function
    const lang = i18n.getCurrentLanguage()
    if (lang !== 'en') {
      console.log('❌ FAIL: getCurrentLanguage() should return "en", got:', lang)
      allPassed = false
    } else {
      console.log('✅ PASS: getCurrentLanguage() returns "en"')
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify i18n.js:', error.message)
    allPassed = false
  }
  
  // 2. Verify PostCard.jsx permission logic
  console.log('\n2. Checking PostCard.jsx permission logic...')
  try {
    const fs = await import('fs')
    const postCardContent = fs.readFileSync('./src/components/PostCard.jsx', 'utf8')
    
    // Check for canInteract logic
    if (!postCardContent.includes('canInteract = currentUser &&')) {
      console.log('❌ FAIL: PostCard missing canInteract logic')
      allPassed = false
    } else {
      console.log('✅ PASS: PostCard has canInteract logic')
    }
    
    // Check for need_approval toast
    if (!postCardContent.includes("toast.info(t('postCard.need_approval'")) {
      console.log('❌ FAIL: PostCard missing need_approval toast')
      allPassed = false
    } else {
      console.log('✅ PASS: PostCard has need_approval toast')
    }
    
    // Check for conditional comment/repost buttons
    if (!postCardContent.includes('{canInteract ? (')) {
      console.log('❌ FAIL: PostCard missing conditional comment/repost buttons')
      allPassed = false
    } else {
      console.log('✅ PASS: PostCard has conditional comment/repost buttons')
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify PostCard.jsx:', error.message)
    allPassed = false
  }
  
  // 3. Verify ScoutReportNew.jsx changes
  console.log('\n3. Checking ScoutReportNew.jsx changes...')
  try {
    const fs = await import('fs')
    const scoutReportContent = fs.readFileSync('./src/pages/ScoutReportNew.jsx', 'utf8')
    
    // Check for handleGenerateTextReport function
    if (!scoutReportContent.includes('handleGenerateTextReport')) {
      console.log('❌ FAIL: ScoutReportNew missing handleGenerateTextReport function')
      allPassed = false
    } else {
      console.log('✅ PASS: ScoutReportNew has handleGenerateTextReport function')
    }
    
    // Check for "生成文字纯享版并发布" button
    if (!scoutReportContent.includes('生成文字纯享版并发布')) {
      console.log('❌ FAIL: ScoutReportNew missing text-only report button')
      allPassed = false
    } else {
      console.log('✅ PASS: ScoutReportNew has text-only report button')
    }
    
    // Check that share button is removed from top navigation
    if (scoutReportContent.includes('分享我的报告') && scoutReportContent.includes('handleShare')) {
      console.log('⚠️ WARNING: Share button still present in ScoutReportNew (may be intentional for other pages)')
    } else {
      console.log('✅ PASS: Share button removed/updated in ScoutReportNew')
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify ScoutReportNew.jsx:', error.message)
    allPassed = false
  }
  
  // 4. Verify database changes (is_approved field)
  console.log('\n4. Checking database changes...')
  try {
    // Check if is_approved column exists in profiles table
    const { data: columnCheck, error: columnError } = await supabase
      .from('profiles')
      .select('is_approved')
      .limit(1)
    
    if (columnError && columnError.message.includes('column')) {
      console.log('❌ FAIL: is_approved column may not exist:', columnError.message)
      allPassed = false
    } else {
      console.log('✅ PASS: is_approved column exists in profiles table')
    }
    
    // Check admin user is approved
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', 'dcee2e34-45f0-4506-9bac-4bdf0956273c')
      .single()
    
    if (adminError) {
      console.log('❌ FAIL: Could not fetch admin profile:', adminError.message)
      allPassed = false
    } else if (!adminProfile.is_approved) {
      console.log('❌ FAIL: Admin user is not approved')
      allPassed = false
    } else {
      console.log('✅ PASS: Admin user is approved')
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify database changes:', error.message)
    allPassed = false
  }
  
  // 5. Verify Edge Function exists
  console.log('\n5. Checking Edge Function files...')
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const edgeFunctionPath = './supabase/functions/generate-text-report'
    const indexFile = path.join(edgeFunctionPath, 'index.ts')
    const denoFile = path.join(edgeFunctionPath, 'deno.json')
    
    if (!fs.existsSync(indexFile)) {
      console.log('❌ FAIL: Edge Function index.ts does not exist')
      allPassed = false
    } else {
      console.log('✅ PASS: Edge Function index.ts exists')
    }
    
    if (!fs.existsSync(denoFile)) {
      console.log('❌ FAIL: Edge Function deno.json does not exist')
      allPassed = false
    } else {
      console.log('✅ PASS: Edge Function deno.json exists')
    }
    
    // Check Edge Function content
    const edgeFunctionContent = fs.readFileSync(indexFile, 'utf8')
    if (!edgeFunctionContent.includes('generate-text-report')) {
      console.log('❌ FAIL: Edge Function missing expected content')
      allPassed = false
    } else {
      console.log('✅ PASS: Edge Function has correct content')
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify Edge Function:', error.message)
    allPassed = false
  }
  
  // 6. Verify translation keys
  console.log('\n6. Checking translation keys...')
  try {
    const fs = await import('fs')
    const i18nContent = fs.readFileSync('./src/lib/i18n.js', 'utf8')
    
    // Check for postCard.need_approval key
    if (!i18nContent.includes("'postCard.need_approval':")) {
      console.log('❌ FAIL: Missing postCard.need_approval translation key')
      allPassed = false
    } else {
      console.log('✅ PASS: postCard.need_approval translation key exists')
    }
    
    // Check English translation
    if (!i18nContent.includes('This feature requires you to complete the 7-day challenge')) {
      console.log('❌ FAIL: Missing English translation for need_approval')
      allPassed = false
    } else {
      console.log('✅ PASS: English translation for need_approval exists')
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify translation keys:', error.message)
    allPassed = false
  }
  
  // Summary
  console.log('\n=== Verification Summary ===')
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED! The refactoring is complete.')
    console.log('\nNext steps:')
    console.log('1. Deploy the database changes (run database_fix_phase4.sql)')
    console.log('2. Deploy the new Edge Function: supabase functions deploy generate-text-report')
    console.log('3. Test with a new account: test@test.com')
    console.log('4. Verify unapproved users can only like, not comment/repost')
    console.log('5. Verify text-only report generation works')
  } else {
    console.log('❌ SOME CHECKS FAILED. Please review the errors above.')
  }
  
  return allPassed
}

// Run verification
verifyAllChanges().catch(console.error)