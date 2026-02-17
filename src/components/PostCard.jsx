// src/components/PostCard.jsx
// 帖子卡片组件，支持展开/收起、图片显示、点赞/评论/转发功能

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'

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
      if (user) {
        checkUserInteractions(user.id)
      }
    }
    fetchCurrentUser()
  }, [])
  
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
    
    // 检查点赞
    const { data: likeData } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', post.id)
      .single()
    
    setLiked(!!likeData)
    
    // 检查转发
    const { data: repostData } = await supabase
      .from('reposts')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', post.id)
      .single()
    
    setReposted(!!repostData)
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
  
  // 处理转发（创建新帖子）
  const handleRepost = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    if (reposted) {
      alert(t('community.already_reposted'))
      return
    }
    
    const comment = window.prompt(t('community.repost_prompt', { default: '添加转发评论（可选）' }))
    
    setLoading(true)
    try {
      // 1. 创建新的帖子（转发）
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: currentUser.id,
            content: comment || t('community.default_repost_content'),
            original_post_id: post.id,
            like_count: 0,
            comment_count: 0,
            repost_count: 0,
            media_urls: post.media_urls || '',
            media_type: post.media_type || 'none',
            visibility: 'public'
          }
        ])
        .select()
        .single()
      
      if (postError) throw postError
      
      // 2. 记录到 reposts 表（用于快速查询）
      const { error: repostError } = await supabase
        .from('reposts')
        .insert([
          {
            user_id: currentUser.id,
            post_id: newPost.id,
            original_post_id: post.id,
            comment: comment || null
          }
        ])
      
      if (repostError) throw repostError
      
      // 3. 更新原帖的转发计数
      const { error: updateError } = await supabase
        .from('posts')
        .update({ repost_count: (post.repost_count || 0) + 1 })
        .eq('id', post.id)
      
      if (updateError) throw updateError
      
      setReposted(true)
      onRepostUpdate?.(post.id, 'increment')
      alert(t('community.repost_success'))
      
    } catch (error) {
      console.error('转发失败:', error)
      alert('转发失败，请重试')
    } finally {
      setLoading(false)
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
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              {deleting ? '删除中...' : '🗑️ 删除'}
            </button>
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
    </>
  )
}

export default PostCard