// src/pages/DailyLog.jsx
// 每日打卡页面 - 支持编辑、点击示例

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'

function DailyLog() {
  const navigate = useNavigate()
  const { day } = useParams()
  const fileInputRef = useRef(null)
  const { t } = useTranslation()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [textContent, setTextContent] = useState('')
  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [existingLog, setExistingLog] = useState(null)
  const [existingImageUrls, setExistingImageUrls] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [showExampleModal, setShowExampleModal] = useState(false)

  const exampleTemplate = t('challenge.example_content')

  // 官方示例照片URL
  const examplePhotos = {
    forehand: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg',
    splitStep: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg',
    serve: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/serve_3.jpg'
  }

  useEffect(() => {
    checkExistingLog()
  }, [day])

  const checkExistingLog = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      // 获取用户的挑战开始日期
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('challenge_start_date')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (!profile?.challenge_start_date) {
        console.error(t('error.no_challenge_start_date'))
        return
      }

      // 根据挑战开始日期和第几天计算对应的日期
      const startDate = new Date(profile.challenge_start_date)
      const targetDate = new Date(startDate)
      targetDate.setDate(startDate.getDate() + (parseInt(day) - 1))
      const targetDateStr = targetDate.toISOString().split('T')[0]
      
      // 查询对应日期的打卡记录
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', targetDateStr)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setExistingLog(data)
        setTextContent(data.text_content || '')
        setExistingImageUrls(data.image_urls || [])
        setIsEditing(true)
      }
    } catch (error) {
      console.error(t('error.check_log_failed'), error)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 3) {
      setError(t('error.max_photos'))
      return
    }

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 2 * 1024 * 1024
      if (!isValidType) setError(t('error.invalid_format'))
      if (!isValidSize) setError(t('error.file_too_large'))
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

  const removeExistingImage = async (index) => {
    const urlToRemove = existingImageUrls[index]
    const newUrls = existingImageUrls.filter((_, i) => i !== index)
    setExistingImageUrls(newUrls)

    try {
      const path = urlToRemove.split('/').pop()
      await supabase.storage
        .from('tennis-journey')
        .remove([path])
    } catch (e) {
      console.log(t('error.delete_file_failed'), e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (images.length === 0 && existingImageUrls.length === 0) {
      setError(t('error.required_photos'))
      return
    }
    if (!textContent.trim()) {
      setError(t('error.required_content'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const { user } = await getCurrentUser()
      if (!user) throw new Error(t('error.login_required'))

      // 获取用户的挑战开始日期
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('challenge_start_date')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (!profile?.challenge_start_date) {
        throw new Error(t('error.no_challenge_start_date'))
      }

      // 根据挑战开始日期和第几天计算对应的日期
      const startDate = new Date(profile.challenge_start_date)
      const targetDate = new Date(startDate)
      targetDate.setDate(startDate.getDate() + (parseInt(day) - 1))
      const targetDateStr = targetDate.toISOString().split('T')[0]
      
      const newImageUrls = []
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}_${targetDateStr}_${Date.now()}_${i}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('tennis-journey')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('tennis-journey')
          .getPublicUrl(fileName)

        newImageUrls.push(publicUrl)
      }

      const allImageUrls = [...existingImageUrls, ...newImageUrls]

      if (existingLog) {
        const { error: updateError } = await supabase
          .from('daily_logs')
          .update({
            image_urls: allImageUrls,
            text_content: textContent,
            status: 'pending',
            updated_at: new Date(),
            submitted_at: new Date()
          })
          .eq('id', existingLog.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('daily_logs')
          .insert([
            {
              user_id: user.id,
              log_date: targetDateStr,
              image_urls: allImageUrls,
              text_content: textContent,
              status: 'pending',
              submitted_at: new Date()
            }
          ])

        if (insertError) throw insertError
      }

      navigate('/challenge?refresh=' + Date.now(), { replace: true })

    } catch (err) {
      console.error(t('error.submission_failed'), err)
      setError(err.message || t('error.submission_failed'))
    } finally {
      setLoading(false)
    }
  }

  // 判断是否是今天
  const isToday = () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // 从现有数据中获取目标日期
      if (existingLog) {
        return existingLog.log_date === today
      }
      
      // 如果没有现有记录，尝试计算目标日期
      // 这里我们假设用户已登录且有挑战开始日期
      return false // 简化处理，实际应用中需要更复杂的逻辑
    } catch (e) {
      return false
    }
  }

  const pageTitle = isEditing ? t('dailylog.edit_mode') : (isToday() ? t('dailylog.today_log') : t('dailylog.makeup_log'))

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/challenge')}
            className="text-gray-600 hover:text-wimbledon-green transition-colors duration-200 px-4 py-2 rounded-full hover:bg-wimbledon-green/5"
          >
            {t('dailylog.back_to_challenge')}
          </button>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            {t('dailylog.title', { day, type: pageTitle })}
          </h1>
          <div className="w-16"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 打卡示范 - 点击ⓘ打开模态框 */}
            <div className="bg-wimbledon-grass/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-wimbledon-grass mr-2">📋</span>
                  <span className="font-medium text-gray-700">{t('dailylog.example')}</span>
                </div>
                
                {/* 点击区域：ⓘ + 文字 */}
                <button
                  type="button"
                  onClick={() => setShowExampleModal(true)}
                  className="flex items-center gap-1 text-wimbledon-green hover:text-wimbledon-grass transition-all duration-200 px-3 py-1.5 rounded-full hover:bg-wimbledon-green/10 hover:shadow-sm"
                >
                  <span className="text-lg">ⓘ</span>
                  <span className="text-sm">{t('dailylog.example_view')}</span>
                </button>
              </div>
            </div>

            {/* 示例模板放大模态框 */}
            {showExampleModal && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowExampleModal(false)}>
                <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-wimbledon text-xl font-bold text-wimbledon-green">
                      {t('dailylog.example_modal.title')}
                    </h3>
                    <button
                      onClick={() => setShowExampleModal(false)}
                      className="text-gray-500 hover:text-gray-700 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    {t('dailylog.example_modal.description')}
                  </p>
                  
                  {/* 三张大图 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <img 
                          src={examplePhotos.forehand}
                          alt="正手练习"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">{t('dailylog.example_photo_captions.forehand')}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <img 
                          src={examplePhotos.splitStep}
                          alt="垫步练习"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">{t('dailylog.example_photo_captions.split_step')}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <img 
                          src={examplePhotos.serve}
                          alt="发球练习"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">{t('dailylog.example_photo_captions.serve')}</p>
                    </div>
                  </div>
                  
                  {/* 训练心得 */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <span className="text-wimbledon-grass mr-2">📝</span>
                      {t('dailylog.content.title')}
                    </h4>
                    <div className="text-gray-700 text-sm bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                      <p>{t('dailylog.example_bullet.forehand')}</p>
                      <p>{t('dailylog.example_bullet.split_step')}</p>
                      <p>{t('dailylog.example_bullet.serve')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-right">
                    <button
                      onClick={() => setShowExampleModal(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm transition-all duration-200 hover:shadow-md"
                    >
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 图片上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dailylog.photos.title', { editable: isEditing ? t('dailylog.photos.editable') : '' })}
                <span className="text-xs text-gray-500 ml-2">
                  {images.length + existingImageUrls.length}/3
                </span>
              </label>
              
              {existingImageUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">{t('dailylog.photos.uploaded')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImageUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={url} 
                          alt={`已上传照片${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200 hover:scale-110 hover:shadow-md"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">{t('dailylog.photos.new')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={url} 
                          alt={`新照片${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200 hover:scale-110 hover:shadow-md"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {images.length + existingImageUrls.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-wimbledon-grass cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-gray-500">
                    <span className="text-3xl">📸</span>
                    <p className="mt-2 text-sm">{t('dailylog.photos.upload')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('dailylog.photos.format')}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dailylog.content.title')}
                {isEditing && <span className="text-xs text-gray-500 ml-2">{t('dailylog.content.edit_mode')}</span>}
              </label>
              <textarea
                id="content"
                rows="4"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={exampleTemplate}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {isEditing ? t('dailylog.content.edit_note') : t('dailylog.content.review_note')}
                </p>
                <p className="text-xs text-gray-500">
                  {textContent.length} / 500
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3.5 rounded-full transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('dailylog.submitting') : isEditing ? t('dailylog.update') : t('dailylog.submit')}
              </button>
              {isEditing && (
                <p className="text-xs text-center text-wimbledon-green mt-2">
                  {t('dailylog.update_note')}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DailyLog