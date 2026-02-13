// src/lib/stripe.js
// Stripe 支付配置（测试模式）

import { loadStripe } from '@stripe/stripe-js'

//pk_test_51T0GmBERuQ9ab9xne9pUeoE0wUFUb5MFyzaWbs1nQwJ9kDLs6yA5qTKGTtPD7ViTJ4GGrPGvWrHKQXPRDyzfFEyj00cP4BJaZ0
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_你的密钥'

// 加载 Stripe 实例
export const getStripe = () => {
  return loadStripe(STRIPE_PUBLISHABLE_KEY)
}

// 订阅价格 ID（测试用）
export const MONTHLY_PRICE_ID = 'price_monthly_test'

// 创建 Stripe 结账会话
export const createCheckoutSession = async (userId, priceId) => {
  try {
    const response = await fetch(
      'https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/create-stripe-checkout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          price_id: priceId,
          success_url: `${window.location.origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      }
    )

    const data = await response.json()
    if (data.error) throw new Error(data.error)
    
    return { sessionId: data.sessionId, error: null }
  } catch (error) {
    console.error('创建结账会话失败:', error)
    return { sessionId: null, error }
  }
}