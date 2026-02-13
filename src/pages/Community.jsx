// src/pages/Community.jsx
// 社区广场 - 帖子流（只读版）

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Community() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10

  useEffect(() => {
    fetchPosts()
  }, [page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      // 获取帖子，同时联表查询用户档案
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            gender,
            playing_years,
            self_rated_ntrp,
            idol,
            tennis_style,
            location,
            avatar_url
          ),
          scout_reports!posts_report_id_fkey (
            id,
            generated_at
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (error) throw error

      if (page === 1) {
        setPosts(data || [])
      } else {
        setPosts(prev => [...prev, ...(data || [])])
      }

      setHasMore(data?.length === PAGE_SIZE)
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // 1小时内：X分钟前
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}分钟前`
    }
    // 24小时内：X小时前
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours}小时前`
    }
    // 7天内：X天前
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}天前`
    }
    // 更早：显示日期
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }

  // 获取用户昵称（优先显示display_name，否则用默认格式）
  const getUserName = (profile) => {
    if (profile?.display_name) return profile.display_name
    return `网球爱好者${profile?.id?.slice(0, 4) || ''}`
  }

  // 获取用户地区显示
  const getUserLocation = (profile) => {
    if (profile?.location) return profile.location
    return null
  }

  return (
    <div className="min-h-screen bg-wimbledon-white pb-24 pb-24 pb-24 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-wimbledon text-xl font-bold text-wimbledon-green">
              社区广场
            </h1>
            <Link to="/" className="text-gray-600 hover:text-wimbledon-green">
              返回首页
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            完成7天挑战的用户在这里分享他们的网球故事
          </p>
        </div>
      </div>

      {/* 帖子流 */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {posts.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <span className="text-5xl mb-4 block">🏌️‍♂️</span>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              还没有帖子
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              完成7天挑战，发布你的球探报告，成为第一位社区贡献者
            </p>
            <Link
              to="/challenge"
              className="inline-block bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-3 rounded-xl transition-colors"
            >
              去完成挑战
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-md p-5">
                {/* 帖子头部：用户信息 */}
                <div className="flex items-start mb-3">
                  {/* 头像 */}
                  <div className="w-10 h-10 rounded-full bg-wimbledon-grass/20 flex items-center justify-center text-wimbledon-green font-bold mr-3">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getUserName(post.profiles).charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* 用户信息 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">
                        {getUserName(post.profiles)}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {formatTime(post.created_at)}
                      </span>
                    </div>
                    
                    {/* 用户标签：球龄/NTRP/地区 */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {post.profiles?.playing_years && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          🎾 {post.profiles.playing_years}年
                        </span>
                      )}
                      {post.profiles?.self_rated_ntrp && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          NTRP {post.profiles.self_rated_ntrp}
                        </span>
                      )}
                      {getUserLocation(post.profiles) && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          📍 {getUserLocation(post.profiles)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 帖子内容 */}
                <div className="ml-13 pl-2">
                  {/* 文字内容 */}
                  {post.content && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  )}

                  {/* 图片（如果有） */}
                  {post.image_url && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-100">
                      <img 
                        src={post.image_url} 
                        alt="帖子图片"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* 球探报告标识 */}
                  {post.report_id && (
                    <div className="mb-2">
                      <span className="inline-flex items-center bg-wimbledon-grass/10 text-wimbledon-green text-xs px-3 py-1.5 rounded-full">
                        <span className="mr-1">🎯</span>
                        球探报告 · {post.scout_reports?.generated_at ? formatTime(post.scout_reports.generated_at) : '刚刚'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 帖子底部：互动统计（只读，不显示按钮） */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-gray-400 text-xs">
                  <span>❤️ {post.like_count || 0}</span>
                  <span>💬 {post.comment_count || 0}</span>
                  <span>🔄 0</span>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Community