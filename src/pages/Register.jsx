// src/pages/Register.jsx
// 用户注册页面

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth'

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 密码一致性验证
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    // 密码强度验证（至少6位）
    if (password.length < 6) {
      setError('密码至少需要6个字符')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 注册成功，跳转到档案填写页
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-wimbledon-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          
          {/* Logo 区域 */}
          <div className="text-center">
            <h1 className="font-wimbledon text-3xl font-bold text-wimbledon-green">
              Tennis Journey
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              创建你的账户
            </p>
          </div>

          {/* 注册表单 */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* 邮箱输入 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="至少6个字符"
                />
              </div>

              {/* 确认密码 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="再次输入密码"
                />
              </div>
            </div>

            {/* 注册按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-white bg-wimbledon-grass hover:bg-wimbledon-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wimbledon-grass transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </div>

            {/* 登录链接 */}
            <div className="text-center text-sm">
              <span className="text-gray-600">已有账户？</span>
              <Link to="/login" className="ml-1 font-medium text-wimbledon-green hover:text-wimbledon-grass">
                立即登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register