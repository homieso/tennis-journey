// src/pages/DailyLog.jsx
// 每日打卡页面 - 图片上传 + 文字日志

import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

function DailyLog() {
  const navigate = useNavigate()
  const { day } = useParams()
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [textContent, setTextContent] = useState('')
  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])

  const exampleTemplate = '分腿垫步练习3组，正手击球50次，发球练习20分钟'

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 3) {
      setError('最多只能上传3张照片')
      return
    }

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 2 * 1024 * 1024
      if (!isValidType) setError('只支持 JPG/PNG/WEBP 格式')
      if (!isValidSize) setError('单张照片不能超过2MB')
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
    
    if (images.length === 0) {
      setError('请至少上传一张训练照片')
      return
    }
    if (!textContent.trim()) {
      setError('请填写今日训练心得')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { user } = await getCurrentUser()
      if (!user) throw new Error('请先登录')

      const today = new Date().toISOString().split('T')[0]
      
      // 1. 检查今天是否已经打卡
      const { data: existingLog } = await supabase
        .from('daily_logs')
        .select('id, image_urls')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle()

      // 2. 上传新图片
      const imageUrls = []
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}_${today}_${Date.now()}_${i}.${fileExt}`
        
        // 删除可能存在的旧文件
        try {
          await supabase.storage
            .from('tennis-journey')
            .remove([fileName])
        } catch (e) {
          // 文件不存在，忽略
        }

        const { error: uploadError } = await supabase.storage
          .from('tennis-journey')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('tennis-journey')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // 3. 更新或插入打卡记录
      if (existingLog) {
        // 合并新旧图片
        const mergedUrls = [...(existingLog.image_urls || []), ...imageUrls]
        
        const { error: updateError } = await supabase
          .from('daily_logs')
          .update({
            image_urls: mergedUrls,
            text_content: textContent,
            status: 'pending',
            updated_at: new Date()
          })
          .eq('id', existingLog.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('daily_logs')
          .insert([
            {
              user_id: user.id,
              log_date: today,
              image_urls: imageUrls,
              text_content: textContent,
              status: 'pending'
            }
          ])

        if (insertError) throw insertError
      }

      // 4. ✅ 提交成功后：强制刷新挑战页数据
      navigate('/challenge?refresh=' + Date.now(), { replace: true })

    } catch (err) {
      console.error('提交失败:', err)
      setError(err.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/challenge')}
            className="text-gray-600 hover:text-wimbledon-green"
          >
            ← 返回挑战
          </button>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            第 {day} 天 · 今日打卡
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

            <div className="bg-wimbledon-grass/5 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-wimbledon-green">📝 示例模板：</span>
                {exampleTemplate}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                训练照片 {images.length > 0 && `(${images.length}/3)`}
              </label>
              
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={url} 
                        alt={`训练照片${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 3 && (
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
                    <p className="mt-2 text-sm">点击上传照片</p>
                    <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/WEBP，单张≤2MB</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                训练心得
              </label>
              <textarea
                id="content"
                rows="4"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={exampleTemplate}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-500 text-right">
                {textContent.length} / 500
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : '提交打卡'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                提交后将由管理员审核，审核通过后计入挑战进度
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DailyLog