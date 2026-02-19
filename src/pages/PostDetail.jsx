// src/pages/PostDetail.jsx
// 帖子详情页面 - 显示完整内容和多级评论

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'
import PostCard from '../components/PostCard'
import CommentSection from '../components/CommentSection'

function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetchPost()
    fetchCurrentUser()
  }, [id])

  const fetchCurrentUser = async () => {
    const { user } = await getCurrentUser()
    setCurrentUser(user)
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      
      // 获取帖子详情
      const { data: postData, error: postError } = await supabase
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
        .eq('id', id)
        .single()

      if (postError) throw postError
      setPost(postData)

      // 增加浏览量
      await supabase
        .from('posts')
        .update({ view_count: (postData.view_count || 0) + 1 })
        .eq('id', id)

    } catch (error) {
      console.error('获取帖子详情失败:', error)
      // 如果是帖子不存在，跳转到社区
      if (error.code === 'PGRST116') {
        alert(t('postDetail.post_not_found'))
        navigate('/community')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">{t('loading')}</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-wimbledon-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-6xl mb-4 block">📝</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('postDetail.post_not_found')}</h1>
          <p className="text-gray-600 mb-6">{t('postDetail.post_deleted')}</p>
          <button
            onClick={() => navigate('/community')}
            className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-2 rounded-lg"
          >
            {t('postDetail.back_to_community')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center"
        >
          <span className="text-xl mr-1">←</span>
          {t('postDetail.back')}
        </button>

        {/* 帖子卡片 */}
        <div className="mb-8">
          <PostCard
            post={post}
            onLikeUpdate={() => {}}
            onCommentUpdate={() => {}}
            onRepostUpdate={() => {}}
          />
        </div>

        {/* 评论区组件 */}
        <CommentSection 
          postId={post.id} 
          postAuthorId={post.user_id} 
        />

        {/* 回到顶部 */}
        <div className="fixed bottom-20 right-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center text-gray-600 hover:text-wimbledon-green"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostDetail