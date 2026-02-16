// supabase/functions/stripe-checkout/index.ts
// Stripe 结账会话创建函数 - 完整可用版（返回 url）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=denonext'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  try {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    // 解析请求体
    const { price_id, user_id, success_url, cancel_url } = await req.json()

    // 验证必要参数
    if (!price_id || !user_id || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers }
      )
    }

    console.log('Creating checkout session:', { price_id, user_id })

    // 创建 Stripe 结账会话
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        user_id: user_id,
      },
    })

    console.log('Checkout session created:', session.id)
    console.log('Checkout URL:', session.url) // ✅ 打印 URL 以便调试

    // ✅ 关键：同时返回 sessionId 和 url
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url  // ✅ 确保返回 url
      }),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout session' 
      }),
      { status: 400, headers }
    )
  }
})