// src/pages/Profile.jsx
// 个人主页 - 显示档案、报告和会员状态

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser, signOut } from '../lib/auth'
import { redirectToCustomerPortal } from '../lib/stripe'

function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 获取用户档案
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // 获取用户的球探报告
      const { data: reportsData, error: reportsError } = await supabase
        .from('scout_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })

      if (reportsError) throw reportsError
      setReports(reportsData || [])
    } catch (error) {
      console.error('获取个人资料失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-16"></div>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            个人主页
          </h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-500 text-sm"
          >
            退出登录
          </button>
        </div>

       {/* 会员状态卡片 */}
<div className="bg-white rounded-2xl shadow-md p-6 mb-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        会员状态
      </h2>
      {profile?.membership_valid_until ? (
        <div>
          <p className="text-sm text-gray-600">
            🎾 会员有效期至：{new Date(profile.membership_valid_until).toLocaleDateString('zh-CN')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            到期后可续费，继续享受AI球探报告服务
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          {profile?.challenge_status === 'success' 
            ? '恭喜完成挑战！报告生成后可获得30天免费会员'
            : '暂无会员资格，完成7天挑战即可获得30天免费会员'}
        </p>
      )}
    </div>
    
    {/* 会员操作按钮组 */}
    <div className="flex space-x-2">
      {profile?.membership_valid_until ? (
        <>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            续费会员
          </button>
          <button
            onClick={redirectToCustomerPortal}
            className="bg-white border border-wimbledon-grass text-wimbledon-grass hover:bg-wimbledon-grass/5 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            管理订阅
          </button>
          <button
            onClick={() => navigate('/redeem')}
            className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            兑换激活码
          </button>
        </>
      ) : (
        <button
          onClick={() => navigate('/challenge')}
          className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {profile?.challenge_status === 'in_progress' ? '查看挑战' : '开始挑战'}
        </button>
      )}
    </div>
  </div>
</div>
        {/* 网球档案卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              我的网球档案
            </h2>
            <button
              onClick={() => navigate('/onboarding?edit=true')}
              className="text-wimbledon-green hover:text-wimbledon-grass text-sm"
            >
              编辑档案
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">性别</p>
              <p className="text-sm font-medium">{profile?.gender || '未设置'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">年龄</p>
              <p className="text-sm font-medium">{profile?.age ? `${profile.age}岁` : '未设置'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">球龄</p>
              <p className="text-sm font-medium">{profile?.playing_years || 0}年</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">NTRP自评</p>
              <p className="text-sm font-medium">{profile?.self_rated_ntrp || '未设置'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">地区</p>
              <p className="text-sm font-medium">{profile?.location || '未设置'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">偶像</p>
              <p className="text-sm font-medium">{profile?.idol || '未设置'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">网球风格</p>
              <p className="text-sm font-medium">{profile?.tennis_style || '未设置'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">装备</p>
              <p className="text-sm font-medium">{profile?.equipment || '未设置'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">伤病历史</p>
              <p className="text-sm font-medium">{profile?.injury_history || '无'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">短期目标</p>
              <p className="text-sm font-medium">{profile?.short_term_goal || '未设置'}</p>
            </div>
          </div>
        </div>

        {/* 球探报告列表 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            我的球探报告
          </h2>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/report')}
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(report.generated_at).toLocaleDateString('zh-CN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {report.is_published ? '已发布' : '待发布'}
                    </p>
                  </div>
                  <span className="text-wimbledon-green text-sm">查看 →</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">暂无球探报告</p>
              <button
                onClick={() => navigate('/challenge')}
                className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-2 rounded-lg text-sm transition-colors"
              >
                开始7天挑战
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile