// src/components/CreatePostModal.jsx
// 发帖模态框 - 支持文字内容和图片上传

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'

function CreatePostModal({ isOpen, onClose, onPostCreated, prefilledContent = '' }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  
  const [content, setContent] = useState(prefilledContent)
  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const adminUserId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

  useEffect(() => {
    const fetchUser = async () => {
      const { user } = await getCurrentUser()
      setCurrentUser(user)
      if (user && user.id === adminUserId) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    }
    if (isOpen) {
      fetchUser()
      // 如果有预填内容，设置内容
      if (prefilledContent) {
        setContent(prefilledContent)
      }
    }
  }, [isOpen, prefilledContent])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 3) {
      setError(t('create_post.max_images', { count: 3 }))
      return
    }

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
      const isValidSize = file.size <= 2 * 1024 * 1024 // 2MB
      if (!isValidType) setError(t('create_post.invalid_format'))
      if (!isValidSize) setError(t('create_post.file_too_large'))
      return isValidType && isValidSize
    })

    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    
    setImages([...images, ...validFiles])
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
    setError('')
    e.target.value = ''
  }

  const removeImage = (index) => {
    const newImages = [...images]
    const newPreviewUrls = [...previewUrls]
    
    URL.revokeObjectURL(newPreviewUrls[index])
    
    newImages.splice(index, 1)
    newPreviewUrls.splice(index, 1)
    
    setImages(newImages)
    setPreviewUrls(newPreviewUrls)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && images.length === 0) {
      setError(t('create_post.content_or_image_required'))
      return
    }

    setUploading(true)
    setError('')

    try {
      const { user } = await getCurrentUser()
      if (!user) throw new Error(t('error.login_required'))

      const mediaUrls = []
      
      // 上传图片到 Supabase Storage
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `posts/${user.id}_${Date.now()}_${i}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('tennis-journey')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('tennis-journey')
          .getPublicUrl(fileName)

        mediaUrls.push(publicUrl)
      }

      // 创建帖子
      const postData = {
        user_id: user.id,
        content: content.trim(),
        media_type: images.length > 0 ? 'image' : 'none',
        media_urls: mediaUrls.join(','),
        like_count: 0,
        comment_count: 0,
        repost_count: 0,
        view_count: 0,
        created_at: new Date()
      }

      // 如果是管理员且勾选了公告，添加 is_announcement 字段
      if (isAdmin && isAnnouncement) {
        postData.is_announcement = true
      }

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single()

      if (postError) throw postError

      // 用户发布第一个帖子后，自动标记为已批准
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_approved: true })
          .eq('id', user.id);
        
        if (updateError) {
          console.warn('更新用户批准状态失败:', updateError);
        } else {
          console.log('用户已自动标记为已批准');
        }
      } catch (updateErr) {
        console.warn('自动批准用户失败:', updateErr);
      }

      // 清理预览URL
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      
      // 重置表单
      setContent('')
      setImages([])
      setPreviewUrls([])
      
      // 通知父组件
      if (onPostCreated) onPostCreated(post)
      
      // 关闭模态框
      onClose()
      
    } catch (err) {
      console.error('创建帖子失败:', err)
      setError(err.message || t('error.submission_failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    // 清理预览URL
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-wimbledon text-xl font-bold text-wimbledon-green">
            {t('create_post.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* 文字内容 */}
          <div className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('create_post.content_placeholder')}
              className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-wimbledon-green/50 focus:border-wimbledon-green"
              autoFocus
            />
          </div>

          {/* 图片预览 */}
          {previewUrls.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={t('create_post.preview_alt', { index: index + 1 })}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 错误消息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 管理员公告选项 */}
          {isAdmin && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                  className="w-4 h-4 text-wimbledon-green focus:ring-wimbledon-green rounded"
                />
                <span className="text-sm font-medium text-blue-800">
                  {t('admin.mark_as_announcement')}
                </span>
              </label>
              <p className="text-xs text-blue-600 mt-2">
                {t('admin.announcement_hint')}
              </p>
            </div>
          )}

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {/* 图片上传按钮 */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-gray-600 hover:text-wimbledon-green px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <span className="text-xl">📷</span>
                <span className="text-sm">{t('create_post.upload_images')}</span>
                {images.length > 0 && (
                  <span className="text-xs bg-wimbledon-green/10 text-wimbledon-green px-2 py-1 rounded-full">
                    {images.length}/3
                  </span>
                )}
              </button>
            </div>

            {/* 提交按钮 */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
                disabled={uploading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={uploading || (!content.trim() && images.length === 0)}
                className="px-5 py-2.5 bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? t('create_post.publishing') : t('create_post.publish')}
              </button>
            </div>
          </div>

          {/* 格式提示 */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            {t('create_post.format_hint')}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal