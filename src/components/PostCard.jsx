// src/components/PostCard.jsx
// 帖子卡片组件，支持展开/收起、图片显示、点赞/评论/转发功能

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'
import toast from 'react-hot-toast'

function PostCard({ post, onLikeUpdate, onCommentUpdate, onRepostUpdate, onDelete }) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  
  // 本地状态
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  
  // 图片相关状态
  const [imageUrls, setImageUrls] = useState([])
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // 转发弹窗状态
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostComment, setRepostComment] = useState('')

  // 管理员ID
  const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  const isAdmin = currentUser?.id === adminUserId
  
  // 帖子内容行数计算
  const MAX_LINES = 3
  const localizedContent = getLocalizedContent()
  const contentLines = localizedContent ? localizedContent.split('\n').length : 0
  const shouldShowExpand = contentLines > MAX_LINES
  
  // 获取当前用户
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { user } = await getCurrentUser()
      setCurrentUser(user)
    }
    fetchCurrentUser()
  }, [])

  // 当用户或帖子ID变化时检查互动状态
  useEffect(() => {
    if (currentUser?.id && post?.id) {
      checkUserInteractions(currentUser.id)
    } else {
      // 用户未登录或帖子无ID，重置状态
      setLiked(false)
      setReposted(false)
    }
  }, [currentUser?.id, post?.id])
  
  // 根据当前语言获取本地化内容
  function getLocalizedContent() {
    // 优先使用多语言字段
    if (currentLanguage === 'zh' && post.content_zh) return post.content_zh
    if (currentLanguage === 'en' && post.content_en) return post.content_en
    if (currentLanguage === 'zh_tw' && post.content_zh_tw) return post.content_zh_tw
    // 回退到原始内容
    return post.content || ''
  }

  // 检查用户是否已点赞/转发
  const checkUserInteractions = async (userId) => {
    if (!post?.id) return
    
    try {
      // 检查点赞 - 使用 select 而不是 single 避免错误
      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', post.id)
      
      if (likeError) {
        console.error('检查点赞失败:', likeError)
        setLiked(false)
      } else {
        setLiked(likeData && likeData.length > 0)
      }
      
      // 检查转发
      const { data: repostData, error: repostError } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', post.id)
      
      if (repostError) {
        console.error('检查转发失败:', repostError)
        setReposted(false)
      } else {
        setReposted(repostData && repostData.length > 0)
      }
    } catch (error) {
      console.error('检查用户互动失败:', error)
      setLiked(false)
      setReposted(false)
    }
  }
  
  // 解析图片URL
  useEffect(() => {
    if (post.media_urls) {
      const urls = post.media_urls.split(',').filter(url => url.trim())
      setImageUrls(urls)
    } else if (post.image_url) {
      setImageUrls([post.image_url])
    }
  }, [post.media_urls, post.image_url])
  
  // 处理点赞
  const handleLike = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    setLoading(true)
    try {
      if (liked) {
        // 取消点赞
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id)
        
        if (!error) {
          setLiked(false)
          onLikeUpdate?.(post.id, 'decrement')
        }
      } else {
        // 点赞
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              user_id: currentUser.id,
              post_id: post.id
            }
          ])
        
        if (!error) {
          setLiked(true)
          onLikeUpdate?.(post.id, 'increment')
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 打开转发弹窗
  const handleRepost = () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    if (reposted) {
      alert(t('community.already_reposted'))
      return
    }
    
    setShowRepostModal(true)
  }
  
  // 取消转发
  const handleCancelRepost = () => {
    setShowRepostModal(false)
    setRepostComment('')
  }
  
  // 确认转发
  const handleConfirmRepost = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    setLoading(true)
    try {
      // 调用 Supabase 插入 reposts 表
      const { data, error } = await supabase
        .from('reposts')
        .insert([{
          user_id: currentUser.id,
          post_id: post.id,
          original_post_id: post.original_post_id || post.id,
          comment: repostComment || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setShowRepostModal(false);
      setReposted(true);
      onRepostUpdate?.(post.id, 'increment');
      
      // 使用 toast 显示成功消息
      toast.success(t('postCard.repost_success'));
    } catch (error) {
      console.error('转发失败:', error);
      toast.error(t('postCard.repost_failed'));
    } finally {
      setLoading(false);
      setRepostComment('');
    }
  }
  
  // 处理分享（复制链接）
  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    
    // 尝试使用 Web Share API（现代浏览器支持）
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tennis Journey 帖子分享',
          text: localizedContent?.substring(0, 100) || '看看这个网球相关的帖子',
          url: postUrl,
        })
        return
      } catch (error) {
        console.log('Web Share API 失败，使用复制链接方式:', error)
      }
    }
    
    // 备用方案：复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(postUrl)
      alert('链接已复制到剪贴板！\n' + postUrl)
    } catch (error) {
      // 如果剪贴板 API 失败，显示链接让用户手动复制
      const fallbackText = `分享链接: ${postUrl}`
      prompt('请复制以下链接分享给朋友:', fallbackText)
    }
  }

  // 处理删除（仅管理员）
  const handleDelete = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
    if (currentUser.id !== adminUserId) {
      alert(t('admin.only_admin_delete'))
      return
    }

    const confirmed = window.confirm(t('admin.delete_confirm'))
    if (!confirmed) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      alert(t('admin.delete_success'))
      // 通知父组件更新
      if (typeof onDelete === 'function') {
        onDelete(post.id)
      }
    } catch (error) {
      console.error('删除帖子失败:', error)
      alert('删除失败: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  // 处理评论点击
  const handleCommentClick = () => {
    navigate(`/post/${post.id}`)
  }
  
  // 处理图片点击（放大预览）
  const handleImageClick = (index) => {
    setSelectedImageIndex(index)
    setShowImageLightbox(true)
  }
  
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
  
  // 获取九宫格布局的CSS类
  const getGridClass = () => {
    const count = imageUrls.length
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count === 3) return 'grid-cols-2'
    if (count === 4) return 'grid-cols-2'
    return 'grid-cols-3'
  }
  
  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow">
        {/* 帖子头部：用户信息 */}
        <div className="flex items-start mb-3">
          {/* 头像 */}
          <div className="w-10 h-10 rounded-full bg-wimbledon-grass/20 flex items-center justify-center text-wimbledon-green font-bold mr-3">
            {post.profiles?.avatar_url ? (
              <img 
                src={post.profiles.avatar_url} 
                alt="avatar" 
                className="w-full h-full rounded-full object-cover" 
              />
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
                  🎾 {post.profiles.playing_years}{t('community.years_suffix')}
                </span>
              )}
              {post.profiles?.self_rated_ntrp && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  NTRP {post.profiles.self_rated_ntrp}
                </span>
              )}
              {post.profiles?.location && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  📍 {post.profiles.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 帖子内容 */}
        <div className="ml-13 pl-2">
          {/* 文字内容 */}
          {localizedContent && (
            <div className="mb-3">
              <p
                className={`text-gray-700 text-sm leading-relaxed whitespace-pre-wrap ${
                  !expanded && shouldShowExpand ? 'line-clamp-3' : ''
                }`}
              >
                {localizedContent}
              </p>
              
              {/* 展开/收起按钮 */}
              {shouldShowExpand && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-wimbledon-green hover:text-wimbledon-grass text-xs font-medium mt-1"
                >
                  {expanded ? t('community.collapse') : t('community.expand')}
                </button>
              )}
            </div>
          )}
          
          {/* 图片显示（九宫格） */}
          {imageUrls.length > 0 && (
            <div className="mb-4">
              <div className={`grid ${getGridClass()} gap-2`}>
                {imageUrls.slice(0, 9).map((url, index) => (
                  <div 
                    key={index}
                    className={`relative overflow-hidden rounded-xl cursor-pointer ${
                      imageUrls.length === 1 ? 'max-h-96' : 'aspect-square'
                    }`}
                    onClick={() => handleImageClick(index)}
                  >
                    <img
                      src={url}
                      alt={t('community.post_image')}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* 超过9张图片的提示 */}
                    {index === 8 && imageUrls.length > 9 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          +{imageUrls.length - 9}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 图片数量提示 */}
              {imageUrls.length > 1 && (
                <p className="text-xs text-gray-500 mt-2">
                  {t('community.photo_count', { count: imageUrls.length })}
                </p>
              )}
            </div>
          )}
          
          {/* 球探报告标识 */}
          {post.report_id && (
            <div className="mb-2">
              <span className="inline-flex items-center bg-wimbledon-grass/10 text-wimbledon-green text-xs px-3 py-1.5 rounded-full">
                <span className="mr-1">🎯</span>
                {t('community.scout_report_label')} · {post.scout_reports?.generated_at ? formatTime(post.scout_reports.generated_at) : t('community.just_now')}
              </span>
            </div>
          )}
        </div>

        {/* 互动功能区 */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* 点赞按钮 */}
            <button
              type="button"
              onClick={handleLike}
              disabled={loading || !currentUser}
              className={`flex items-center gap-1.5 transition-colors text-sm ${
                liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
              <span className="font-medium">{post.like_count || 0}</span>
              <span className="text-xs opacity-80">{t('community.like')}</span>
            </button>
            
            {/* 评论按钮 */}
            <button
              type="button"
              onClick={handleCommentClick}
              className="flex items-center gap-1.5 text-gray-500 hover:text-wimbledon-green transition-colors text-sm"
            >
              <span className="text-lg">💬</span>
              <span className="font-medium">{post.comment_count || 0}</span>
              <span className="text-xs opacity-80">{t('community.comment')}</span>
            </button>
            
            {/* 转发按钮 */}
            <button
              type="button"
              onClick={handleRepost}
              disabled={loading || !currentUser || reposted}
              className={`flex items-center gap-1.5 transition-colors text-sm ${
                reposted ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <span className="text-lg">🔄</span>
              <span className="font-medium">{post.repost_count || 0}</span>
              <span className="text-xs opacity-80">{t('community.repost')}</span>
            </button>
          </div>
          
          {/* 删除按钮（仅管理员可见） */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                {deleting ? t('admin.deleting') : t('admin.delete_button')}
              </button>
              {/* 编辑按钮（仅管理员可见） */}
              <button
                type="button"
                onClick={() => alert(t('admin.edit_post') + ' 功能即将上线')}
                className="text-blue-400 hover:text-blue-600 text-sm ml-4"
              >
                {t('admin.edit_button')}
              </button>
            </>
          )}
        </div>
        
        {/* 如果是转发，显示原帖信息 */}
        {post.original_post_id && post.original_post_id !== post.id && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600">
            <p className="flex items-center gap-1">
              <span>🔄</span>
              <span>{t('community.reposted_from')} {getUserName(post.original_post?.profiles)}</span>
            </p>
          </div>
        )}
      </div>
      
      {/* 图片灯箱（放大预览） */}
      {showImageLightbox && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageLightbox(false)}
              className="absolute top-4 right-4 text-white text-2xl z-10"
            >
              ✕
            </button>
            
            <img
              src={imageUrls[selectedImageIndex]}
              alt={t('community.post_image')}
              className="max-w-full max-h-[80vh] object-contain"
            />
            
            {/* 导航箭头 */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl"
                >
                  →
                </button>
                
                {/* 缩略图指示器 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageIndex(index)
                      }}
                      className={`w-2 h-2 rounded-full ${
                        index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* 转发弹窗 */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">转发</h3>
              <button
                onClick={handleCancelRepost}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">添加转发评论（可选）</p>
              <textarea
                value={repostComment}
                onChange={(e) => setRepostComment(e.target.value)}
                placeholder="说点什么..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelRepost}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRepost}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-wimbledon-grass hover:bg-wimbledon-green text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '转发中...' : '确认转发'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PostCard