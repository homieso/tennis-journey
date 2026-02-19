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
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null) // 回复的目标评论ID

  useEffect(() => {
    fetchPostAndComments()
    fetchCurrentUser()
  }, [id])

  const fetchCurrentUser = async () => {
    const { user } = await getCurrentUser()
    setCurrentUser(user)
  }

  const fetchPostAndComments = async () => {
    try {
      setLoading(true)
      
      // 1. 获取帖子详情
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

      // 2. 获取评论（多级评论）
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          parent:parent_id (
            id,
            content,
            profiles:user_id (
              username
            )
          )
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError
      setComments(commentsData || [])

      // 3. 增加浏览量
      await supabase
        .from('posts')
        .update({ view_count: (postData.view_count || 0) + 1 })
        .eq('id', id)

    } catch (error) {
      console.error('获取帖子详情失败:', error)
      // 如果是帖子不存在，跳转到社区
      if (error.code === 'PGRST116') {
        alert('帖子不存在或已被删除')
        navigate('/community')
      }
    } finally {
      setLoading(false)
    }
  }

  // 构建评论树
  const buildCommentTree = (comments) => {
    if (!comments || comments.length === 0) return []
    
    const commentMap = new Map()
    const rootComments = []
    
    // 构建映射
    comments.forEach(comment => {
      comment.children = []
      commentMap.set(comment.id, comment)
    })
    
    // 构建树结构
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.children.push(comment)
        } else {
          // 父评论不存在，当作根评论
          rootComments.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    })
    
    return rootComments
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert('请输入评论内容')
      return
    }

    if (!currentUser) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: id,
            user_id: currentUser.id,
            content: newComment,
            parent_id: replyTo || null
          }
        ])

      if (error) throw error

      // 清空表单
      setNewComment('')
      setReplyTo(null)
      
      // 重新加载评论
      fetchPostAndComments()
      
      // 显示成功提示
      alert('评论发布成功！')
    } catch (error) {
      console.error('发布评论失败:', error)
      alert('发布评论失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = (commentId, username) => {
    setReplyTo(commentId)
    setNewComment(`@${username} `)
    // 滚动到评论框
    document.getElementById('comment-input')?.focus()
  }

  const renderComment = (comment, depth = 0) => {
    const maxDepth = 3 // 最多显示3级嵌套
    if (depth > maxDepth) return null

    const marginLeft = depth * 20
    const isReply = depth > 0

    return (
      <div key={comment.id} className={`mb-4 ${isReply ? 'border-l-2 border-gray-200 pl-4' : ''}`} style={{ marginLeft: `${marginLeft}px` }}>
        {/* 评论头部 */}
        <div className="flex items-start mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm mr-2">
            {comment.profiles?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{comment.profiles?.username || '用户'}</span>
                {comment.parent && (
                  <span className="text-xs text-gray-500 ml-2">
                    回复 @{comment.parent.profiles?.username || '用户'}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
               {new Date(comment.created_at).toLocaleDateString()}
             </span>
            </div>
            
            {/* 评论内容 */}
            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{comment.content}</p>
            
            {/* 评论操作 */}
            <div className="flex items-center gap-4 mt-2">
              {currentUser && depth < maxDepth && (
                <button
                  onClick={() => handleReply(comment.id, comment.profiles?.username)}
                  className="text-xs text-gray-500 hover:text-wimbledon-green"
                >
                  回复
                </button>
              )}
              <button className="text-xs text-gray-500 hover:text-red-500">
                举报
              </button>
            </div>
          </div>
        </div>
        
        {/* 子评论 */}
        {comment.children && comment.children.map(child => 
          renderComment(child, depth + 1)
        )}
      </div>
    )
  }

  const commentTree = buildCommentTree(comments)

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
          <h1 className="text-xl font-bold text-gray-900 mb-2">帖子不存在</h1>
          <p className="text-gray-600 mb-6">该帖子可能已被删除或不存在</p>
          <button
            onClick={() => navigate('/community')}
            className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-2 rounded-lg"
          >
            返回社区
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
          返回
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

        {/* 评论统计 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            评论 ({comments.length})
          </h2>
          {comments.length === 0 && (
            <p className="text-gray-500 text-sm">还没有评论，快来抢沙发！</p>
          )}
        </div>

        {/* 评论表单 */}
        {currentUser ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            {replyTo && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">正在回复评论</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <textarea
              id="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none transition-all resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                支持 Markdown 格式
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '发布中...' : '发布评论'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
            <p className="text-gray-600 mb-4">登录后即可参与评论</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-2 rounded-lg"
            >
              立即登录
            </button>
          </div>
        )}

        {/* 评论列表 */}
        <div className="space-y-4">
          {commentTree.map(comment => renderComment(comment))}
        </div>

        {/* 加载更多 */}
        {comments.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => {}}
              className="text-wimbledon-green hover:text-wimbledon-grass font-medium"
            >
              加载更多评论 →
            </button>
          </div>
        )}

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