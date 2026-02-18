// src/pages/Pricing.jsx
// 订阅定价页面

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStripe, MONTHLY_PRICE_ID, createCheckoutSession } from '../lib/stripe'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'

function Pricing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

const handleSubscribe = async () => {
  setLoading(true)
  
  try {
    const { user } = await getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }

    console.log('当前用户:', user.id)
    console.log('Price ID:', MONTHLY_PRICE_ID)

    if (!MONTHLY_PRICE_ID || MONTHLY_PRICE_ID === 'price_monthly_test') {
      throw new Error('Price ID 未配置，请在 Vercel 添加 VITE_STRIPE_PRICE_MONTHLY')
    }

    // 1. 创建 Stripe Checkout 会话，获取结账页面 URL
    const { url, error } = await createCheckoutSession(
      user.id,
      MONTHLY_PRICE_ID
    )

    if (error) throw error
    console.log('结账URL:', url)

    // 2. ✅ 直接跳转到 Stripe 结账页面
    window.location.href = url

  } catch (error) {
    console.error('订阅失败详细:', error)
    alert(`订阅失败: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

  const handleActivationCode = () => {
    navigate('/redeem')
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-12 px-4 pb-24 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-wimbledon-green mb-4"
          >
            ← {t('pricing.back')}
          </button>
          <h1 className="font-wimbledon text-3xl font-bold text-wimbledon-green mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('pricing.description')}
          </p>
        </div>

        {/* 定价卡片 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* 卡片1：月付订阅（国际用户） */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-wimbledon-grass/10 text-wimbledon-green rounded-full text-sm font-medium mb-4">
                {t('pricing.internationalPayment')}
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('pricing.monthlyCardTitle')}</h2>
              <div className="flex items-end mb-4">
                <span className="text-4xl font-bold text-wimbledon-green">{t('pricing.monthlyPrice')}</span>
                <span className="text-gray-500 ml-2">/月</span>
              </div>
              <p className="text-gray-600 text-sm">
                {t('pricing.stripePayment')}
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.unlimitedReports')}
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.viewHistory')}
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.communityDiscussion')}
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.cancelAnyTime')}
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? t('pricing.subscribeLoading') : t('pricing.subscribeButton')}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              {t('pricing.testMode')}
            </p>
          </div>

          {/* 卡片2：激活码（国内用户） */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col border-2 border-wimbledon-grass">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-wimbledon-green text-white rounded-full text-sm font-medium mb-4">
                {t('pricing.domesticUsersRecommend')}
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('pricing.redeemCardTitle')}</h2>
              <div className="flex items-end mb-4">
                <span className="text-4xl font-bold text-wimbledon-green">{t('pricing.monthlyPriceCny')}</span>
                <span className="text-gray-500 ml-2">/月</span>
              </div>
              <p className="text-gray-600 text-sm">
                {t('pricing.redeemPayment')}
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.alipayWechat')}
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.noIntlCard')}
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.instantActivation')}
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <span className="text-wimbledon-grass mr-2">✓</span>
                {t('pricing.multipleMonths')}
              </li>
            </ul>

            <button
              onClick={handleActivationCode}
              className="w-full bg-wimbledon-green hover:bg-wimbledon-grass text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {t('pricing.redeemButton')}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              {t('pricing.redeemHint')}
            </p>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            {t('pricing.freeMembership')}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {t('pricing.paymentNote')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pricing