// src/pages/Profile.jsx
// 个人主页 - 显示档案、报告和会员状态，增加社交统计

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser, signOut } from '../lib/auth'
import { redirectToCustomerPortal } from '../lib/stripe'
import { useTranslation } from '../lib/i18n'
import PostCard from '../components/PostCard'

function Profile() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 新增社交相关状态
  const [profileTab, setProfileTab] = useState('profile') // 'profile'（资料）, 'activity'（动态）
  const [socialTab, setSocialTab] = useState('posts') // 'posts', 'reposts', 'interactions'（仅在动态标签内）
  const [userPosts, setUserPosts] = useState([])
  const [userReposts, setUserReposts] = useState([])
  const [userLikes, setUserLikes] = useState([])
  const [socialStats, setSocialStats] = useState({
    totalLikesReceived: 0,
    totalPosts: 0,
    totalReposts: 0,
    totalLikesGiven: 0,
    totalCommentsGiven: 0
  })

  // 折叠/展开状态
  const [postsExpanded, setPostsExpanded] = useState(false)
  const [profileExpanded, setProfileExpanded] = useState(false)
  const POSTS_VISIBLE_LIMIT = 2 // 默认显示2条帖子
  const PROFILE_BASIC_FIELDS = ['gender', 'playing_years', 'self_rated_ntrp', 'location'] // 核心信息

  useEffect(() => {
    fetchProfileData()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchSocialData()
    }
  }, [profile])

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
      console.error(t('error.fetch_profile_failed') + ':', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSocialData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      // 获取用户发布的帖子（原创）
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          scout_reports!posts_report_id_fkey (
            id,
            generated_at
          )
        `)
        .eq('user_id', user.id)
        .is('original_post_id', null) // 原创帖子（不是转发）
        .order('created_at', { ascending: false })

      if (postsError) throw postsError
      setUserPosts(postsData || [])

      // 获取用户转发的帖子
      const { data: repostsData, error: repostsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          original_post:original_post_id (
            id,
            content,
            user_id,
            profiles!inner (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .not('original_post_id', 'is', null) // 转发帖子
        .order('created_at', { ascending: false })

      if (repostsError) throw repostsError
      setUserReposts(repostsData || [])

      // 获取用户点赞过的帖子
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select(`
          post_id,
          posts!inner (
            id,
            content,
            created_at,
            profiles!inner (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (likesError) throw likesError
      setUserLikes(likesData?.map(like => like.posts) || [])

      // 计算社交统计
      const totalLikesReceived = (postsData || []).reduce((sum, post) => sum + (post.like_count || 0), 0)
      const totalPosts = (postsData || []).length
      const totalReposts = (repostsData || []).length
      const totalLikesGiven = likesData?.length || 0
      
      // 获取用户评论数量
      const { count: commentCount, error: commentError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      const totalCommentsGiven = commentError ? 0 : (commentCount || 0)

      setSocialStats({
        totalLikesReceived,
        totalPosts,
        totalReposts,
        totalLikesGiven,
        totalCommentsGiven
      })

    } catch (error) {
      console.error(t('error.fetch_social_data_failed') + ':', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return t('community.minutes_ago', { minutes })
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return t('community.hours_ago', { hours })
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return t('community.days_ago', { days })
    }
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }

  const handleLikeUpdate = (postId, operation) => {
    // 更新本地状态
    if (socialTab === 'posts') {
      setUserPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            like_count: operation === 'increment'
              ? (post.like_count || 0) + 1
              : Math.max(0, (post.like_count || 0) - 1)
          }
        }
        return post
      }))
    }
  }

  // 头像功能已移除，使用首字母头像

  if (loading) {
    return (
      <div className="min-h-screen bg-wimbledon-white flex items-center justify-center">
        <div className="text-wimbledon-green">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wimbledon-white py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            {/* 头像显示与上传区域 */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white shadow-md">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={t('profile.avatar_alt')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <span className="text-2xl font-bold">
                    {profile?.username?.charAt(0) || profile?.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <h1 className="font-wimbledon text-2xl font-bold text-wimbledon-green">
            {t('profile.title')}
          </h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-500 text-sm"
          >
            {t('profile.logout')}
          </button>
        </div>

        {/* 社交统计卡片 */}
        <div className="bg-gradient-to-r from-wimbledon-green/10 to-wimbledon-grass/10 rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('profile.social_stats.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalLikesReceived}</div>
              <div className="text-xs text-gray-600">{t('profile.social_stats.total_likes_received')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalPosts}</div>
              <div className="text-xs text-gray-600">{t('profile.social_stats.total_posts')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalReposts}</div>
              <div className="text-xs text-gray-600">{t('profile.social_stats.total_reposts')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalLikesGiven}</div>
              <div className="text-xs text-gray-600">{t('profile.social_stats.total_likes_given')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalCommentsGiven}</div>
              <div className="text-xs text-gray-600">{t('profile.social_stats.total_comments_given')}</div>
            </div>
          </div>
        </div>

        {/* 社交内容选项卡 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex space-x-4 border-b border-gray-100 mb-6">
            <button
              onClick={() => setSocialTab('posts')}
              className={`pb-3 px-1 font-medium ${socialTab === 'posts' ? 'text-wimbledon-green border-b-2 border-wimbledon-green' : 'text-gray-500'}`}
            >
              {t('profile.social_stats.my_posts')} ({socialStats.totalPosts})
            </button>
            <button
              onClick={() => setSocialTab('reposts')}
              className={`pb-3 px-1 font-medium ${socialTab === 'reposts' ? 'text-wimbledon-green border-b-2 border-wimbledon-green' : 'text-gray-500'}`}
            >
              {t('profile.social_stats.reposts')} ({socialStats.totalReposts})
            </button>
            <button
              onClick={() => setSocialTab('interactions')}
              className={`pb-3 px-1 font-medium ${socialTab === 'interactions' ? 'text-wimbledon-green border-b-2 border-wimbledon-green' : 'text-gray-500'}`}
            >
              {t('profile.social_stats.interactions')}
            </button>
          </div>

          {/* 我的帖子 */}
          {socialTab === 'posts' && (
            <div>
              {userPosts.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {userPosts
                      .slice(0, postsExpanded ? userPosts.length : POSTS_VISIBLE_LIMIT)
                      .map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLikeUpdate={handleLikeUpdate}
                          onCommentUpdate={() => {}}
                          onRepostUpdate={() => {}}
                        />
                      ))}
                  </div>
                  {userPosts.length > POSTS_VISIBLE_LIMIT && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                      <button
                        onClick={() => setPostsExpanded(!postsExpanded)}
                        className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        {postsExpanded ? (
                          <>
                            <span>{t('profile.social_stats.collapse')}</span>
                            <span className="transform rotate-180">▼</span>
                          </>
                        ) : (
                          <>
                            <span>{t('profile.social_stats.expand_all')} ({userPosts.length - POSTS_VISIBLE_LIMIT} {t('profile.social_stats.posts_unit')})</span>
                            <span>▼</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📝</span>
                  <p className="text-gray-500 mb-2">{t('profile.social_stats.no_posts_yet')}</p>
                  <p className="text-sm text-gray-400">{t('profile.social_stats.go_to_community')}</p>
                  <button
                    onClick={() => navigate('/community')}
                    className="mt-4 bg-wimbledon-grass hover:bg-wimbledon-green text-white px-4 py-2 rounded-lg text-sm"
                  >
                    {t('profile.social_stats.go_to_community')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 转发的帖子 */}
          {socialTab === 'reposts' && (
            <div>
              {userReposts.length > 0 ? (
                <div className="space-y-4">
                  {userReposts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-xl p-4">
                      {/* 转发标识 */}
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span className="mr-1">🔄</span>
                        <span>{t('profile.social_stats.reposted_by_you')}</span>
                      </div>
                      
                      {/* 原帖信息 */}
                      {post.original_post && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                              {post.original_post.profiles?.username?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium">
                              @{post.original_post.profiles?.username || t('community.default_user')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{post.original_post.content}</p>
                        </div>
                      )}
                      
                      {/* 转发时的评论 */}
                      {post.content && (
                        <p className="text-gray-800 text-sm mb-3">{post.content}</p>
                      )}
                      
                      {/* 统计信息 */}
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-4">❤️ {post.like_count || 0} {t('community.like')}</span>
                        <span className="mr-4">💬 {post.comment_count || 0} {t('community.comment')}</span>
                        <span>📅 {formatTime(post.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">🔄</span>
                  <p className="text-gray-500 mb-2">{t('profile.social_stats.no_reposts_yet')}</p>
                  <p className="text-sm text-gray-400">{t('profile.social_stats.repost_hint')}</p>
                </div>
              )}
            </div>
          )}

          {/* 互动记录 */}
          {socialTab === 'interactions' && (
            <div>
              {/* 点赞过的帖子 */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-800 mb-4">{t('profile.social_stats.liked_posts')} ({userLikes.length})</h3>
                {userLikes.length > 0 ? (
                  <div className="space-y-3">
                    {userLikes.map((post) => (
                      <div key={post.id} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm mr-3">
                          {post.profiles?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">@{post.profiles?.username || t('profile.default_username')}</span>
                            <span className="text-xs text-gray-500">{formatTime(post.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">{t('profile.social_stats.no_liked_posts')}</p>
                )}
              </div>

              {/* 评论过的帖子（暂未实现） */}
              <div>
                <h3 className="font-medium text-gray-800 mb-4">{t('profile.social_stats.commented_posts')}</h3>
                <p className="text-gray-500 text-sm text-center py-4">{t('profile.social_stats.comments_coming_soon')}</p>
              </div>
            </div>
          )}
        </div>

        {/* 会员状态卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                {t('profile.membership.title')}
              </h2>
              {profile?.membership_valid_until ? (
                <div>
                  <p className="text-sm text-gray-600">
                    {t('profile.membership.valid_until', { date: new Date(profile.membership_valid_until).toLocaleDateString() })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('profile.membership.renew_note')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  {profile?.challenge_status === 'success' 
                    ? t('profile.membership.challenge_success')
                    : t('profile.membership.no_membership')}
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
                    {t('profile.membership.renew')}
                  </button>
                  <button
                    onClick={redirectToCustomerPortal}
                    className="bg-white border border-wimbledon-grass text-wimbledon-grass hover:bg-wimbledon-grass/5 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {t('profile.membership.manage')}
                  </button>
                  <button
                    onClick={() => navigate('/redeem')}
                    className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {t('profile.membership.redeem')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/challenge')}
                  className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {profile?.challenge_status === 'in_progress' ? t('profile.membership.view_challenge') : t('profile.membership.start_challenge')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 网球档案卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {t('profile.tennis_profile.title')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/onboarding?edit=true')}
                className="text-wimbledon-green hover:text-wimbledon-grass text-sm"
              >
                {t('profile.tennis_profile.edit')}
              </button>
              <button
                onClick={() => navigate('/feedback')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {t('profile.feedback_button')}
              </button>
            </div>
          </div>
          
          {/* 核心信息区域 - 用户名和个人签名（仅展示，编辑统一在「编辑档案」） */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="mb-4">
              <p className="text-xs text-gray-500">{t('profile.nickname_label')}</p>
              <p className="text-lg font-bold text-gray-900">{profile?.username || profile?.email?.split('@')[0] || t('profile.fields.not_set')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('profile.fields.bio')}</p>
              <p className="text-sm text-gray-700 italic">{profile?.bio || t('profile.fields.bio_default')}</p>
            </div>
          </div>
          
          {/* 核心档案信息（始终显示） */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">{t('profile.fields.gender')}</p>
              <p className="text-sm font-medium">{profile?.gender || t('profile.fields.not_set')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('profile.fields.playing_years')}</p>
              <p className="text-sm font-medium">{profile?.playing_years ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('profile.fields.ntrp')}</p>
              <p className="text-sm font-medium">{profile?.self_rated_ntrp ?? t('profile.fields.not_set')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('profile.fields.location')}</p>
              <p className="text-sm font-medium">{profile?.location || t('profile.fields.not_set')}</p>
            </div>
          </div>
          
          {/* 展开的补充信息 */}
          {profileExpanded && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">{t('profile.fields.age')}</p>
                <p className="text-sm font-medium">{profile?.age ? `${profile.age}` : t('profile.fields.not_set')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('profile.fields.idol')}</p>
                <p className="text-sm font-medium">{profile?.idol || t('profile.fields.not_set')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">{t('profile.fields.tennis_style')}</p>
                <p className="text-sm font-medium">{profile?.tennis_style || t('profile.fields.not_set')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">{t('profile.fields.equipment')}</p>
                <p className="text-sm font-medium">{profile?.equipment || t('profile.fields.not_set')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">{t('profile.fields.injury_history')}</p>
                <p className="text-sm font-medium">{profile?.injury_history || t('profile.fields.none')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">{t('profile.fields.short_term_goal')}</p>
                <p className="text-sm font-medium">{profile?.short_term_goal || t('profile.fields.not_set')}</p>
              </div>
            </div>
          )}
          
          {/* 展开/收起按钮 */}
          <div className="pt-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setProfileExpanded(!profileExpanded)}
              className="text-wimbledon-green hover:text-wimbledon-grass text-sm font-medium flex items-center gap-1 transition-colors"
            >
              {profileExpanded ? (
                <>
                  <span>{t('profile.collapse_profile')}</span>
                  <span className="transform rotate-180">▼</span>
                </>
              ) : (
                <>
                  <span>{t('profile.expand_full_profile')}</span>
                  <span>▼</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 球探报告列表 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t('profile.reports.title')}
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
                      {report.is_published ? t('profile.reports.published') : t('profile.reports.pending')}
                    </p>
                  </div>
                  <span className="text-wimbledon-green text-sm">{t('profile.reports.view')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">{t('profile.reports.no_reports')}</p>
              <button
                onClick={() => navigate('/challenge')}
                className="bg-wimbledon-grass hover:bg-wimbledon-green text-white px-6 py-2 rounded-lg text-sm transition-colors"
              >
                {t('profile.reports.start_challenge')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile