// src/pages/Login.jsx
// 用户登录页面

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 登录成功，跳转到首页
    navigate('/')
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
              登录你的账户
            </p>
          </div>

          {/* 登录表单 */}
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* 登录按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-white bg-wimbledon-grass hover:bg-wimbledon-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wimbledon-grass transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>

            {/* 注册链接 */}
            <div className="text-center text-sm">
              <span className="text-gray-600">还没有账户？</span>
              <Link to="/register" className="ml-1 font-medium text-wimbledon-green hover:text-wimbledon-grass">
                立即注册
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login