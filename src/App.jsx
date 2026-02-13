// src/App.jsx
// 应用主路由配置

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser, checkProfileExists } from './lib/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Challenge from './pages/Challenge'
import DailyLog from './pages/DailyLog'
import Profile from './pages/Profile'
import ScoutReport from './pages/ScoutReport'
import Pricing from './pages/Pricing'
import Redeem from './pages/Redeem'
import Community from './pages/Community'
import BottomNav from './components/BottomNav'

// 首页组件（带档案检测）
function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    checkProfileStatus()
  }, [])

  const checkProfileStatus = async () => {
    const { user } = await getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { exists } = await checkProfileExists(user.id)
    setHasProfile(exists)
    setLoading(false)

    if (!exists) {
      navigate('/onboarding')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wimbledon-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl mx-auto">
          <h1 className="font-wimbledon text-4xl font-bold text-wimbledon-green">
            Tennis Journey
          </h1>
          <p className="text-gray-600 mt-2">
            你的7天，你的球探报告。
          </p>
          <div className="mt-8">
            <button 
              onClick={() => navigate('/challenge')}
              className="bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              开始7天挑战
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 受保护的路由组件 - 自动添加底部导航
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { user } = await getCurrentUser()
    setUser(user)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">加载中...</div>
      </div>
    )
  }

  return user ? (
    <>
      {children}
      <BottomNav />
    </>
  ) : (
    <Navigate to="/login" />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 受保护路由 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/challenge" element={
          <ProtectedRoute>
            <Challenge />
          </ProtectedRoute>
        } />
        <Route path="/challenge/daily/:day" element={
          <ProtectedRoute>
            <DailyLog />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <ScoutReport />
          </ProtectedRoute>
        } />
        {/* ✅ 新增：定价和激活码页面 */}
        <Route path="/pricing" element={
          <ProtectedRoute>
            <Pricing />
          </ProtectedRoute>
        } />
        <Route path="/redeem" element={
          <ProtectedRoute>
            <Redeem />
          </ProtectedRoute>
        } />
<Route path="/community" element={
  <ProtectedRoute>
    <Community />
  </ProtectedRoute>
} />
      </Routes>
    </BrowserRouter>
  )
}

export default App