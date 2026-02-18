// 测试Edge Function认证
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'
const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

async function testAuth() {
  console.log('测试Edge Function认证...')
  
  // 测试1: 使用service role key作为Bearer token
  const response1 = await fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Origin': 'https://tj-7.vercel.app'
    },
    body: JSON.stringify({ 
      user_id: ADMIN_UUID,
      test_mode: false
    })
  })
  
  console.log('测试1状态:', response1.status)
  console.log('测试1状态文本:', response1.statusText)
  
  const result1 = await response1.json()
  console.log('测试1响应:', JSON.stringify(result1, null, 2))
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 测试2: 使用anon key（之前失败的）
  const SUPABASE_ANON_KEY = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'
  const response2 = await fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Origin': 'https://tennisjourney.top'
    },
    body: JSON.stringify({ 
      user_id: ADMIN_UUID,
      test_mode: false
    })
  })
  
  console.log('\n测试2状态:', response2.status)
  console.log('测试2状态文本:', response2.statusText)
  
  const result2 = await response2.json()
  console.log('测试2响应:', JSON.stringify(result2, null, 2))
}

testAuth().catch(error => {
  console.error('测试失败:', error)
})