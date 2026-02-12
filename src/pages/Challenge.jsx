// src/pages/Challenge.jsx
// 7天挑战主页 - 从数据库读取真实打卡状态

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'  // ✅ 1. 在这里导入 useLocation
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

function Challenge() {
  const [currentWeek, setCurrentWeek] = useState(1)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  
  const location = useLocation()  // ✅ 2. 在这里调用 useLocation

  // 获取用户的打卡记录
  useEffect(() => {
    fetchDailyLogs()
  }, [location.search])  // ✅ 3. 依赖 location.search，当 refresh 参数变化时重新获取

  const fetchDailyLogs = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      // 获取今天的日期（YYYY-MM-DD）
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      console.log('今天日期:', todayStr)

      // 获取用户所有的打卡记录（按日期倒序）
      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })

      if (error) throw error

      // 构建7天的状态数组
      const daysArray = []
      
      for (let i = 1; i <= 7; i++) {
        // 计算第i天的日期（第1天 = 今天，第2天 = 昨天，...）
        const date = new Date(today)
        date.setDate(today.getDate() - (i - 1))
        const dateStr = date.toISOString().split('T')[0]
        
        // 查找这一天是否有打卡记录
        const log = logs?.find(l => l.log_date === dateStr)
        
        // 确定状态
        let status = 'locked'
        
        if (i === 1) {
          // 第1天：今天，总是待打卡（除非已经完成）
          status = 'pending'
        }
        
        if (log) {
          // 有打卡记录，使用记录的状态
          status = log.status
        } else if (i > 1) {
          // 第2-7天：检查前一天是否完成
          const prevDate = new Date(today)
          prevDate.setDate(today.getDate() - (i - 2))
          const prevDateStr = prevDate.toISOString().split('T')[0]
          const prevLog = logs?.find(l => l.log_date === prevDateStr)
          
          // 只有前一天是approved，今天才解锁为pending
          if (prevLog?.status === 'approved') {
            status = 'pending'
          } else {
            status = 'locked'
          }
        }

        daysArray.push({
          day: i,
          status: status,
          date: `第${i}天`,
          logDate: dateStr,
          hasLog: !!log
        })
      }

      console.log('生成的状态数组:', daysArray)
      setDays(daysArray)
    } catch (error) {
      console.error('获取打卡记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wimbledon-white">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-wimbledon text-xl font-bold text-wimbledon-green">
              Tennis Journey
            </h1>
            <Link to="/" className="text-gray-600 hover:text-wimbledon-green">
              返回首页
            </Link>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        {/* 挑战标题 */}
        <div className="text-center mb-8">
          <h2 className="font-wimbledon text-3xl font-bold text-wimbledon-green mb-2">
            7天挑战
          </h2>
          <p className="text-gray-600">
            连续7天打卡，生成你的专属球探报告
          </p>
        </div>

        {/* 日历卡片 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-8">
            {/* 周数选择 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                第 {currentWeek} 周
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCurrentWeek(1)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    currentWeek === 1 
                      ? 'bg-wimbledon-grass text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  第1周
                </button>
                <button 
                  onClick={() => setCurrentWeek(2)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    currentWeek === 2 
                      ? 'bg-wimbledon-grass text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  第2周
                </button>
              </div>
            </div>

            {/* 7天日历网格 */}
            <div className="grid grid-cols-7 gap-4 mb-8">
              {days.map((day) => (
                <div key={day.day} className="text-center">
                  <div className="text-sm text-gray-500 mb-2">
                    {day.date}
                  </div>
                  <div 
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center p-4
                      ${day.status === 'approved' ? 'bg-wimbledon-grass/20 border-2 border-wimbledon-grass' : ''}
                      ${day.status === 'pending' ? 'bg-white border-2 border-wimbledon-grass' : ''}
                      ${day.status === 'locked' ? 'bg-gray-100 border border-gray-200 opacity-50' : ''}
                      ${day.status === 'rejected' ? 'bg-red-50 border-2 border-red-300' : ''}
                    `}
                  >
                    <span className="text-2xl font-bold mb-1">
                      {day.day}
                    </span>
                    {day.status === 'approved' && (
                      <span className="text-xs text-wimbledon-green">已完成</span>
                    )}
                    {day.status === 'pending' && (
                      <span className="text-xs text-wimbledon-green">待打卡</span>
                    )}
                    {day.status === 'locked' && (
                      <span className="text-xs text-gray-400">未解锁</span>
                    )}
                    {day.status === 'rejected' && (
                      <span className="text-xs text-red-500">已拒绝</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 今日打卡入口 - 仅当第1天是pending状态时显示 */}
            {days[0]?.status === 'pending' && (
              <div className="border-t border-gray-100 pt-6">
                <div className="bg-wimbledon-grass/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        第1天 · 今日打卡
                      </h4>
                      <p className="text-sm text-gray-600">
                        上传你的训练照片，记录今日心得
                      </p>
                    </div>
                    <Link
                      to="/challenge/daily/1"
                      className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-3 rounded-xl transition-colors"
                    >
                      去打卡
                    </Link>
                  </div>

                  {/* 示例模板提示 */}
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-500 border border-gray-200">
                    <span className="font-medium text-gray-700">📝 示例模板：</span>
                    分腿垫步练习3组，正手击球50次，发球练习20分钟
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Challenge