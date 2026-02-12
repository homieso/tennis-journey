// src/pages/Pricing.jsx
// 订阅定价页面

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStripe, MONTHLY_PRICE_ID, createCheckoutSession } from '../lib/stripe'
import { getCurrentUser } from '../lib/auth'

function Pricing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 1. 创建 Stripe Checkout 会话
      const { sessionId, error } = await createCheckoutSession(
        user.id,
        MONTHLY_PRICE_ID
      )

      if (error) throw error

      // 2. 跳转到 Stripe 结账页面
      const stripe = await getStripe()
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) throw stripeError
    } catch (error) {
      console.error('订阅失败:', error)
      alert('订阅失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleActivationCode = () => {
    navigate('/redeem')
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-wimbledon-green mb-4"
          >
            ← 返回首页
          </button>
          <h1 className="font-wimbledon text-3xl font-bold text-wimbledon-green mb-4">
            解锁你的网球进阶之路
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            完成7天挑战后，选择适合你的方式继续享受AI球探报告服务
          </p>
        </div>

        {/* 定价卡片 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* 卡片1：月付订阅（国际用户） */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-wimbledon-grass/10 text-wimbledon-green rounded-full text-sm font-medium mb-4">
                🌍 国际支付
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">月付订阅</h2>
              <div className="flex items-end mb-4">
                <span className="text-4xl font-bold text-wimbledon-green">$5</span>
                <span className="text-gray-500 ml-2">/月</span>
              </div>
              <p className="text-gray-600 text-sm">
                使用 Stripe 安全支付，支持全球信用卡
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                无限次生成球探报告
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                查看历史打卡记录
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                参与社区讨论
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                可随时取消
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '跳转支付中...' : '订阅月付 $5'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              测试模式 · 不会真实扣款
            </p>
          </div>

          {/* 卡片2：激活码（国内用户） */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col border-2 border-wimbledon-grass">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-wimbledon-green text-white rounded-full text-sm font-medium mb-4">
                🇨🇳 国内用户推荐
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">激活码兑换</h2>
              <div className="flex items-end mb-4">
                <span className="text-4xl font-bold text-wimbledon-green">¥35</span>
                <span className="text-gray-500 ml-2">/月</span>
              </div>
              <p className="text-gray-600 text-sm">
                通过淘宝/微店购买激活码，输入即可兑换
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                支付宝/微信支付
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                无需国际信用卡
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                即时到账
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                可购买多个月份
              </li>
            </ul>

            <button
              onClick={handleActivationCode}
              className="w-full bg-wimbledon-green hover:bg-wimbledon-grass text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              输入激活码
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              前往淘宝/微店搜索「Tennis Journey」购买
            </p>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            🎉 完成7天挑战的用户自动获得30天免费会员
          </p>
          <p className="text-xs text-gray-400 mt-2">
            所有支付均通过 Stripe 或第三方平台处理，我们不会存储你的支付信息
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pricing