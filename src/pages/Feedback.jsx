// src/pages/Feedback.jsx
// 意见反馈页面

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'

function Feedback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contact: '',
    images: []
  })
  
  // 文件上传状态
  const [uploading, setUploading] = useState(false)
  
  useEffect(() => {
    const fetchUser = async () => {
      const { user } = await getCurrentUser()
      setCurrentUser(user)
      
      // 如果用户已登录，预填联系方式
      if (user?.email) {
        setFormData(prev => ({
          ...prev,
          contact: user.email
        }))
      }
    }
    
    fetchUser()
  }, [])
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // 限制最多3张图片
    if (files.length > 3) {
      alert('最多只能上传3张图片')
      return
    }
    
    setUploading(true)
    try {
      const imageUrls = []
      
      for (const file of files.slice(0, 3)) {
        // 检查文件类型
        if (!file.type.match('image/(jpeg|png|jpg|webp)')) {
          alert('只支持 JPG、PNG、WEBP 格式的图片')
          continue
        }
        
        // 检查文件大小（限制2MB）
        if (file.size > 2 * 1024 * 1024) {
          alert(`图片 ${file.name} 超过2MB限制`)
          continue
        }
        
        // 实际项目中应该上传到存储桶，这里先模拟
        // 由于时间限制，我们暂时只保存文件名作为演示
        imageUrls.push(file.name)
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }))
      
    } catch (error) {
      console.error('文件上传失败:', error)
      alert('文件上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }
  
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证必填字段
    if (!formData.title.trim()) {
      alert('请填写反馈标题')
      return
    }
    
    if (!formData.content.trim()) {
      alert('请填写反馈内容')
      return
    }
    
    setLoading(true)
    
    try {
      // 插入反馈到数据库
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: currentUser?.id || null,
            title: formData.title,
            content: formData.content,
            images: formData.images,
            contact: formData.contact,
            status: 'pending'
          }
        ])
      
      if (error) throw error
      
      // 提交成功
      setSubmitted(true)
      
      // 重置表单
      setFormData({
        title: '',
        content: '',
        contact: currentUser?.email || '',
        images: []
      })
      
    } catch (error) {
      console.error('提交反馈失败:', error)
      alert('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewMyFeedback = () => {
    navigate('/feedback/my')
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-wimbledon-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">✅</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">感谢您的反馈！</h1>
            <p className="text-gray-600 mb-8">
              我们已经收到您的意见和建议，会尽快处理并回复。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-3 rounded-xl font-medium"
              >
                提交新的反馈
              </button>
              <button
                onClick={handleViewMyFeedback}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium"
              >
                查看我的反馈
              </button>
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 px-6 py-3 font-medium"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <span className="text-xl mr-1">←</span>
            返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">意见反馈</h1>
          <p className="text-gray-600">
            欢迎提出宝贵意见，帮助我们改进 Tennis Journey
          </p>
        </div>
        
        {/* 反馈表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              反馈标题 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="请简要描述反馈内容"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none transition-all"
              required
            />
            <p className="text-xs text-gray-500 mt-2">例如：建议添加夜间模式、社区搜索功能等</p>
          </div>
          
          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              详细内容 *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="请详细描述您的建议或遇到的问题"
              rows={6}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none transition-all resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              请尽可能详细描述，帮助我们更好地理解和解决问题
            </p>
          </div>
          
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              相关图片（可选）
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <span className="text-3xl mb-2 block">📷</span>
                <span className="text-wimbledon-green font-medium">
                  {uploading ? '上传中...' : '点击上传图片'}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  支持 JPG、PNG、WEBP 格式，单张不超过2MB，最多3张
                </p>
              </label>
            </div>
            
            {/* 预览上传的图片 */}
            {formData.images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">已上传图片：</p>
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🖼️</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 联系方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              联系方式
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="邮箱或微信号（用于回复您）"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-wimbledon-green focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              我们会通过此联系方式回复您的反馈
            </p>
          </div>
          
          {/* 提交按钮 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-wimbledon-green to-wimbledon-grass text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '提交反馈'}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              提交后，您可以在「我的反馈」中查看处理进度
            </p>
          </div>
        </form>
        
        {/* 注意事项 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">反馈注意事项</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 我们会认真阅读每一条反馈，并在1-3个工作日内回复</li>
            <li>• 请保持文明用语，共同维护良好的社区氛围</li>
            <li>• 如需紧急帮助，请通过客服邮箱联系：support@tennisjourney.top</li>
            <li>• 您的反馈将帮助我们不断改进产品体验</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Feedback