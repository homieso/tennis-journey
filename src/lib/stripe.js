// src/lib/stripe.js
// Stripe 支付配置（测试模式）

import { loadStripe } from '@stripe/stripe-js'

// 你的 Stripe 可发布密钥（测试模式）
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51T0GmBERuQ9ab9xne9pUeoE0wUFUb5MFyzaWbs1nQwJ9kDLs6yA5qTKGTtPD7ViTJ4GGrPGvWrHKQXPRDyzfFEyj00cP4BJaZ0'

// 订阅价格 ID（需要替换成你在 Stripe 创建的实际 Price ID）
// 从环境变量读取 Price ID，如果没有则使用测试值
export const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_test'

// 客户门户 URL（你刚刚激活的）
export const CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/test_fZu5kD7NS2xudlU6h46sw01'

// 加载 Stripe 实例
export const getStripe = () => {
  return loadStripe(STRIPE_PUBLISHABLE_KEY)
}

// 创建 Stripe 结账会话
export const createCheckoutSession = async (userId, priceId) => {
  try {
    const response = await fetch(
      'https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/stripe-checkout',
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

// 跳转到客户门户（管理订阅）
export const redirectToCustomerPortal = () => {
  if (CUSTOMER_PORTAL_URL) {
    window.location.href = CUSTOMER_PORTAL_URL
  } else {
    console.error('Customer Portal URL 未配置')
  }
}