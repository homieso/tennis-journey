// src/pages/Challenge.jsx
// 7天挑战主页 - 修复版：移除周次，正确显示打卡状态
// 
// 主要功能：
// 1. 显示7天挑战日历，每个天数根据解锁状态显示不同颜色
// 2. 已解锁的天数（pending, approved, rejected）可以点击进入对应日期的打卡页面
// 3. 显示当前待打卡的天数入口
// 4. 显示挑战完成状态
// 
// 更新记录：
// 2026-02-14: 修复日历逻辑，让所有已解锁的天数都可以点击
// 2026-02-14: 点击后进入对应的 `/challenge/daily/{day}` 页面
// 2026-02-14: 支持查看和编辑历史打卡记录

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'
import { useTranslation } from '../lib/i18n'
import toast from 'react-hot-toast'

function Challenge() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(null)
  const [profileUsername, setProfileUsername] = useState('')
  const [challengeStatus, setChallengeStatus] = useState('') // in_progress | awaiting_report | success
  const [submitting, setSubmitting] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [missedDayInfo, setMissedDayInfo] = useState(null)

  // 将 startDate 转换为中国时区显示
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // 转换为中国时区 (UTC+8)
    const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().split('T')[0];
  };

  // 格式化日期时间显示
  const formatDateTime = (date) => {
    if (!date) return '';
    const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 16).replace('T', ' ');
  };

  // 计算当天截止时间
  const getDayDeadline = (dayIndex) => {
    if (!startDate) return null;
    const start = new Date(startDate + 'T12:00:00');
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + dayIndex - 1);
    dayDate.setHours(23, 59, 59, 999);
    return dayDate;
  };

  // 计算剩余时间（用于倒计时）
  const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, hours: 0, minutes: 0 };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { expired: false, hours, minutes };
  };

  useEffect(() => {
    fetchChallengeData()
  }, [])

  // 当用户从后台返回或切换回来时重新拉取，以便看到管理员审核后的最新状态（如第2天通过后第3天解锁）
  useEffect(() => {
    const onFocus = () => fetchChallengeData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const fetchChallengeData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 1. 获取用户档案，确定挑战开始日期与状态
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('challenge_start_date, challenge_status, username')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setChallengeStatus(profile?.challenge_status || 'in_progress')
      setProfileUsername(profile?.username || user.email?.split('@')[0] || '')
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

      // 4. 构建7天状态数组（基于开始日期，使用本地日期避免时区错位）
      const toLocalDateStr = (d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      const start = new Date(startDateStr + 'T12:00:00') // 中午解析避免 UTC 漂移
      const daysArray = []

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + i)
        const dateStr = toLocalDateStr(currentDate)
        
        // 查找当天的打卡记录
        const log = logs?.find(l => l.log_date === dateStr)
        
        // 判断状态
        let status = 'locked'
        let isToday = false

        // 如果有打卡记录，状态由记录决定
        if (log) {
          status = log.status // pending / approved / rejected
        } else {
          // 没有打卡记录
          if (i === 0) {
            // 第1天总是解锁
            status = 'pending'
          } else if (i > 0) {
            // 检查前一天是否有打卡记录（任何状态）
            const prevDate = new Date(start)
            prevDate.setDate(start.getDate() + (i - 1))
            const prevDateStr = toLocalDateStr(prevDate)
            const prevLog = logs?.find(l => l.log_date === prevDateStr)
            
            if (prevLog && prevLog.submitted_at) {
              // 计算是否已过24小时（从提交时间起）
              const submittedTime = new Date(prevLog.submitted_at).getTime()
              const now = Date.now()
              const hours24 = 24 * 60 * 60 * 1000
              if (now - submittedTime >= hours24) {
                status = 'pending'
              } else {
                status = 'locked'
              }
            } else {
              // 前一天没有打卡记录，保持锁定
              status = 'locked'
            }
          }
        }

        // 标记今天（用于高亮或特殊提示）
        const todayStr = toLocalDateStr(new Date())
        if (dateStr === todayStr) {
          isToday = true
        }

        daysArray.push({
          day: i + 1,
          status: status,
          date: t('challenge.day', { day: i + 1 }),
          logDate: dateStr,
          hasLog: !!log,
          isToday: isToday,
          log: log // 保留完整记录，备用
        })
      }

      setDays(daysArray)

      // 5. 检测是否有漏打卡的情况
      const missedDay = checkForMissedDays(logs, startDateStr)
      if (missedDay && challengeStatus === 'in_progress') {
        console.log('⚠️ 检测到漏打卡:', missedDay)
        setMissedDayInfo(missedDay)
        setShowResetModal(true)
      }
    } catch (error) {
      console.error(t('error.fetch_challenge_failed') + ':', error)
    } finally {
      setLoading(false)
    }
  }

  // 检测是否有超过24小时未打卡的天数
  const checkForMissedDays = (logs, startDate) => {
    if (!startDate) return null
    
    const today = new Date()
    const start = new Date(startDate + 'T12:00:00')
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(start)
      dayDate.setDate(start.getDate() + i)
      
      // 跳过未来日期
      if (dayDate > today) continue
      
      const dayLog = logs.find(l => {
        const logDate = new Date(l.log_date + 'T12:00:00')
        return logDate.toDateString() === dayDate.toDateString()
      })
      
      // 如果当天没有打卡，且已经超过24小时
      if (!dayLog) {
        const deadline = new Date(dayDate)
        deadline.setHours(23, 59, 59, 999)
        
        if (today > deadline) {
          return {
            day: i + 1,
            date: dayDate,
            deadline: deadline
          }
        }
      }
    }
    return null
  }

  // 重置挑战函数
  const resetChallenge = async (userId) => {
    try {
      console.log('🔄 重置挑战，用户ID:', userId)
      
      // 1. 删除该用户所有未审核的打卡记录（保留已通过的记录）
      const { error: deleteError } = await supabase
        .from('daily_logs')
        .delete()
        .eq('user_id', userId)
        .neq('status', 'approved')
      
      if (deleteError) {
        console.error('删除打卡记录失败:', deleteError)
        throw deleteError
      }
      
      // 2. 重置用户挑战状态
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          challenge_status: 'not_started',
          challenge_start_date: null,
          challenge_success_date: null
        })
        .eq('id', userId)
      
      if (updateError) {
        console.error('重置挑战状态失败:', updateError)
        throw updateError
      }
      
      console.log('✅ 挑战重置成功')
      return true
    } catch (error) {
      console.error('重置挑战失败:', error)
      toast.error(t('challenge.reset_failed'))
      return false
    }
  }

  // 当前日期是否已超出「开始日 + 7 天」范围（即第 8 天及以后）
  const isPastSevenDays = () => {
    if (!startDate) return false
    const start = new Date(startDate + 'T12:00:00')
    const day8 = new Date(start)
    day8.setDate(start.getDate() + 7)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    day8.setHours(0, 0, 0, 0)
    return today >= day8
  }

  // 处理重置挑战确认
  const handleConfirmReset = async () => {
    const { user } = await getCurrentUser()
    if (!user) return
    
    setSubmitting(true)
    try {
      const success = await resetChallenge(user.id)
      if (success) {
        toast.success(t('challenge.reset_success'))
        setShowResetModal(false)
        setMissedDayInfo(null)
        // 重新加载数据
        await fetchChallengeData()
      }
    } catch (error) {
      console.error('重置挑战失败:', error)
      toast.error(t('challenge.reset_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  // 取消重置
  const handleCancelReset = () => {
    setShowResetModal(false)
    setMissedDayInfo(null)
    toast.info(t('challenge.reset_cancelled'))
  }

  const handleFinalSubmit = async () => {
    const { user } = await getCurrentUser()
    if (!user) return
    setSubmitting(true)
    try {
      await supabase
        .from('profiles')
        .update({ challenge_status: 'awaiting_report' })
        .eq('id', user.id)
      setChallengeStatus('awaiting_report')
      const { error } = await supabase.functions.invoke('generate-scout-report', {
        body: { user_id: user.id }
      })
      if (error) throw error
    } catch (err) {
      console.error(t('error.final_submit_failed') + ':', err)
      alert(t('error.final_submit_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  // 是否已最终提交（不可再修改）
  const isLockedAfterSubmit = challengeStatus === 'awaiting_report' || challengeStatus === 'success'

  // 获取当前应该显示哪个天的打卡入口
  const getCurrentDayEntry = () => {
    const todayStr = (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()
    return days.find(day => day.status === 'pending' && !day.hasLog && day.logDate === todayStr)
      || days.find(day => day.status === 'pending' && !day.hasLog)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white pb-24 flex items-center justify-center">
        <div className="text-wimbledon-green">{t('challenge.loading_calendar')}</div>
      </div>
    )
  }

  const currentDayEntry = getCurrentDayEntry()

  return (
    <div className="min-h-screen bg-wimbledon-white pb-24 pb-24"> {/* 底部留白给导航 */}
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-wimbledon text-xl font-bold text-wimbledon-green">
              Tennis Journey
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 挑战标题与进度 */}
        <div className="text-center mb-6">
          <h2 className="font-wimbledon text-3xl font-bold text-wimbledon-green mb-2">
            {t('challenge.title')}
          </h2>
          <p className="text-gray-600">
            {startDate ? `${t('challenge.started_on')}: ${formatDate(startDate)} (UTC+8)` : t('challenge.description')}
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
                    {day.isToday && <span className="ml-1 text-wimbledon-grass text-xs">{t('challenge.today')}</span>}
                  </div>
                  <button
                    onClick={() => {
                      if (isLockedAfterSubmit) return
                      if (day.status !== 'locked') {
                        navigate(`/challenge/daily/${day.day}`)
                      }
                    }}
                    disabled={day.status === 'locked' || isLockedAfterSubmit}
                    className={`
                      w-full aspect-square rounded-xl flex flex-col items-center justify-center p-2 md:p-4
                      transition-all duration-200
                      ${day.status === 'approved' ? 'bg-wimbledon-grass/20 border-2 border-wimbledon-grass hover:bg-wimbledon-grass/30' : ''}
                      ${day.status === 'pending' && !day.hasLog ? 'bg-white border-2 border-wimbledon-grass shadow-sm hover:shadow-md hover:bg-wimbledon-grass/5' : ''}
                      ${day.status === 'pending' && day.hasLog ? 'bg-wimbledon-grass/10 border border-wimbledon-grass hover:bg-wimbledon-grass/20' : ''}
                      ${day.status === 'locked' || isLockedAfterSubmit ? 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed' : ''}
                      ${day.status === 'rejected' ? 'bg-red-50 border-2 border-red-300 hover:bg-red-100' : ''}
                      ${day.status !== 'locked' && !isLockedAfterSubmit ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
                    `}
                  >
                    <span className="text-lg md:text-2xl font-bold mb-1">
                      {day.day}
                    </span>
                    {day.status === 'approved' && (
                      <span className="text-[10px] md:text-xs text-wimbledon-green font-medium">{t('challenge.status.approved')}</span>
                    )}
                    {day.status === 'pending' && day.hasLog && (
                      <span className="text-[10px] md:text-xs text-wimbledon-green">{t('challenge.status.pending')}</span>
                    )}
                    {day.status === 'pending' && !day.hasLog && (
                      <span className="text-[10px] md:text-xs text-wimbledon-green">{t('challenge.status.waiting')}</span>
                    )}
                    {day.status === 'locked' && (
                      <span className="text-[10px] md:text-xs text-gray-400">{t('challenge.status.locked')}</span>
                    )}
                    {day.status === 'rejected' && (
                      <span className="text-[10px] md:text-xs text-red-500">{t('challenge.status.rejected')}</span>
                    )}
                  </button>
                  
                  {/* 截止时间显示 */}
                  {(day.status === 'pending' || day.status === 'locked') && !day.hasLog && (
                    <div className="mt-1">
                      <div className="text-[9px] md:text-xs text-gray-400">
                        {t('challenge.deadline')}: {formatDateTime(getDayDeadline(day.day))}
                      </div>
                      {day.status === 'pending' && (
                        <div className="text-[8px] md:text-[10px] text-wimbledon-grass font-medium mt-0.5">
                          {(() => {
                            const deadline = getDayDeadline(day.day)
                            const remaining = getTimeRemaining(deadline)
                            if (remaining && !remaining.expired) {
                              return `${remaining.hours}h ${remaining.minutes}m`
                            }
                            return ''
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 今日打卡入口 - 未超出7天且未最终提交时显示 */}
            {!isLockedAfterSubmit && !isPastSevenDays() && currentDayEntry && (
              <div className="border-t border-gray-100 mt-6 pt-6">
                <div className="bg-gradient-to-r from-wimbledon-grass/5 to-wimbledon-green/5 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {t('challenge.current_day', { day: currentDayEntry.day, type: currentDayEntry.isToday ? t('challenge.today_log') : t('challenge.makeup_log') })}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {currentDayEntry.isToday
                          ? t('challenge.today_log_description')
                          : t('challenge.makeup_log_description', { day: currentDayEntry.day })}
                      </p>
                    </div>
                    <Link
                      to={`/challenge/daily/${currentDayEntry.day}`}
                      className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {t('challenge.go_log')}
                    </Link>
                  </div>

                  {/* 示例模板提示 - 增加悬停批注效果 */}
                  <div className="mt-4 bg-white rounded-lg p-4 text-sm text-gray-500 border border-gray-200 flex items-start group relative">
                    <span className="text-wimbledon-grass mr-2">📝</span>
                    <span className="flex-1">
                      <span className="font-medium text-gray-700">{t('challenge.example')}</span>
                      {t('challenge.example_content')}
                    </span>
                    <span className="text-gray-300 group-hover:text-wimbledon-grass cursor-help ml-2 transition-colors" title={t('challenge.example')}>ⓘ</span>
                  </div>
                </div>
              </div>
            )}

            {/* 超出7天：恭喜完成 + 最终提交（未提交时） */}
            {isPastSevenDays() && challengeStatus === 'in_progress' && (
              <div className="mt-6 p-6 bg-wimbledon-green/10 rounded-xl text-center">
                <h3 className="font-bold text-wimbledon-green text-lg mb-2">
                  {t('challenge.congratulations_with_name', { name: profileUsername })}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('challenge.final_submit_note')}
                </p>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                >
                  {submitting ? t('challenge.submitting') : t('challenge.final_submit')}
                </button>
              </div>
            )}

            {/* 已最终提交，报告生成中 */}
            {challengeStatus === 'awaiting_report' && (
              <div className="mt-6 p-6 bg-wimbledon-green/10 rounded-xl text-center">
                <h3 className="font-bold text-wimbledon-green text-lg mb-2">
                  {t('challenge.awaiting_report.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('challenge.awaiting_report.description')}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/report')}
                  className="bg-wimbledon-green hover:bg-wimbledon-grass text-white px-6 py-3 rounded-xl transition-colors"
                >
                  {t('challenge.go_view_report')}
                </button>
              </div>
            )}

            {/* 报告已生成 */}
            {challengeStatus === 'success' && (
              <div className="mt-6 p-6 bg-wimbledon-green/10 rounded-xl text-center">
                <h3 className="font-bold text-wimbledon-green text-lg mb-2">
                  {t('challenge.complete.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('challenge.report_generated_description')}
                </p>
                <Link
                  to="/report"
                  className="inline-block bg-wimbledon-green hover:bg-wimbledon-grass text-white px-6 py-3 rounded-xl transition-colors"
                >
                  {t('challenge.complete.view_report')}
                </Link>
              </div>
            )}

            {/* 7天全部审核通过且未超出7天时（旧逻辑保留，与 success 二选一） */}
            {!isPastSevenDays() && challengeStatus === 'in_progress' && days.every(day => day.status === 'approved') && (
              <div className="mt-6 p-6 bg-wimbledon-green/10 rounded-xl text-center">
                <h3 className="font-bold text-wimbledon-green text-lg mb-2">
                  {t('challenge.complete.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('challenge.complete.description')}
                </p>
                <Link
                  to="/report"
                  className="inline-block bg-wimbledon-green hover:bg-wimbledon-grass text-white px-6 py-3 rounded-xl transition-colors"
                >
                  {t('challenge.complete.view_report')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 重置挑战弹窗 */}
        {showResetModal && missedDayInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {t('challenge.reset_title')}
                </h3>
                <p className="text-gray-600">
                  检测到第{missedDayInfo.day}天（{missedDayInfo.date.toLocaleDateString('zh-CN')}）未在截止时间前打卡
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  挑战已中断，需要重新开始。未审核的记录将被清除。
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCancelReset}
                  disabled={submitting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReset}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? '重置中...' : '重新开始挑战'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Challenge