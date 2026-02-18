// src/pages/ScoutReport.jsx
// 球探报告完整版 - 显示AI生成的报告并支持发布（已升级为自动发布长图）

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { generateAndPostReportScreenshot, getExistingPost } from '../lib/reportScreenshot'
import { t } from '../lib/i18n'

function ScoutReport() {
  const navigate = useNavigate()
  const reportContainerRef = useRef(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [postInfo, setPostInfo] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 获取用户最新的球探报告
      const { data, error } = await supabase
        .from('scout_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError(t('scoutReport.no_report'))
        } else {
          throw error
        }
      } else {
        setReport(data)
        // 检查是否已有帖子
        const existingPost = await getExistingPost(data.id)
        if (existingPost) {
          setPostInfo({
            postId: existingPost.id,
            screenshotUrl: existingPost.media_urls?.[0] || null
          })
        }
      }
    } catch (err) {
      console.error('获取报告失败:', err)
      setError(t('scoutReport.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!report || !reportContainerRef.current) {
      alert('无法生成截图，请稍后重试')
      return
    }
    
    setPublishing(true)
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }
      
      // 获取用户语言偏好
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single()
      
      const language = profile?.preferred_language || 'zh'
      
      // 调用长图生成和发帖函数
      const result = await generateAndPostReportScreenshot(
        reportContainerRef.current,
        user.id,
        report.id,
        language
      )
      
      setPostInfo(result)
      setShowSuccessMessage(true)
      
      // 5秒后自动隐藏成功消息
      setTimeout(() => setShowSuccessMessage(false), 5000)
      
      console.log('长图生成和发帖成功:', result)
    } catch (error) {
      console.error('长图生成和发帖失败:', error)
      alert(`发布失败: ${error.message}`)
    } finally {
      setPublishing(false)
    }
  }

  // 检查是否已有帖子
  useEffect(() => {
    const checkExistingPost = async () => {
      if (report?.id) {
        const existingPost = await getExistingPost(report.id)
        if (existingPost) {
          setPostInfo({
            postId: existingPost.id,
            screenshotUrl: existingPost.media_urls?.[0] || null
          })
        }
      }
    }
    
    if (report) {
      checkExistingPost()
    }
  }, [report])

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">{t('loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-lg text-center">
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green mb-4">
            {t('scoutReport.no_report_title', '暂无球探报告')}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/challenge')}
            className="bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {t('scoutReport.go_challenge')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/challenge')}
            className="text-gray-600 hover:text-wimbledon-green"
          >
            {t('scoutReport.back_challenge')}
          </button>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            {t('scoutReport.title', '你的专属球探报告')}
          </h1>
          <div className="w-16"></div>
        </div>

        {/* 成功消息 */}
        {showSuccessMessage && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-green-700">{t('scoutReport.publish_success')}</span>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 查看社区帖子链接 */}
        {postInfo && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">📢</span>
                <span className="text-blue-700">{t('scoutReport.published_to_community')}</span>
              </div>
              <button
                onClick={() => navigate('/community')}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
              >
                查看帖子
              </button>
            </div>
          </div>
        )}

        {/* 恭喜卡片 */}
        <div className="bg-gradient-to-r from-wimbledon-grass/20 to-wimbledon-green/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-wimbledon text-xl font-bold text-wimbledon-green mb-2">
                🎉 {t('scoutReport.congrats_title', '恭喜完成7天挑战！')}
              </h2>
              <p className="text-gray-700">
                {t('scoutReport.reward_note')}
              </p>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing || report?.is_published || postInfo}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-colors ${
                report?.is_published || postInfo
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-wimbledon-grass hover:bg-wimbledon-green'
              }`}
            >
              {publishing ? t('scoutReport.publishing') : (report?.is_published || postInfo ? t('scoutReport.published') : t('scoutReport.publish_direct'))}
            </button>
          </div>
        </div>

        {/* 报告内容卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-8" ref={reportContainerRef}>
          <div className="prose prose-lg max-w-none">
            {report.content_html.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('##')) {
                return (
                  <h2 key={index} className="text-xl font-bold text-wimbledon-green mt-6 mb-4">
                    {paragraph.replace('##', '')}
                  </h2>
                )
              } else if (paragraph.startsWith('-')) {
                return (
                  <li key={index} className="ml-4 text-gray-700 list-disc">
                    {paragraph.substring(1)}
                  </li>
                )
              } else if (paragraph.trim() === '') {
                return <div key={index} className="h-2"></div>
              } else {
                return (
                  <p key={index} className="text-gray-700 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                )
              }
            })}
          </div>
          
          <div className="border-t border-gray-100 mt-8 pt-6 flex items-center justify-between">
            <p className="text-xs text-gray-400">
                {t('scoutReport.generated_time')}{new Date(report.generated_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            {report?.is_published && (
              <span className="text-xs bg-wimbledon-grass/10 text-wimbledon-green px-3 py-1 rounded-full">
                已发布为帖子
              </span>
            )}
          </div>
        </div>

        {/* 编辑修改入口 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/onboarding?edit=true')}
            className="text-wimbledon-green hover:text-wimbledon-grass underline text-sm"
          >
            {t('scoutReport.edit_profile')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScoutReport