// src/components/CommentSection.jsx
// 评论区组件 - 参考微博评论区设计

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'

function CommentSection({ postId, postAuthorId }) {
  const { t } = useTranslation()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [commentContent, setCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState([])
  const [simultaneousRepost, setSimultaneousRepost] = useState(false)
  const [posting, setPosting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showReplyInput, setShowReplyInput] = useState({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const emojiPickerRef = useRef(null)

  // 每页加载的评论数
  const COMMENTS_PER_PAGE = 10

  // 点击外部关闭emoji选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 获取当前用户
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { user } = await getCurrentUser()
      setCurrentUser(user)
    }
    fetchCurrentUser()
  }, [])

  // 加载评论
  const loadComments = async (pageNum = 1, append = false) => {
    if (!postId) return

    setLoading(true)
    try {
      const from = (pageNum - 1) * COMMENTS_PER_PAGE
      const to = from + COMMENTS_PER_PAGE - 1

      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            location,
            playing_years,
            self_rated_ntrp
          ),
          replies:comments!parent_id (
            *,
            profiles (
              id,
              username,
              display_name,
              avatar_url,
              location,
              playing_years,
              self_rated_ntrp
            )
          )
        `, { count: 'exact' })
        .eq('post_id', postId)
        .is('parent_id', null) // 只获取顶级评论
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      if (append) {
        setComments(prev => [...prev, ...data])
      } else {
        setComments(data)
      }

      setHasMore(data.length === COMMENTS_PER_PAGE)
      setPage(pageNum)
    } catch (error) {
      console.error('加载评论失败:', error)
      toast.error('加载评论失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (postId) {
      loadComments(1, false)
    }
  }, [postId])

  // 获取用户昵称
  const getUserName = (profile) => {
    if (profile?.username) return profile.username
    if (profile?.display_name) return profile.display_name
    return `${t('community.default_user')}${profile?.id?.slice(0, 4) || ''}`
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // 1小时内：X分钟前
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return t('community.minutes_ago', { minutes }, `${minutes}分钟前`)
    }
    // 24小时内：X小时前
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return t('community.hours_ago', { hours }, `${hours}小时前`)
    }
    // 7天内：X天前
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return t('community.days_ago', { days }, `${days}天前`)
    }
    // 更早：显示日期
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }

  // 处理发布评论
  const handlePostComment = async () => {
    if (!currentUser) {
      toast.error(t('postDetail.login_to_comment'))
      return
    }

    if (!commentContent.trim()) {
      toast.error(t('postDetail.comment_required'))
      return
    }

    setPosting(true)
    try {
      // 1. 创建评论
      const commentData = {
        user_id: currentUser.id,
        post_id: postId,
        content: commentContent,
        parent_id: replyingTo?.id || null
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            location,
            playing_years,
            self_rated_ntrp
          )
        `)
        .single()

      if (error) throw error

      // 2. 如果勾选了同时转发，创建转发记录
      if (simultaneousRepost && !replyingTo) {
        await supabase
          .from('reposts')
          .insert([{
            user_id: currentUser.id,
            post_id: postId,
            original_post_id: postId,
            comment: commentContent
          }])
      }

      // 3. 更新评论列表
      if (replyingTo) {
        // 如果是回复，添加到对应评论的回复列表
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return {
              ...c,
              replies: [...(c.replies || []), comment]
            }
          }
          return c
        }))
      } else {
        // 如果是顶级评论，添加到评论列表顶部
        setComments(prev => [comment, ...prev])
      }

      // 4. 重置表单
      setCommentContent('')
      setReplyingTo(null)
      setUploadedImages([])
      setSimultaneousRepost(false)
      setShowReplyInput({})

      toast.success(t('postDetail.comment_success'))
    } catch (error) {
      console.error('发布评论失败:', error)
      toast.error(t('postDetail.comment_failed'))
    } finally {
      setPosting(false)
    }
  }

  // 处理点赞评论
  const handleLikeComment = async (commentId) => {
    if (!currentUser) {
      toast.error('请先登录')
      return
    }

    try {
      // 检查是否已点赞
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('comment_id', commentId)
        .single()

      if (existingLike) {
        // 取消点赞
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id)

        // 更新本地状态
        updateCommentLikeCount(commentId, -1)
      } else {
        // 点赞
        await supabase
          .from('comment_likes')
          .insert([{
            user_id: currentUser.id,
            comment_id: commentId
          }])

        // 更新本地状态
        updateCommentLikeCount(commentId, 1)
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      toast.error('操作失败')
    }
  }

  // 更新评论点赞数
  const updateCommentLikeCount = (commentId, delta) => {
    const updateComment = (commentList) => {
      return commentList.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            like_count: Math.max(0, (comment.like_count || 0) + delta)
          }
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateComment(comment.replies)
          }
        }
        return comment
      })
    }

    setComments(prev => updateComment(prev))
  }

  // 处理删除评论
  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return

    const confirmed = window.confirm('确定要删除这条评论吗？')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      // 从本地状态中移除评论
      const removeComment = (commentList) => {
        return commentList.filter(comment => comment.id !== commentId)
          .map(comment => {
            if (comment.replies) {
              return {
                ...comment,
                replies: removeComment(comment.replies)
              }
            }
            return comment
          })
      }

      setComments(prev => removeComment(prev))
      toast.success('评论已删除')
    } catch (error) {
      console.error('删除评论失败:', error)
      toast.error('删除失败')
    }
  }

  // 加载更多评论
  const handleLoadMore = () => {
    loadComments(page + 1, true)
  }

  // 处理emoji选择
  const handleEmojiClick = (emojiData) => {
    setCommentContent(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  // 上传图片到Supabase Storage
  const uploadImages = async (files) => {
    const urls = []
    for (const file of files) {
      try {
        const fileName = `comments/${postId}/${currentUser.id}/${Date.now()}_${file.name}`
        const { error } = await supabase.storage
          .from('tennis-journey')
          .upload(fileName, file)
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('tennis-journey')
          .getPublicUrl(fileName)
        
        urls.push(publicUrl)
      } catch (error) {
        console.error('图片上传失败:', error)
        toast.error('图片上传失败')
      }
    }
    return urls
  }

  // 处理图片上传
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 3) {
      toast.error('最多只能上传3张图片')
      return
    }
    
    setUploadedImages(files)
    const urls = await uploadImages(files)
    setUploadedImageUrls(urls)
    
    // 将图片URL添加到评论内容中
    const imageText = urls.map(url => `\n![图片](${url})`).join('')
    setCommentContent(prev => prev + imageText)
  }

  // 打开图片预览
  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // 渲染单个评论
  const renderComment = (comment, isReply = false) => {
    const isAuthor = comment.user_id === postAuthorId
    const isCurrentUser = currentUser?.id === comment.user_id
    const replyCount = comment.replies?.length || 0

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mb-4'}`}>
        <div className="flex">
          {/* 头像 */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full bg-wimbledon-grass/20 flex items-center justify-center text-wimbledon-green text-sm font-bold">
              {comment.profiles?.avatar_url ? (
                <img 
                  src={comment.profiles.avatar_url} 
                  alt="avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                getUserName(comment.profiles).charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* 评论内容 */}
          <div className="flex-1">
            {/* 用户信息 */}
            <div className="flex items-center mb-1">
              <span className="font-medium text-gray-800 text-sm">
                {getUserName(comment.profiles)}
              </span>
              {isAuthor && (
                <span className="ml-2 px-1.5 py-0.5 bg-wimbledon-green/10 text-wimbledon-green text-xs rounded">
                  作者
                </span>
              )}
              {comment.profiles?.location && (
                <span className="ml-2 text-xs text-gray-500">
                  📍 {comment.profiles.location}
                </span>
              )}
              <span className="ml-2 text-xs text-gray-400">
                {formatTime(comment.created_at)}
              </span>
            </div>

            {/* 评论正文 */}
            <div className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
              {comment.content}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center text-xs text-gray-500 space-x-4">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className="flex items-center hover:text-red-500"
              >
                <span className="mr-1">❤️</span>
                <span>{comment.like_count || 0}</span>
              </button>

              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo(comment)
                    setShowReplyInput(prev => ({ ...prev, [comment.id]: true }))
                  }}
                  className="hover:text-wimbledon-green"
                >
                  {t('postDetail.reply')}
                </button>
              )}

              {isCurrentUser && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="hover:text-red-600"
                >
                  删除
                </button>
              )}

              {replyCount > 0 && !isReply && (
                <button
                  onClick={() => setShowReplyInput(prev => ({ 
                    ...prev, 
                    [comment.id]: !prev[comment.id] 
                  }))}
                  className="hover:text-wimbledon-green"
                >
                  {showReplyInput[comment.id] ? '收起回复' : `查看${replyCount}条回复`}
                </button>
              )}
            </div>

            {/* 回复输入框 */}
            {showReplyInput[comment.id] && (
              <div className="mt-3">
                <div className="flex">
                  <div className="flex-1">
                    <textarea
                      value={replyingTo?.id === comment.id ? commentContent : ''}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder={`回复 ${getUserName(comment.profiles)}...`}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handlePostComment()
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-gray-500 hover:text-gray-700 text-lg"
                          title={t('postDetail.emoji')}
                        >
                          😊
                        </button>
                        <button
                          onClick={() => document.getElementById('comment-image-upload').click()}
                          className="text-gray-500 hover:text-gray-700 text-lg"
                          title={t('postDetail.upload_image')}
                        >
                          📷
                        </button>
                        <input
                          id="comment-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            // 处理图片上传
                            const files = Array.from(e.target.files)
                            if (files.length > 3) {
                              toast.error('最多只能上传3张图片')
                              return
                            }
                            setUploadedImages(files)
                          }}
                        />
                      </div>
                      <button
                        onClick={handlePostComment}
                        disabled={posting || !commentContent.trim()}
                        className="px-4 py-1.5 bg-wimbledon-green text-white text-sm rounded-lg hover:bg-wimbledon-grass disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {posting ? t('postDetail.posting') : t('postDetail.reply')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 显示回复 */}
            {showReplyInput[comment.id] && comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 如果没有登录，显示登录提示
  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <p className="text-gray-600 mb-4">{t('postDetail.login_to_comment')}</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-wimbledon-green text-white rounded-lg hover:bg-wimbledon-grass"
        >
          {t('postDetail.go_login')}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6">
      {/* 评论标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {t('postDetail.comments_title')}
          <span className="ml-2 text-gray-500 text-sm font-normal">
            ({comments.length})
          </span>
        </h3>
      </div>

      {/* 评论输入框 */}
      <div className="mb-6">
        <div className="flex">
          {/* 用户头像 */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-wimbledon-grass/20 flex items-center justify-center text-wimbledon-green font-bold">
              {currentUser?.id?.slice(0, 1).toUpperCase() || 'U'}
            </div>
          </div>

          {/* 输入区域 */}
          <div className="flex-1 relative">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyingTo ? `回复 ${getUserName(replyingTo.profiles)}...` : t('postDetail.comment_placeholder')}
              rows={3}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handlePostComment()
                }
              }}
            />
            
            {/* Emoji选择器 */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute z-10 mt-2">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                  previewConfig={{ showPreview: false }}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                />
              </div>
            )}
            
            {/* 已上传图片预览 */}
            {uploadedImageUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedImageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`上传的图片 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                      onClick={() => openLightbox(index)}
                    />
                    <button
                      onClick={() => {
                        const newUrls = [...uploadedImageUrls]
                        newUrls.splice(index, 1)
                        setUploadedImageUrls(newUrls)
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                  title={t('postDetail.emoji')}
                >
                  😊
                </button>
                <button
                  onClick={() => document.getElementById('main-comment-image-upload').click()}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                  title={t('postDetail.upload_image')}
                >
                  📷
                </button>
                <input
                  id="main-comment-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label className="flex items-center space-x-1 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={simultaneousRepost}
                    onChange={(e) => setSimultaneousRepost(e.target.checked)}
                    className="rounded text-wimbledon-green focus:ring-wimbledon-green"
                  />
                  <span>{t('postDetail.simultaneous_repost')}</span>
                </label>
              </div>
              <button
                onClick={handlePostComment}
                disabled={posting || !commentContent.trim()}
                className="px-5 py-2 bg-wimbledon-green text-white rounded-lg hover:bg-wimbledon-grass disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? t('postDetail.posting') : t('postDetail.post_comment')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="mt-6">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('postDetail.loading_comments')}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('postDetail.no_comments')}
          </div>
        ) : (
          <div>
            {comments.map(comment => renderComment(comment))}
            
            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 text-sm text-wimbledon-green border border-wimbledon-green rounded-lg hover:bg-wimbledon-green/5"
                >
                  {t('postDetail.load_more')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 图片预览Lightbox */}
      {lightboxOpen && uploadedImageUrls.length > 0 && (
        <Lightbox
          mainSrc={uploadedImageUrls[lightboxIndex]}
          nextSrc={uploadedImageUrls[(lightboxIndex + 1) % uploadedImageUrls.length]}
          prevSrc={uploadedImageUrls[(lightboxIndex + uploadedImageUrls.length - 1) % uploadedImageUrls.length]}
          onCloseRequest={() => setLightboxOpen(false)}
          onMovePrevRequest={() =>
            setLightboxIndex((lightboxIndex + uploadedImageUrls.length - 1) % uploadedImageUrls.length)
          }
          onMoveNextRequest={() =>
            setLightboxIndex((lightboxIndex + 1) % uploadedImageUrls.length)
          }
        />
      )}
    </div>
  )
}

export default CommentSection
