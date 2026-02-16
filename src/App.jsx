// src/App.jsx
// 应用主路由配置

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser, checkProfileExists } from './lib/auth'
import { supabase } from './lib/supabase'
import { useTranslation } from './lib/i18n'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Challenge from './pages/Challenge'
import DailyLog from './pages/DailyLog'
import Profile from './pages/Profile'
import ScoutReport from './pages/ScoutReport'
import ScoutReportNew from './pages/ScoutReportNew'
import Pricing from './pages/Pricing'
import Redeem from './pages/Redeem'
import Community from './pages/Community'
import Feedback from './pages/Feedback'
import PostDetail from './pages/PostDetail'
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
  const [profile, setProfile] = useState(null)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [comingSoonMessage, setComingSoonMessage] = useState('')

  // 导入国际化
  const { t, currentLanguage, setLanguage } = useTranslation()

  // 推荐卡片图片URL
  const recommendationImages = {
    video: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg',
    brand: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/serve_3.jpg',
    event: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg',
    plan: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg'
  }

  useEffect(() => {
    checkProfileStatus()
    fetchStats()
    fetchCommunityPosts()
  }, [])

  const checkProfileStatus = async () => {
    const { user } = await getCurrentUser()
    
    if (!user) {
      // 未登录用户：只显示公开内容，不跳转
      setUser(null)
      setHasProfile(false)
      setProfile(null)
      setLoading(false)
      return
    }

    // 已登录用户
    setUser(user)
    
    try {
      // 检查档案是否存在并获取档案数据
      const { exists } = await checkProfileExists(user.id)
      setHasProfile(exists)
      
      // 获取用户的完整档案数据用于显示用户名
      if (exists) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', user.id)
          .single()
        
        if (!error && profileData) {
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
        // 如果档案不存在，跳转到onboarding
        navigate('/onboarding')
      }
    } catch (error) {
      console.error('获取档案数据失败:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // 获取真实统计数据
      const [
        { count: totalUsers },
        { count: totalLogs },
        { count: totalReports }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('daily_logs').select('*', { count: 'exact', head: true }),
        supabase.from('scout_reports').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalLogs: totalLogs || 0,
        totalReports: totalReports || 0
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
      // 出错时使用保守的模拟数据
      setStats({
        totalUsers: 0,
        totalLogs: 0,
        totalReports: 0
      })
    }
  }

  const fetchCommunityPosts = async () => {
    try {
      // 1. 首先检查posts表是否有数据
      const { data: existingPosts, error: countError } = await supabase
        .from('posts')
        .select('id')
        .limit(1)

      // 如果posts表为空，插入3条站点公告
      if (!existingPosts || existingPosts.length === 0) {
        const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
        const announcements = [
          {
            user_id: adminUserId,
            content: '欢迎来到 Tennis Journey！完成7天挑战，解锁你的专属AI球探报告。',
            like_count: 0,
            comment_count: 0,
            repost_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            user_id: adminUserId,
            content: '社区交流规范：友善互动，分享网球心得，禁止广告与不当言论。',
            like_count: 0,
            comment_count: 0,
            repost_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            user_id: adminUserId,
            content: '产品愿景：帮助每一位网球爱好者记录成长，连接全球球友。',
            like_count: 0,
            comment_count: 0,
            repost_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]

        // 批量插入公告
        for (const announcement of announcements) {
          const { error: insertError } = await supabase
            .from('posts')
            .insert(announcement)
          
          if (insertError) {
            console.error('插入站点公告失败:', insertError)
          }
        }
        
        console.log('✅ 已创建3条站点公告')
      }

      // 2. 获取真实的社区帖子（按点赞数排序，如果没有点赞则按创建时间）
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          like_count,
          comment_count,
          repost_count,
          media_urls,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3) // 首页只显示3条
      
      if (error) {
        console.error('获取社区帖子失败:', error)
        // 如果失败，使用站点公告作为回退
        setCommunityPosts([
          {
            id: 'announcement-1',
            title: '欢迎来到 Tennis Journey！完成7天挑战，解锁你的专属AI球探报告。',
            author: '管理员',
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
          },
          {
            id: 'announcement-2',
            title: '社区交流规范：友善互动，分享网球心得，禁止广告与不当言论。',
            author: '管理员',
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
          },
          {
            id: 'announcement-3',
            title: '产品愿景：帮助每一位网球爱好者记录成长，连接全球球友。',
            author: '管理员',
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
          }
        ])
        return
      }
      
      // 转换数据格式以匹配现有组件
      const formattedPosts = (data || []).map((post, index) => {
        // 如果没有内容，使用默认标题
        const title = post.content
          ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content)
          : `社区帖子 ${index + 1}`
        
        const date = new Date(post.created_at)
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        
        // 从media_urls提取第一张图片URL（支持逗号分隔的字符串）
        let imageUrl = null
        if (post.media_urls && post.media_urls.trim() !== '') {
          const urls = post.media_urls.split(',').map(url => url.trim()).filter(url => url.length > 0)
          if (urls.length > 0) {
            imageUrl = urls[0]
          }
        }
        
        return {
          id: post.id,
          title: title,
          author: post.profiles?.username || '管理员',
          date: formattedDate,
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          imageUrl: imageUrl
        }
      })
      
      // 确保至少有3条帖子显示
      if (formattedPosts.length < 3) {
        const announcementPosts = [
          {
            id: 'announcement-1',
            title: '欢迎来到 Tennis Journey！完成7天挑战，解锁你的专属AI球探报告。',
            author: '管理员',
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
          },
          {
            id: 'announcement-2',
            title: '社区交流规范：友善互动，分享网球心得，禁止广告与不当言论。',
            author: '管理员',
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
          },
          {
            id: 'announcement-3',
            title: '产品愿景：帮助每一位网球爱好者记录成长，连接全球球友。',
            author: '管理员',
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
          }
        ]
        
        // 只补充到3条
        while (formattedPosts.length < 3) {
          formattedPosts.push(announcementPosts[formattedPosts.length])
        }
      }
      
      setCommunityPosts(formattedPosts)
    } catch (error) {
      console.error('获取社区帖子失败:', error)
      // 出错时使用站点公告
      setCommunityPosts([
        {
          id: 'announcement-1',
          title: '欢迎来到 Tennis Journey！完成7天挑战，解锁你的专属AI球探报告。',
          author: '管理员',
          date: new Date().toISOString().split('T')[0],
          likes: 0,
          comments: 0
        },
        {
          id: 'announcement-2',
          title: '社区交流规范：友善互动，分享网球心得，禁止广告与不当言论。',
          author: '管理员',
          date: new Date().toISOString().split('T')[0],
          likes: 0,
          comments: 0
        },
        {
          id: 'announcement-3',
          title: '产品愿景：帮助每一位网球爱好者记录成长，连接全球球友。',
          author: '管理员',
          date: new Date().toISOString().split('T')[0],
          likes: 0,
          comments: 0
        }
      ])
    }
  }

  const handleComingSoon = (message = '此功能正在开发中，敬请期待！') => {
    setComingSoonMessage(message)
    setShowComingSoon(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wimbledon-white to-gray-50 flex items-center justify-center">
        <div className="text-wimbledon-green">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wimbledon-white to-gray-50 pb-24">
      {/* 顶部导航 - 简约设计 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-wimbledon-green to-wimbledon-grass rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">TJ</span>
              </div>
              <h1 className="font-wimbledon text-lg font-bold text-gray-800">
                {t('app.name')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* 语言切换下拉框 */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-600 hover:text-wimbledon-green transition-colors text-sm font-medium">
                  <span className="text-xs">🌐</span>
                  <span className="hidden sm:inline">
                    {currentLanguage === 'zh' ? t('nav.language.zh') : 
                     currentLanguage === 'en' ? t('nav.language.en') : 
                     currentLanguage === 'zh_tw' ? t('nav.language.zh_tw') : t('nav.language')}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentLanguage === 'zh' ? 'text-wimbledon-green font-medium' : 'text-gray-700'}`}
                  >
                    {t('nav.language.zh')}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentLanguage === 'en' ? 'text-wimbledon-green font-medium' : 'text-gray-700'}`}
                  >
                    {t('nav.language.en')}
                  </button>
                  <button
                    onClick={() => setLanguage('zh_tw')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentLanguage === 'zh_tw' ? 'text-wimbledon-green font-medium' : 'text-gray-700'}`}
                  >
                    {t('nav.language.zh_tw')}
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-600 hover:text-wimbledon-green transition-colors text-sm font-medium"
              >
                {t('nav.profile')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主视觉区域 - 高清大图背景 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-wimbledon-green/10 to-wimbledon-grass/5"></div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* 英雄区域 */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {user?.email ? t('home.welcome', { name: profile?.username || user.email.split('@')[0] }) : t('home.welcome.guest')}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('home.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/challenge')}
                className="bg-gradient-to-r from-wimbledon-green to-wimbledon-grass text-white font-semibold px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {t('home.start_challenge')}
              </button>
              <button
                onClick={() => navigate('/community')}
                className="bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-3 rounded-xl hover:border-wimbledon-green hover:text-wimbledon-green transition-all duration-300"
              >
                {t('home.explore_community')}
              </button>
            </div>
          </div>

          {/* 数据看板 - 大号数字展示 */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              {t('home.stats.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{t('home.stats.users')}</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalLogs.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{t('home.stats.logs')}</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalReports.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{t('home.stats.reports')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社区精选 - 卡片式设计 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('home.community.title')}</h2>
              <p className="text-gray-600">{t('home.community.subtitle')}</p>
            </div>
            <button
              onClick={() => navigate('/community')}
              className="text-wimbledon-green hover:text-wimbledon-grass font-medium flex items-center"
            >
              {t('home.community.view_all')}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/community/post/${post.id}`)}
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  {post.imageUrl ? (
                    <>
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          // 回退显示网球图标
                          const fallback = document.createElement('div')
                          fallback.className = 'absolute inset-0 flex items-center justify-center'
                          fallback.innerHTML = '<span class="text-4xl">🎾</span>'
                          e.target.parentNode.appendChild(fallback)
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">🎾</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                    {post.likes} {t('home.community.card_likes')}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {post.author.charAt(0)}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{post.author}</span>
                    </div>
                    <span className="text-xs text-gray-500">{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 内容推荐区 - 横向滚动卡片 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('home.recommendations.title')}</h2>
          
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
            <div className="flex space-x-6">
              <div className="flex-shrink-0 w-80">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={recommendationImages.video}
                      alt={t('home.recommendations.video_title')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-gradient-to-r from-wimbledon-green to-wimbledon-grass text-white text-xs font-medium px-3 py-1 rounded-full">
                        {t('home.recommendations.video_tag')}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-xl">▶️</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2">{t('home.recommendations.video_title')}</h3>
                    <p className="text-sm text-gray-600 mb-4">{t('home.recommendations.video_desc')}</p>
                    <button className="text-wimbledon-green hover:text-wimbledon-grass font-medium text-sm">
                      {t('home.recommendations.video_cta')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80">
                <div className="bg-gradient-to-br from-wimbledon-green to-wimbledon-grass rounded-2xl shadow-sm overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={recommendationImages.brand}
                      alt={t('home.recommendations.brand_title')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                        {t('home.recommendations.brand_title')}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 text-white">
                    <h3 className="font-bold mb-2">{t('home.recommendations.brand_title')}</h3>
                    <p className="text-sm opacity-90 mb-4">{t('home.recommendations.brand_desc')}</p>
                    <button className="bg-white text-wimbledon-green hover:bg-gray-100 font-medium text-sm px-4 py-2 rounded-lg">
                      {t('home.recommendations.brand_cta')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={recommendationImages.event}
                      alt={t('home.recommendations.event_title')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {t('home.recommendations.event_tag')}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2">{t('home.recommendations.event_title')}</h3>
                    <p className="text-sm text-gray-600 mb-4">{t('home.recommendations.event_desc')}</p>
                    <button className="text-wimbledon-green hover:text-wimbledon-grass font-medium text-sm">
                      {t('home.recommendations.event_cta')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={recommendationImages.plan}
                      alt={t('home.recommendations.plan_title')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {t('home.recommendations.plan_tag')}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2">{t('home.recommendations.plan_title')}</h3>
                    <p className="text-sm text-gray-600 mb-4">{t('home.recommendations.plan_desc')}</p>
                    <button className="text-wimbledon-green hover:text-wimbledon-grass font-medium text-sm">
                      {t('home.recommendations.plan_cta')}
                    </button>
                  </div>
                </div>
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
  const { t } = useTranslation()
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
        <div className="text-wimbledon-green">{t('loading')}</div>
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
            <ScoutReportNew />
          </ProtectedRoute>
        } />
        <Route path="/report/classic" element={
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
<Route path="/feedback" element={
  <ProtectedRoute>
    <Feedback />
  </ProtectedRoute>
} />
<Route path="/post/:id" element={
  <ProtectedRoute>
    <PostDetail />
  </ProtectedRoute>
} />
      </Routes>
    </BrowserRouter>
  )
}

export default App