// src/pages/Community.jsx
// 社区广场 - 完整社交功能版

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../lib/i18n'
import PostCard from '../components/PostCard'

function Community() {
  const { t } = useTranslation()
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
      
      // 获取帖子，同时联表查询用户档案和新的社交字段
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
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

      if (error) {
        console.error('社区帖子查询错误:', error.message, error.code)
        throw error
      }

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

  // 处理点赞更新
  const handleLikeUpdate = (postId, operation) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          like_count: operation === 'increment' 
            ? (post.like_count || 0) + 1 
            : Math.max(0, (post.like_count || 0) - 1)
        }
      }
      return post
    }))
  }

  // 处理评论更新
  const handleCommentUpdate = (postId, operation) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comment_count: operation === 'increment' 
            ? (post.comment_count || 0) + 1 
            : Math.max(0, (post.comment_count || 0) - 1)
        }
      }
      return post
    }))
  }

  // 处理转发更新
  const handleRepostUpdate = (postId, operation) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          repost_count: operation === 'increment' 
            ? (post.repost_count || 0) + 1 
            : Math.max(0, (post.repost_count || 0) - 1)
        }
      }
      return post
    }))
  }

  return (
    <div className="min-h-screen bg-wimbledon-white pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-wimbledon text-xl font-bold text-wimbledon-green">
              {t('community.title')}
            </h1>
            <div className="w-16"></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t('community.subtitle')}
          </p>
        </div>
      </div>

      {/* 帖子流 */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {posts.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <span className="text-5xl mb-4 block">🏌️‍♂️</span>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('community.no_posts')}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {t('community.no_posts_desc')}
            </p>
            <Link
              to="/challenge"
              className="inline-block bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-3 rounded-xl transition-colors"
            >
              {t('community.go_challenge')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeUpdate={handleLikeUpdate}
                onCommentUpdate={handleCommentUpdate}
                onRepostUpdate={handleRepostUpdate}
              />
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium disabled:opacity-50"
                >
                  {loading ? t('loading') : t('community.load_more')}
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