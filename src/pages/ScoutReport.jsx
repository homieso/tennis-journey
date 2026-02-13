// src/pages/ScoutReport.jsx
// 球探报告完整版 - 显示AI生成的报告并支持发布

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

function ScoutReport() {
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)

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
          setError('暂无球探报告，请先完成7天挑战')
        } else {
          throw error
        }
      } else {
        setReport(data)
      }
    } catch (err) {
      console.error('获取报告失败:', err)
      setError('加载报告失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const { user } = await getCurrentUser()
      
      // 1. 创建帖子
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            report_id: report.id,
            content: '我的7天网球球探报告 🎾',
            created_at: new Date()
          }
        ])
        .select()
        .single()

      if (postError) throw postError

      // 2. 更新报告状态
      await supabase
        .from('scout_reports')
        .update({ 
          is_published: true,
          published_at: new Date(),
          post_id: post.id
        })
        .eq('id', report.id)

      // 3. 添加30天会员资格
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

      await supabase
        .from('profiles')
        .update({
          membership_valid_until: thirtyDaysLater
        })
        .eq('id', user.id)

      // 4. 跳转到个人主页
      navigate('/profile')
    } catch (err) {
      console.error('发布失败:', err)
      alert('发布失败，请重试')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">加载报告中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-lg text-center">
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green mb-4">
            暂无球探报告
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/challenge')}
            className="bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            去完成挑战
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
            ← 返回挑战
          </button>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            你的专属球探报告
          </h1>
          <div className="w-16"></div>
        </div>

        {/* 恭喜卡片 */}
        <div className="bg-gradient-to-r from-wimbledon-grass/20 to-wimbledon-green/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-wimbledon text-xl font-bold text-wimbledon-green mb-2">
                🎉 恭喜完成7天挑战！
              </h2>
              <p className="text-gray-700">
                你的专属球探报告已生成，发布后可获得30天免费会员资格。
              </p>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing || report?.is_published}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-colors ${
                report?.is_published
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-wimbledon-grass hover:bg-wimbledon-green'
              }`}
            >
              {publishing ? '发布中...' : report?.is_published ? '已发布' : '直接发布报告'}
            </button>
          </div>
        </div>

        {/* 报告内容卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-8">
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
              生成时间：{new Date(report.generated_at).toLocaleDateString('zh-CN', {
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
            ✎ 编辑档案信息，重新生成报告
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScoutReport