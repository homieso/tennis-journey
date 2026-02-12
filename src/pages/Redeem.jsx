// src/pages/Redeem.jsx
// 激活码兑换页面

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

function Redeem() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRedeem = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 1. 查找激活码
      const { data: activationCode, error: findError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', code.trim())
        .eq('is_used', false)
        .single()

      if (findError || !activationCode) {
        throw new Error('无效的激活码或已被使用')
      }

      // 2. 更新激活码状态
      const { error: updateError } = await supabase
        .from('activation_codes')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date()
        })
        .eq('id', activationCode.id)

      if (updateError) throw updateError

      // 3. 添加会员资格
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

      // 获取当前会员有效期
      const { data: profile } = await supabase
        .from('profiles')
        .select('membership_valid_until')
        .eq('id', user.id)
        .single()

      let newValidUntil = thirtyDaysLater
      if (profile?.membership_valid_until) {
        const current = new Date(profile.membership_valid_until)
        if (current > new Date()) {
          // 如果已有会员资格，叠加30天
          newValidUntil = new Date(current)
          newValidUntil.setDate(current.getDate() + 30)
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          membership_valid_until: newValidUntil
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // 4. 记录订阅历史
      await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            source_type: 'activation_code',
            plan_type: 'monthly',
            started_at: new Date(),
            expires_at: newValidUntil,
            activation_code_id: activationCode.id
          }
        ])

      setSuccess(true)
      setCode('')
      
      // 3秒后跳转到个人主页
      setTimeout(() => {
        navigate('/profile')
      }, 3000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* 头部 */}
        <button
          onClick={() => navigate('/pricing')}
          className="text-gray-600 hover:text-wimbledon-green mb-6"
        >
          ← 返回定价页
        </button>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green mb-2">
              兑换激活码
            </h1>
            <p className="text-sm text-gray-600">
              请输入你在淘宝/微店购买的激活码
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-xl mb-6">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="font-semibold text-lg mb-2">兑换成功！</h3>
                <p className="text-sm">你的会员资格已激活，3秒后跳转...</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="text-wimbledon-green hover:text-wimbledon-grass text-sm"
              >
                立即前往个人主页
              </button>
            </div>
          ) : (
            <form onSubmit={handleRedeem}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  激活码
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="例如：TJ-2024-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  激活码格式：TJ-XXXX-XXXX（不区分大小写）
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? '兑换中...' : '立即兑换'}
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 mb-2">
                  还没有激活码？
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    window.open('https://shop.taobao.com', '_blank')
                  }}
                  className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium"
                >
                  前往淘宝/微店购买 →
                </a>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            激活码一经兑换即与账户绑定，不可转让或退款
          </p>
        </div>
      </div>
    </div>
  )
}

export default Redeem