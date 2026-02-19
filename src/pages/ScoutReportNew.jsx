// src/pages/ScoutReportNew.jsx
// 全新分页滑动式球探报告 - 参考网易云音乐年度报告风格

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { generateAndPostReportScreenshot, getExistingPost } from '../lib/reportScreenshot'

// 导入Swiper样式
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

function ScoutReportNew() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [report, setReport] = useState(null)
  const [reportUserName, setReportUserName] = useState('')
  const [structuredData, setStructuredData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [postInfo, setPostInfo] = useState(null)
  const [generatingScreenshot, setGeneratingScreenshot] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const reportContainerRef = useRef(null)

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

      // 获取用户最新的球探报告（包含结构化数据）
      const { data, error } = await supabase
        .from('scout_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError(t('scoutReport.noReport'))
        } else {
          throw error
        }
      } else {
        setReport(data)
        // 尝试解析结构化数据
        if (data.structured_data) {
          setStructuredData(data.structured_data)
        } else {
          setStructuredData(createMockStructuredData(user))
        }
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        setReportUserName(profileData?.username || user.email?.split('@')[0] || '网球爱好者')
      }
    } catch (err) {
      console.error('获取报告失败:', err)
      setError('加载报告失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const createMockStructuredData = (user) => {
    return {
      cover: {
        title: "你的7天网球之旅报告",
        subtitle: "专属AI球探报告",
        date: new Date().toLocaleDateString(),
        user_name: user.email.split('@')[0]
      },
      profile: {
        gender: "男",
        playing_years: "5年",
        ntrp: "3.5",
        idol: "费德勒",
        style: "全场型",
        summary: "技术全面，攻防兼备，具备扎实的网球基础"
      },
      stats: {
        total_days: 7,
        total_photos: 14,
        latest_log_time: "晚上9:30",
        most_frequent_exercise: "正手击球",
        keywords: ["正手稳定", "发球进步", "步伐灵活", "战术意识"]
      },
      analysis: {
        strengths: ["技术全面性", "训练系统性", "进步明显"],
        improvements: ["反手稳定性", "比赛经验"],
        technical_insights: "从基础练习逐步过渡到模拟比赛，战术意识明显增强"
      },
      recommendations: [
        {
          title: "正手深度控制训练",
          description: "在底线后1米处练习正手深球，目标落点在底线内1米区域",
          frequency: "每周3次，每次30分钟",
          icon: "🎯"
        },
        {
          title: "发球落点精准度训练",
          description: "在发球区设置4个目标区域，练习精准发球",
          frequency: "每周2次，每次40分钟",
          icon: "🎾"
        },
        {
          title: "网前截击反应训练",
          description: "搭档在底线随机击球，练习快速上网截击",
          frequency: "每周2次，每次20分钟",
          icon: "⚡"
        }
      ],
      player_comparison: {
        player_name: "罗杰·费德勒",
        similarities: ["技术全面性", "优雅风格", "战术意识"],
        differences: ["发球威力", "反手稳定性", "比赛经验"],
        radar_chart: {
          serve: 65,
          baseline: 75,
          net_play: 70,
          movement: 80,
          tactics: 72
        }
      },
      achievements: {
        badge: "全场型选手",
        badge_description: "技术全面，正反手均衡，具备全场控制能力",
        next_goal: "达到NTRP 4.0水平"
      }
    }
  }

  const prepareRadarData = () => {
    if (!structuredData?.player_comparison?.radar_chart) return []
    
    const radar = structuredData.player_comparison.radar_chart
    return [
      { subject: '发球', value: radar.serve, fullMark: 100 },
      { subject: '底线', value: radar.baseline, fullMark: 100 },
      { subject: '网前', value: radar.net_play, fullMark: 100 },
      { subject: '移动', value: radar.movement, fullMark: 100 },
      { subject: '战术', value: radar.tactics, fullMark: 100 }
    ]
  }

  const handleGenerateAndPostScreenshot = async () => {
    if (!report || !reportContainerRef.current) {
      alert('无法生成截图，请稍后重试')
      return
    }
    
    setGeneratingScreenshot(true)
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
      alert(`生成失败: ${error.message}`)
    } finally {
      setGeneratingScreenshot(false)
    }
  }

  const handleShare = () => {
    // 检查是否已有帖子
    if (postInfo) {
      alert('报告已自动发布到社区！你可以在社区中查看你的帖子。')
      return
    }
    
    // 如果没有帖子，提示用户生成长图并发布
    if (window.confirm('报告将自动发布到社区，并生成长图分享。是否继续？')) {
      handleGenerateAndPostScreenshot()
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
    
    checkExistingPost()
  }, [report])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wimbledon-green/5 to-wimbledon-grass/5 flex items-center justify-center">
        <div className="text-wimbledon-green text-lg">{t('scoutReport.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wimbledon-green/5 to-wimbledon-grass/5 flex items-center justify-center py-12 px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-lg text-center">
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green mb-4">
            暂无球探报告
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/challenge')}
            className="bg-gradient-to-r from-wimbledon-green to-wimbledon-grass text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            去完成挑战
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wimbledon-green/5 to-wimbledon-grass/5 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/challenge')}
              className="text-gray-600 hover:text-wimbledon-green"
            >
              ← {t('scoutReport.return')}
            </button>
            <div className="text-center">
              <h1 className="font-wimbledon text-lg font-bold text-gray-800">
                {t('scoutReport.title')}
              </h1>
              <p className="text-xs text-gray-500">{t('scoutReport.swipe_hint')}</p>
            </div>
            <button
              onClick={handleShare}
              className={`${postInfo ? 'text-green-600' : 'text-wimbledon-green'} hover:text-wimbledon-grass font-medium`}
              disabled={generatingScreenshot}
            >
              {generatingScreenshot ? t('scoutReport.publishing') : (postInfo ? t('scoutReport.published') : t('scoutReport.publishButton'))}
            </button>
          </div>
        </div>
      </div>

      {/* 成功消息 */}
      {showSuccessMessage && (
        <div className="container mx-auto px-4 mt-4">
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
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-500 mr-2">📢</span>
              <span className="text-blue-700">{t('scoutReport.published_to_community')}</span>
            </div>
            <button
              onClick={() => navigate('/community')}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
            >
              {t('scoutReport.view_post')}
            </button>
          </div>
        </div>
      )}

      {/* 分页指示器 */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center space-x-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeSlide === index
                  ? 'w-8 bg-wimbledon-green'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 分页滑动报告 */}
      <div className="container mx-auto px-4 py-6" ref={reportContainerRef}>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
          className="h-[70vh]"
        >
          {/* 第1页：封面 */}
          <SwiperSlide>
            <div className="h-full bg-gradient-to-br from-wimbledon-green to-wimbledon-grass rounded-3xl shadow-xl p-8 flex flex-col justify-center items-center text-white">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎾</div>
                <h1 className="text-3xl font-bold mb-2">
                  {structuredData?.cover?.title || "你的7天网球之旅报告"}
                </h1>
                <p className="text-lg opacity-90">
                  {structuredData?.cover?.subtitle || "专属AI球探报告"}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  {structuredData?.cover?.user_name || reportUserName}
                </div>
                <p className="opacity-80">
                  {structuredData?.cover?.date || (report?.generated_at ? new Date(report.generated_at).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'))}
                </p>
              </div>
              
              <div className="mt-12 text-sm opacity-70">
                <p>向右滑动开始探索 →</p>
              </div>
            </div>
          </SwiperSlide>

          {/* 第2页：用户档案 */}
          <SwiperSlide>
            <div className="h-full bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">用户档案</h2>
                <p className="text-gray-600">你的网球身份信息</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">性别</p>
                  <p className="text-lg font-bold text-gray-900">{structuredData?.profile?.gender || "男"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">球龄</p>
                  <p className="text-lg font-bold text-gray-900">{structuredData?.profile?.playing_years || "5年"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">NTRP自评</p>
                  <p className="text-lg font-bold text-gray-900">{structuredData?.profile?.ntrp || "3.5"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">偶像</p>
                  <p className="text-lg font-bold text-gray-900">{structuredData?.profile?.idol || "费德勒"}</p>
                </div>
              </div>
              
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  {structuredData?.profile?.summary || "技术全面，攻防兼备，具备扎实的网球基础"}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* 第3页：打卡数据 */}
          <SwiperSlide>
            <div className="h-full bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">打卡数据</h2>
                <p className="text-gray-600">7天训练成果统计</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {structuredData?.stats?.total_days || 7}
                  </div>
                  <p className="text-xs text-gray-600">打卡天数</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {structuredData?.stats?.total_photos || 14}
                  </div>
                  <p className="text-xs text-gray-600">训练照片</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">最常练习项目</p>
                <div className="bg-gray-100 rounded-full px-4 py-2">
                  <span className="font-medium text-gray-900">
                    {structuredData?.stats?.most_frequent_exercise || "正手击球"}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">技术关键词</p>
                <div className="flex flex-wrap gap-2">
                  {structuredData?.stats?.keywords?.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-wimbledon-green/10 to-wimbledon-grass/10 text-wimbledon-green px-3 py-1 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  )) || ["正手稳定", "发球进步", "步伐灵活"].map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-wimbledon-green/10 to-wimbledon-grass/10 text-wimbledon-green px-3 py-1 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* 第4页：技术分析 */}
          <SwiperSlide>
            <div className="h-full bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">技术分析</h2>
                <p className="text-gray-600">AI深度分析你的网球技术</p>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">技术优势</p>
                <div className="space-y-2">
                  {structuredData?.analysis?.strengths?.map((strength, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-900">{strength}</span>
                    </div>
                  )) || ["技术全面性", "训练系统性", "进步明显"].map((strength, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-900">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">待改进方面</p>
                <div className="space-y-2">
                  {structuredData?.analysis?.improvements?.map((improvement, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-orange-500 mr-2">↗</span>
                      <span className="text-gray-900">{improvement}</span>
                    </div>
                  )) || ["反手稳定性", "比赛经验"].map((improvement, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-orange-500 mr-2">↗</span>
                      <span className="text-gray-900">{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  {structuredData?.analysis?.technical_insights || "从基础练习逐步过渡到模拟比赛，战术意识明显增强"}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* 第5页：训练建议 */}
          <SwiperSlide>
            <div className="h-full bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">💡</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">训练建议</h2>
                <p className="text-gray-600">个性化训练方案</p>
              </div>
              
              <div className="space-y-4">
                {structuredData?.recommendations?.map((rec, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{rec.icon || "🎯"}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                        <p className="text-xs text-gray-500">频率：{rec.frequency}</p>
                      </div>
                    </div>
                  </div>
                )) || [
                  {
                    title: "正手深度控制训练",
                    description: "在底线后1米处练习正手深球，目标落点在底线内1米区域",
                    frequency: "每周3次，每次30分钟",
                    icon: "🎯"
                  },
                  {
                    title: "发球落点精准度训练",
                    description: "在发球区设置4个目标区域，练习精准发球",
                    frequency: "每周2次，每次40分钟",
                    icon: "🎾"
                  },
                  {
                    title: "网前截击反应训练",
                    description: "搭档在底线随机击球，练习快速上网截击",
                    frequency: "每周2次，每次20分钟",
                    icon: "⚡"
                  }
                ].map((rec, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{rec.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                        <p className="text-xs text-gray-500">频率：{rec.frequency}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SwiperSlide>

          {/* 第6页：球星对比 */}
          <SwiperSlide>
            <div className="h-full bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">球星对比</h2>
                <p className="text-gray-600">与职业球员的技术对比</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-wimbledon-green mb-2">
                  {structuredData?.player_comparison?.player_name || "罗杰·费德勒"}
                </div>
                <p className="text-gray-600">对比球员</p>
              </div>
              
              {/* 雷达图 */}
              <div className="h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={prepareRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="技术水平"
                      dataKey="value"
                      stroke="#1A5D1A"
                      fill="#1A5D1A"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">相似之处</p>
                  <div className="space-y-1">
                    {structuredData?.player_comparison?.similarities?.slice(0, 2).map((similarity, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-green-500 mr-1">✓</span>
                        <span className="text-sm text-gray-900">{similarity}</span>
                      </div>
                    )) || ["技术全面性", "优雅风格"].map((similarity, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-green-500 mr-1">✓</span>
                        <span className="text-sm text-gray-900">{similarity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">差距分析</p>
                  <div className="space-y-1">
                    {structuredData?.player_comparison?.differences?.slice(0, 2).map((difference, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-orange-500 mr-1">↗</span>
                        <span className="text-sm text-gray-900">{difference}</span>
                      </div>
                    )) || ["发球威力", "比赛经验"].map((difference, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-orange-500 mr-1">↗</span>
                        <span className="text-sm text-gray-900">{difference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* 第7页：成就勋章 */}
          <SwiperSlide>
            <div className="h-full bg-gradient-to-br from-yellow-50 to-orange-100 rounded-3xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🏅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">成就勋章</h2>
                <p className="text-gray-600">你的网球成就</p>
              </div>
              
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-2xl font-bold px-6 py-3 rounded-full mb-4">
                  {structuredData?.achievements?.badge || "全场型选手"}
                </div>
                <p className="text-gray-700">
                  {structuredData?.achievements?.badge_description || "技术全面，正反手均衡，具备全场控制能力"}
                </p>
              </div>
              
              <div className="bg-white/80 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">下一个目标</p>
                <p className="font-bold text-gray-900">
                  {structuredData?.achievements?.next_goal || "达到NTRP 4.0水平"}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* 第8页：分享与总结 */}
          <SwiperSlide>
            <div className="h-full bg-gradient-to-br from-purple-50 to-pink-100 rounded-3xl shadow-xl p-8 flex flex-col justify-center items-center">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">报告完成</h2>
                <p className="text-gray-600">你的7天网球之旅总结</p>
              </div>
              
              <div className="text-center mb-8">
                <p className="text-gray-700 mb-4">
                  恭喜你完成了7天网球挑战！这份报告记录了你的成长轨迹。
                </p>
                <p className="text-sm text-gray-500">
                  继续坚持训练，期待你的下一次进步！
                </p>
              </div>
              
              <div className="space-y-4 w-full max-w-xs">
                <button
                  onClick={handleShare}
                  className="w-full bg-gradient-to-r from-wimbledon-green to-wimbledon-grass text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  分享我的报告
                </button>
                <button
                  onClick={() => navigate('/challenge')}
                  className="w-full bg-white border border-wimbledon-green text-wimbledon-green font-semibold py-3 rounded-xl hover:bg-wimbledon-green/5 transition-all"
                >
                  开始新的挑战
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                  返回个人主页
                </button>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  )
}

export default ScoutReportNew
