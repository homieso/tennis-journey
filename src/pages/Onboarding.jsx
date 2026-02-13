// src/pages/Onboarding.jsx
// 用户核心档案填写页面（注册后必填）- 优化版：不再自动跳转，增加稍后填写

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser, updateProfile, checkProfileExists } from '../lib/auth'
import NTRPSlider from '../components/NTRPSlider'

function Onboarding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [profileExists, setProfileExists] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    gender: '',
    playingYears: '',
    selfRatedNtrp: 3.0,
    idol: '',
    tennisStyle: '',
    customStyle: '',
    // 新增选填字段
    age: '',
    location: '',
    equipment: '',
    injuryHistory: '',
    shortTermGoal: ''
  })

  // 检查是否已填写档案 + 识别编辑模式
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const editMode = params.get('edit') === 'true'
  checkUserAndProfile(editMode)
}, [])

const checkUserAndProfile = async (editMode = false) => {
  const { user } = await getCurrentUser()
  if (!user) {
    navigate('/login')
    return
  }
  
  setUser(user)
  
  // 检查是否已存在档案
  const { exists } = await checkProfileExists(user.id)
  setProfileExists(exists)
  
  if (exists) {
    // 如果是编辑模式，加载数据但不跳转
    await loadProfileData(user.id)
    if (!editMode) {
      // 非编辑模式下，已填写档案的用户跳转到挑战页
      navigate('/challenge')
    }
  }
}

  // 加载现有档案数据（用于编辑模式）
  const loadProfileData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      setFormData({
        gender: data.gender || '',
        playingYears: data.playing_years || '',
        selfRatedNtrp: data.self_rated_ntrp || 3.0,
        idol: data.idol || '',
        tennisStyle: data.tennis_style || '',
        customStyle: '',
        age: data.age || '',
        location: data.location || '',
        equipment: data.equipment || '',
        injuryHistory: data.injury_history || '',
        shortTermGoal: data.short_term_goal || ''
      })
    } catch (error) {
      console.error('加载档案失败:', error)
    }
  }

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 处理滑块变化
  const handleNtrpChange = (value) => {
    setFormData(prev => ({
      ...prev,
      selfRatedNtrp: value
    }))
  }

  // 处理网球风格选择
  const handleStyleChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      tennisStyle: value,
      customStyle: value === '自定义/多样化' ? prev.customStyle : ''
    }))
  }

  // 验证表单（仅必填项）
  const validateForm = () => {
    if (!formData.gender) return '请选择性别'
    if (!formData.playingYears) return '请输入球龄'
    if (formData.playingYears < 0 || formData.playingYears > 70) return '球龄必须在0-70年之间'
    if (!formData.idol.trim()) return '请输入你的启蒙球星/偶像'
    if (!formData.tennisStyle) return '请选择你的网球风格'
    if (formData.tennisStyle === '自定义/多样化' && !formData.customStyle.trim()) {
      return '请输入你的自定义风格描述'
    }
    return ''
  }

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    // 确定最终风格值
    const finalStyle = formData.tennisStyle === '自定义/多样化' 
      ? formData.customStyle 
      : formData.tennisStyle

    const { error } = await updateProfile(user.id, {
      ...formData,
      tennisStyle: finalStyle,
      age: formData.age ? parseInt(formData.age) : null,
      playingYears: parseInt(formData.playingYears)
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 档案保存成功 - 不再自动跳转，显示成功提示
    setError('')
    alert('档案保存成功！你可以继续完善信息，或开始7天挑战。')
  }

  // 网球风格选项
  const styleOptions = [
    '底线型',
    '上网型', 
    '全场型',
    '防守反击型',
    '大力发球型',
    '自定义/多样化'
  ]

  return (
    <div className="min-h-screen bg-wimbledon-white py-12 px-4 sm:px-6 lg:px-8 pb-24 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* 进度提示 */}
        <div className="mb-8 text-center">
          <h1 className="font-wimbledon text-3xl font-bold text-wimbledon-green">
            {profileExists ? '编辑网球档案' : '完成你的网球档案'}
          </h1>
          <p className="mt-2 text-gray-600">
            {profileExists 
              ? '补充更多信息，让球探报告更精准' 
              : '只需一步，让我们更好地了解你'}
          </p>
        </div>

        {/* 档案表单卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* ===== 必填区域 ===== */}
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">基本信息（必填）</h2>
              
              {/* 性别选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性别 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  {['男', '女', '其他', '不透露'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={formData.gender === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-wimbledon-grass border-gray-300 focus:ring-wimbledon-grass"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 球龄 */}
              <div className="mb-4">
                <label htmlFor="playingYears" className="block text-sm font-medium text-gray-700 mb-1">
                  球龄（年） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="playingYears"
                  name="playingYears"
                  min="0"
                  max="70"
                  value={formData.playingYears}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="例如：3"
                />
              </div>

              {/* NTRP自评滑块 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NTRP自评等级 <span className="text-red-500">*</span>
                </label>
                <NTRPSlider 
                  value={formData.selfRatedNtrp}
                  onChange={handleNtrpChange}
                />
              </div>

              {/* 启蒙球星 */}
              <div className="mb-4">
                <label htmlFor="idol" className="block text-sm font-medium text-gray-700 mb-1">
                  你的启蒙球星/偶像 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="idol"
                  name="idol"
                  value={formData.idol}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="例如：费德勒、纳达尔、李娜"
                />
              </div>

              {/* 网球风格 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的网球风格 <span className="text-red-500">*</span>
                </label>
                <select
                  name="tennisStyle"
                  value={formData.tennisStyle}
                  onChange={handleStyleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent bg-white"
                >
                  <option value="">请选择你的风格</option>
                  {styleOptions.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* 自定义风格输入 */}
              {formData.tennisStyle === '自定义/多样化' && (
                <div className="mb-4">
                  <label htmlFor="customStyle" className="block text-sm font-medium text-gray-700 mb-1">
                    请描述你的风格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customStyle"
                    name="customStyle"
                    value={formData.customStyle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                    placeholder="例如：发球上网、底线相持等"
                  />
                </div>
              )}
            </div>

            {/* ===== 选填区域 ===== */}
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">补充信息（选填）</h2>
              <p className="text-xs text-gray-500 mb-4">填写更多信息，让AI生成更精准的球探报告</p>
              
              {/* 年龄 */}
              <div className="mb-4">
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  年龄
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="5"
                  max="100"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="例如：28"
                />
              </div>

              {/* 地区 */}
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  所在地区
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="例如：北京、上海、广州"
                />
              </div>

              {/* 装备 */}
              <div className="mb-4">
                <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-1">
                  你的装备
                </label>
                <input
                  type="text"
                  id="equipment"
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent"
                  placeholder="例如：Wilson Blade v9, 天然羊肠线"
                />
              </div>

              {/* 伤病历史 */}
              <div className="mb-4">
                <label htmlFor="injuryHistory" className="block text-sm font-medium text-gray-700 mb-1">
                  伤病历史
                </label>
                <textarea
                  id="injuryHistory"
                  name="injuryHistory"
                  rows="2"
                  value={formData.injuryHistory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent resize-none"
                  placeholder="例如：膝盖不适、网球肘等"
                />
              </div>

              {/* 短期目标 */}
              <div className="mb-4">
                <label htmlFor="shortTermGoal" className="block text-sm font-medium text-gray-700 mb-1">
                  短期目标
                </label>
                <textarea
                  id="shortTermGoal"
                  name="shortTermGoal"
                  rows="2"
                  value={formData.shortTermGoal}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wimbledon-grass focus:border-transparent resize-none"
                  placeholder="例如：提高一发成功率、反手稳定性"
                />
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="pt-6 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : profileExists ? '更新档案' : '保存档案'}
              </button>
              
              {/* 稍后填写按钮 - 不自动跳转，让用户主动选择 */}
              <button
                type="button"
                onClick={() => navigate('/challenge')}
                className="w-full bg-white border border-wimbledon-grass text-wimbledon-grass hover:bg-wimbledon-grass/5 font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                稍后填写，先去挑战
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              标记 <span className="text-red-500">*</span> 的项目为必填，选填信息可随时在个人主页补充
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Onboarding