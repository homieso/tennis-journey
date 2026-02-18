// 获取管理员用户的JWT
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'
const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

async function getAdminJWT() {
  console.log('尝试获取管理员JWT...')
  
  // 方法1: 使用Supabase Auth Admin API创建自定义令牌
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${ADMIN_UUID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY
    }
  })
  
  console.log('获取用户信息状态:', response.status)
  const userData = await response.json()
  console.log('用户信息:', JSON.stringify(userData, null, 2))
  
  // 方法2: 使用admin API生成令牌
  const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: ADMIN_UUID,
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1小时过期
    })
  })
  
  console.log('\n生成令牌状态:', tokenResponse.status)
  if (tokenResponse.ok) {
    const tokenData = await tokenResponse.json()
    console.log('生成的JWT:', tokenData.access_token || tokenData.token)
    return tokenData.access_token || tokenData.token
  } else {
    const error = await tokenResponse.text()
    console.log('生成令牌失败:', error)
  }
  
  // 方法3: 直接使用服务角色密钥作为JWT（可能不行）
  console.log('\n服务角色密钥:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...')
  
  return null
}

getAdminJWT().catch(console.error)