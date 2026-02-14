// src/pages/DailyLog.jsx
// 每日打卡页面 - 支持编辑、悬停模板

import { useState, useRef, useEffect } from 'react'
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
  const [existingLog, setExistingLog] = useState(null)
  const [existingImageUrls, setExistingImageUrls] = useState([])
  const [isEditing, setIsEditing] = useState(false)

  const exampleTemplate = '分腿垫步练习3组，正手击球50次，发球练习20分钟'

  // 官方示例照片URL（硬编码，因为它们是固定的）
  const examplePhotos = {
    forehand: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg',
    splitStep: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg',
    serve: 'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/serve_3.jpg'
  }

  // 检查今天是否已经打卡
  useEffect(() => {
    checkExistingLog()
  }, [day])

  const checkExistingLog = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setExistingLog(data)
        setTextContent(data.text_content || '')
        setExistingImageUrls(data.image_urls || [])
        setIsEditing(true)
      }
    } catch (error) {
      console.error('检查打卡记录失败:', error)
    }
  }

  // 填充示例模板
  const fillTemplate = () => {
    setTextContent(exampleTemplate)
  }

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
      console.log('删除文件失败:', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (images.length === 0 && existingImageUrls.length === 0) {
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
      
      const newImageUrls = []
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}_${today}_${Date.now()}_${i}.${fileExt}`
        
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
              image_urls: allImageUrls,
              text_content: textContent,
              status: 'pending'
            }
          ])

        if (insertError) throw insertError
      }

      navigate('/challenge?refresh=' + Date.now(), { replace: true })

    } catch (err) {
      console.error('提交失败:', err)
      setError(err.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/challenge')}
            className="text-gray-600 hover:text-wimbledon-green"
          >
            ← 返回挑战
          </button>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            第 {day} 天 · {isEditing ? '编辑打卡' : '今日打卡'}
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

            {/* 打卡示范 - 悬停预览 + 点击放大 */}
            <div className="bg-wimbledon-grass/5 rounded-xl p-4">
              <div className="flex items-start">
                <span className="text-wimbledon-grass mr-2">📋</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-700">打卡示范：</span>
                  <span className="text-gray-600 text-sm ml-1">管理员打卡示范</span>
                </div>
                
                {/* 悬停预览区域 */}
                <div className="relative group ml-2">
                  <span className="text-gray-400 cursor-help hover:text-wimbledon-grass transition-colors text-lg">ⓘ</span>
                  
                  {/* 悬停弹出的缩略图预览 */}
                  <div className="absolute bottom-full right-0 mb-2 w-80 hidden group-hover:block bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-wimbledon-green text-sm">📸 管理员打卡示范</h4>
                      <span className="text-xs bg-wimbledon-grass/10 text-wimbledon-green px-2 py-1 rounded-full">
                        审核标准参考
                      </span>
                    </div>
                    
                    {/* 三张缩略图 - 按正确顺序：正手、垫步、发球 */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={examplePhotos.forehand}
                          alt="正手练习"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={examplePhotos.splitStep}
                          alt="垫步练习"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={examplePhotos.serve}
                          alt="发球练习"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* 示例文字 */}
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      <span className="font-medium text-gray-700">📝 训练内容：</span><br/>
                      正手练习——右手持拍，充分侧身向前挥拍，确保击球点在身体前方。<br/>
                      垫步练习——双腿站在边线，膝盖微弯，准备启动垫步。<br/>
                      发球练习——右手持拍置于后背，“奖杯式”举拍，充分顶肘向前向上挥拍。
                    </div>
                    
                    {/* 查看大图按钮 */}
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('example-modal').classList.remove('hidden')
                      }}
                      className="mt-3 w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white text-xs py-2 rounded-lg transition-colors"
                    >
                      🖼️ 点击查看完整示例
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 示例模板放大模态框 */}
            <div id="example-modal" className="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4" onClick={(e) => {
              if (e.target === e.currentTarget) {
                document.getElementById('example-modal').classList.add('hidden')
              }
            }}>
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-wimbledon text-xl font-bold text-wimbledon-green">
                    管理员打卡示范
                  </h3>
                  <button
                    onClick={() => document.getElementById('example-modal').classList.add('hidden')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  这是管理员提供的真实打卡示范。上传符合示例质量的照片和文字，有助于更快通过审核。
                </p>
                
                {/* 三张大图 - 按正确顺序 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <img 
                        src={examplePhotos.forehand}
                        alt="正手练习"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">正手练习</p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <img 
                        src={examplePhotos.splitStep}
                        alt="垫步练习"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">垫步练习</p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <img 
                        src={examplePhotos.serve}
                        alt="发球练习"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">发球练习</p>
                  </div>
                </div>
                
                {/* 训练心得 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <span className="text-wimbledon-grass mr-2">📝</span>
                    训练心得
                  </h4>
                  <div className="text-gray-700 text-sm bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                    <p>• 正手练习——右手持拍，充分侧身向前挥拍，确保击球点在身体前方。</p>
                    <p>• 垫步练习——双腿站在边线，膝盖微弯，准备启动垫步。</p>
                    <p>• 发球练习——右手持拍置于后背，“奖杯式”举拍，充分顶肘向前向上挥拍。</p>
                  </div>
                </div>
                
                <div className="mt-6 text-right">
                  <button
                    onClick={() => document.getElementById('example-modal').classList.add('hidden')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>

            {/* 图片上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                训练照片 {isEditing ? '(可编辑)' : ''}
                <span className="text-xs text-gray-500 ml-2">
                  {images.length + existingImageUrls.length}/3
                </span>
              </label>
              
              {/* 已上传的图片（编辑模式） */}
              {existingImageUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">已上传照片：</p>
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
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 新上传的图片预览 */}
              {previewUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">新上传照片：</p>
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
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 上传按钮 */}
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
                    <p className="mt-2 text-sm">点击上传照片</p>
                    <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/WEBP，单张≤2MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* 文字输入区域 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                训练心得
                {isEditing && <span className="text-xs text-gray-500 ml-2">(编辑模式)</span>}
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
                  {isEditing ? '修改后重新提交会覆盖原有记录' : '提交后由管理员审核'}
                </p>
                <p className="text-xs text-gray-500">
                  {textContent.length} / 500
                </p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : isEditing ? '更新打卡' : '提交打卡'}
              </button>
              {isEditing && (
                <p className="text-xs text-center text-wimbledon-green mt-2">
                  ⏎ 更新后会重新进入待审核状态
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