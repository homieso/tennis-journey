// src/App.jsx
// 应用主路由配置

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser, checkProfileExists } from './lib/auth'
import { useTranslation } from './lib/i18n'
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

// 首页组件（重新设计版）
function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogs: 0,
    totalReports: 0
  })
  const [communityPosts, setCommunityPosts] = useState([])

  // 导入国际化
  const { t } = useTranslation()

  useEffect(() => {
    checkProfileStatus()
    fetchStats()
    fetchCommunityPosts()
  }, [])

  const checkProfileStatus = async () => {
    const { user } = await getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }

    setUser(user)
    const { exists } = await checkProfileExists(user.id)
    setHasProfile(exists)
    setLoading(false)

    if (!exists) {
      navigate('/onboarding')
    }
  }

  const fetchStats = async () => {
    try {
      // 这里应该从API获取统计数据
      // 暂时使用模拟数据
      setStats({
        totalUsers: 1284,
        totalLogs: 8923,
        totalReports: 567
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  const fetchCommunityPosts = async () => {
    try {
      // 这里应该从API获取社区帖子
      // 暂时使用模拟数据
      setCommunityPosts([
        {
          id: 1,
          title: '如何提高正手稳定性',
          author: '张教练',
          date: '2026-02-13',
          likes: 42,
          comments: 8
        },
        {
          id: 2,
          title: '我的7天挑战心得分享',
          author: '网球爱好者小李',
          date: '2026-02-12',
          likes: 28,
          comments: 5
        },
        {
          id: 3,
          title: '发球技巧：从基础到进阶',
          author: '王教练',
          date: '2026-02-11',
          likes: 35,
          comments: 12
        }
      ])
    } catch (error) {
      console.error('获取社区帖子失败:', error)
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
    <div className="min-h-screen bg-wimbledon-white pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-wimbledon text-xl font-bold text-wimbledon-green">
              Tennis Journey
            </h1>
            <button
              onClick={() => navigate('/profile')}
              className="text-gray-600 hover:text-wimbledon-green transition-colors"
            >
              个人主页
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 用户欢迎区 */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-wimbledon-green to-wimbledon-grass rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              {user?.email ? `欢迎回来，${user.email.split('@')[0]}！` : '欢迎来到 Tennis Journey'}
            </h2>
            <p className="mb-4 opacity-90">
              你的网球成长之旅从这里开始。连续7天打卡，生成专属AI球探报告。
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/challenge')}
                className="bg-white text-wimbledon-green hover:bg-gray-100 font-semibold px-6 py-2 rounded-xl transition-colors"
              >
                开始挑战
              </button>
              <button
                onClick={() => navigate('/community')}
                className="bg-transparent border border-white hover:bg-white/10 text-white font-semibold px-6 py-2 rounded-xl transition-colors"
              >
                探索社区
              </button>
            </div>
          </div>
        </div>

        {/* 数据看板 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tennis Journey 数据看板</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-wimbledon-green mb-1">{stats.totalUsers}</div>
              <div className="text-xs text-gray-500">累计用户</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-wimbledon-green mb-1">{stats.totalLogs}</div>
              <div className="text-xs text-gray-500">打卡次数</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-wimbledon-green mb-1">{stats.totalReports}</div>
              <div className="text-xs text-gray-500">生成报告</div>
            </div>
          </div>
        </div>

        {/* 社区精选 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">社区精选</h3>
            <button
              onClick={() => navigate('/community')}
              className="text-wimbledon-green hover:text-wimbledon-grass text-sm"
            >
              查看全部 →
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {communityPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/community/post/${post.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">{post.title}</h4>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{post.author}</span>
                      <span className="mx-2">•</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="mr-1">👍</span>
                      {post.likes}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">💬</span>
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 内容推荐区 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">内容推荐</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 网球教学视频 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-wimbledon-green/20 to-wimbledon-grass/20 flex items-center justify-center">
                <span className="text-4xl">🎾</span>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-800 mb-2">正手击球基础教学</h4>
                <p className="text-xs text-gray-500 mb-3">掌握正确的正手姿势和发力技巧</p>
                <button className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium">
                  观看视频 →
                </button>
              </div>
            </div>

            {/* 品牌推广位 */}
            <div className="bg-gradient-to-br from-wimbledon-green to-wimbledon-grass rounded-xl shadow-sm p-4 text-white">
              <div className="mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="font-medium mb-2">Wilson 专业网球拍</h4>
              <p className="text-xs opacity-90 mb-3">限时8折优惠，提升你的击球体验</p>
              <button className="bg-white text-wimbledon-green hover:bg-gray-100 text-sm font-medium px-3 py-1 rounded-lg">
                立即购买
              </button>
            </div>

            {/* 赛事资讯 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-4xl">📅</span>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-800 mb-2">2026温网赛事预告</h4>
                <p className="text-xs text-gray-500 mb-3">最新赛程安排和观赛指南</p>
                <button className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium">
                  查看详情 →
                </button>
              </div>
            </div>
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