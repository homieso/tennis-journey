// src/pages/Challenge.jsx
// 7天挑战主页 - 修复版：移除周次，正确显示打卡状态

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

function Challenge() {
  const navigate = useNavigate()
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(null)

  useEffect(() => {
    fetchChallengeData()
  }, [])

  const fetchChallengeData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 1. 获取用户档案，确定挑战开始日期
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('challenge_start_date, challenge_status')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      let startDateStr = profile?.challenge_start_date
      
      // 2. 如果用户从未开始挑战，初始化第一天
      if (!startDateStr) {
        const today = new Date().toISOString().split('T')[0]
        await supabase
          .from('profiles')
          .update({ 
            challenge_start_date: today,
            challenge_status: 'in_progress'
          })
          .eq('id', user.id)
        startDateStr = today
      }

      setStartDate(startDateStr)

      // 3. 获取该用户所有打卡记录
      const { data: logs, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })

      if (logsError) throw logsError

      // 4. 构建7天状态数组（基于开始日期，而非今天）
      const start = new Date(startDateStr)
      const daysArray = []

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + i)
        const dateStr = currentDate.toISOString().split('T')[0]
        
        // 查找当天的打卡记录
        const log = logs?.find(l => l.log_date === dateStr)
        
        // 判断状态
        let status = 'locked'
        let isToday = false

        // 第1天总是解锁
        if (i === 0) {
          status = 'pending'
        }

        // 如果有打卡记录，状态由记录决定
        if (log) {
          status = log.status // pending / approved / rejected
        } else if (i > 0) {
          // 检查前一天是否完成
          const prevDate = new Date(start)
          prevDate.setDate(start.getDate() + (i - 1))
          const prevDateStr = prevDate.toISOString().split('T')[0]
          const prevLog = logs?.find(l => l.log_date === prevDateStr)
          
          // 只有前一天是 approved，今天才解锁
          if (prevLog?.status === 'approved') {
            status = 'pending'
          }
        }

        // 标记今天（用于高亮或特殊提示）
        const todayStr = new Date().toISOString().split('T')[0]
        if (dateStr === todayStr) {
          isToday = true
        }

        daysArray.push({
          day: i + 1,
          status: status,
          date: `第${i + 1}天`,
          logDate: dateStr,
          hasLog: !!log,
          isToday: isToday,
          log: log // 保留完整记录，备用
        })
      }

      setDays(daysArray)
    } catch (error) {
      console.error('获取挑战数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取当前应该显示哪个天的打卡入口
  const getCurrentDayEntry = () => {
    // 找到第一个状态为 pending 且没有打卡记录的日子
    return days.find(day => 
      day.status === 'pending' && 
      !day.hasLog && 
      day.logDate === new Date().toISOString().split('T')[0] // 必须是今天
    ) || days.find(day => day.status === 'pending' && !day.hasLog) // 或者任何待打卡的日子
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">加载你的挑战日历...</div>
      </div>
    )
  }

  const currentDayEntry = getCurrentDayEntry()

  return (
    <div className="min-h-screen bg-wimbledon-white pb-24"> {/* 底部留白给导航 */}
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-wimbledon text-xl font-bold text-wimbledon-green">
              Tennis Journey
            </h1>
            <Link to="/profile" className="text-gray-600 hover:text-wimbledon-green">
              我的主页
            </Link>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 挑战标题与进度 */}
        <div className="text-center mb-6">
          <h2 className="font-wimbledon text-3xl font-bold text-wimbledon-green mb-2">
            7天挑战
          </h2>
          <p className="text-gray-600">
            {startDate ? `开始于：${startDate}` : '连续7天打卡，生成你的专属球探报告'}
          </p>
        </div>

        {/* 7天日历网格 - 修复版 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {days.map((day) => (
                <div key={day.day} className="text-center">
                  <div className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">
                    {day.date}
                    {day.isToday && <span className="ml-1 text-wimbledon-grass text-xs">今天</span>}
                  </div>
                  <div 
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center p-2 md:p-4
                      transition-all duration-200
                      ${day.status === 'approved' ? 'bg-wimbledon-grass/20 border-2 border-wimbledon-grass' : ''}
                      ${day.status === 'pending' && !day.hasLog ? 'bg-white border-2 border-wimbledon-grass shadow-sm' : ''}
                      ${day.status === 'pending' && day.hasLog ? 'bg-wimbledon-grass/10 border border-wimbledon-grass' : ''}
                      ${day.status === 'locked' ? 'bg-gray-100 border border-gray-200 opacity-50' : ''}
                      ${day.status === 'rejected' ? 'bg-red-50 border-2 border-red-300' : ''}
                    `}
                  >
                    <span className="text-lg md:text-2xl font-bold mb-1">
                      {day.day}
                    </span>
                    {day.status === 'approved' && (
                      <span className="text-[10px] md:text-xs text-wimbledon-green font-medium">已完成</span>
                    )}
                    {day.status === 'pending' && day.hasLog && (
                      <span className="text-[10px] md:text-xs text-wimbledon-green">待审核</span>
                    )}
                    {day.status === 'pending' && !day.hasLog && (
                      <span className="text-[10px] md:text-xs text-wimbledon-green">待打卡</span>
                    )}
                    {day.status === 'locked' && (
                      <span className="text-[10px] md:text-xs text-gray-400">未解锁</span>
                    )}
                    {day.status === 'rejected' && (
                      <span className="text-[10px] md:text-xs text-red-500">已拒绝</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 今日打卡入口 - 动态显示正确的待打卡天数 */}
            {currentDayEntry && (
              <div className="border-t border-gray-100 mt-6 pt-6">
                <div className="bg-gradient-to-r from-wimbledon-grass/5 to-wimbledon-green/5 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        第{currentDayEntry.day}天 · {currentDayEntry.isToday ? '今日打卡' : '补打卡'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {currentDayEntry.isToday 
                          ? '上传你的训练照片，记录今日心得' 
                          : '补打第' + currentDayEntry.day + '天的卡'}
                      </p>
                    </div>
                    <Link
                      to={`/challenge/daily/${currentDayEntry.day}`}
                      className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
                    >
                      去打卡
                    </Link>
                  </div>

                  {/* 示例模板提示 - 增加悬停批注效果 */}
                  <div className="mt-4 bg-white rounded-lg p-4 text-sm text-gray-500 border border-gray-200 flex items-start group relative">
                    <span className="text-wimbledon-grass mr-2">📝</span>
                    <span className="flex-1">
                      <span className="font-medium text-gray-700">示例模板：</span>
                      分腿垫步练习3组，正手击球50次，发球练习20分钟
                    </span>
                    <span className="text-gray-300 group-hover:text-wimbledon-grass cursor-help ml-2 transition-colors" title="点击可填充模板">ⓘ</span>
                  </div>
                </div>
              </div>
            )}

            {/* 挑战完成状态 */}
            {days.every(day => day.status === 'approved') && (
              <div className="mt-6 p-6 bg-wimbledon-green/10 rounded-xl text-center">
                <h3 className="font-bold text-wimbledon-green text-lg mb-2">
                  🎉 恭喜！你已完成7天挑战！
                </h3>
                <p className="text-gray-600 mb-4">
                  你的球探报告正在生成中，预计1-2分钟。
                </p>
                <Link
                  to="/report"
                  className="inline-block bg-wimbledon-green hover:bg-wimbledon-grass text-white px-6 py-3 rounded-xl transition-colors"
                >
                  查看我的球探报告
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Challenge