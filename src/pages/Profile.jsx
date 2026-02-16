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

  // 头像上传状态
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

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
      console.error('获取个人资料失败:', error)
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
      console.error('获取社交数据失败:', error)
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
      return `${minutes}分钟前`
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours}小时前`
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}天前`
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

  // 处理头像文件选择
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 预览
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)

    // 上传
    await handleAvatarUpload(file)
  }

  // 上传头像到 Supabase Storage 并更新数据库
  const handleAvatarUpload = async (file) => {
    try {
      setUploading(true)
      const { user } = await getCurrentUser()
      if (!user) {
        alert('请先登录')
        return
      }

      console.log('头像上传开始，用户ID:', user.id, '文件:', file.name, '大小:', file.size, '类型:', file.type)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      
      console.log('文件路径:', filePath)

      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('文件大小超过5MB限制')
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('不支持的文件类型，请上传 JPEG、PNG、WebP 或 GIF 图片')
      }

      // 上传到 storage bucket 'avatars' (需提前创建)
      console.log('正在上传到 Supabase Storage bucket: avatars')
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Supabase Storage 上传错误:', uploadError)
        throw new Error(`上传失败: ${uploadError.message}`)
      }

      console.log('头像上传到Storage成功')

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      console.log('头像公开URL:', publicUrl)

      // 更新 profiles 表的 avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('更新数据库错误:', updateError)
        throw new Error(`更新数据库失败: ${updateError.message}`)
      }

      console.log('数据库更新成功')

      // 更新本地状态
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      alert('头像上传成功！')
    } catch (error) {
      console.error('头像上传失败 - 完整错误:', error)
      console.error('错误堆栈:', error.stack)
      alert(`头像上传失败: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

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
                  alt="头像"
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
            {/* 上传按钮 */}
            <label className="absolute -bottom-1 -right-1 bg-wimbledon-green hover:bg-wimbledon-grass text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-sm">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={uploading}
              />
              {uploading ? (
                <svg className="w-3 h-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">社交统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalLikesReceived}</div>
              <div className="text-xs text-gray-600">获赞总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalPosts}</div>
              <div className="text-xs text-gray-600">发布帖子</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalReposts}</div>
              <div className="text-xs text-gray-600">转发帖子</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalLikesGiven}</div>
              <div className="text-xs text-gray-600">点赞过的</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wimbledon-green">{socialStats.totalCommentsGiven}</div>
              <div className="text-xs text-gray-600">评论过的</div>
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
              我的帖子 ({socialStats.totalPosts})
            </button>
            <button
              onClick={() => setSocialTab('reposts')}
              className={`pb-3 px-1 font-medium ${socialTab === 'reposts' ? 'text-wimbledon-green border-b-2 border-wimbledon-green' : 'text-gray-500'}`}
            >
              转发的 ({socialStats.totalReposts})
            </button>
            <button
              onClick={() => setSocialTab('interactions')}
              className={`pb-3 px-1 font-medium ${socialTab === 'interactions' ? 'text-wimbledon-green border-b-2 border-wimbledon-green' : 'text-gray-500'}`}
            >
              互动记录
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
                            <span>收起</span>
                            <span className="transform rotate-180">▼</span>
                          </>
                        ) : (
                          <>
                            <span>展开全部 ({userPosts.length - POSTS_VISIBLE_LIMIT} 条)</span>
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
                  <p className="text-gray-500 mb-2">还没有发布过帖子</p>
                  <p className="text-sm text-gray-400">去社区广场分享你的网球故事吧</p>
                  <button
                    onClick={() => navigate('/community')}
                    className="mt-4 bg-wimbledon-grass hover:bg-wimbledon-green text-white px-4 py-2 rounded-lg text-sm"
                  >
                    去社区逛逛 →
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
                        <span>你转发了</span>
                      </div>
                      
                      {/* 原帖信息 */}
                      {post.original_post && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                              {post.original_post.profiles?.username?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium">
                              @{post.original_post.profiles?.username || '用户'}
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
                        <span className="mr-4">❤️ {post.like_count || 0} 赞</span>
                        <span className="mr-4">💬 {post.comment_count || 0} 评论</span>
                        <span>📅 {formatTime(post.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">🔄</span>
                  <p className="text-gray-500 mb-2">还没有转发过帖子</p>
                  <p className="text-sm text-gray-400">在社区广场发现有趣的内容可以转发分享</p>
                </div>
              )}
            </div>
          )}

          {/* 互动记录 */}
          {socialTab === 'interactions' && (
            <div>
              {/* 点赞过的帖子 */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-800 mb-4">点赞过的帖子 ({userLikes.length})</h3>
                {userLikes.length > 0 ? (
                  <div className="space-y-3">
                    {userLikes.map((post) => (
                      <div key={post.id} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm mr-3">
                          {post.profiles?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">@{post.profiles?.username || '用户'}</span>
                            <span className="text-xs text-gray-500">{formatTime(post.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">还没有点赞过任何帖子</p>
                )}
              </div>

              {/* 评论过的帖子（暂未实现） */}
              <div>
                <h3 className="font-medium text-gray-800 mb-4">评论过的帖子</h3>
                <p className="text-gray-500 text-sm text-center py-4">评论功能即将上线</p>
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
                📢 意见反馈
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
                  <span>收起档案</span>
                  <span className="transform rotate-180">▼</span>
                </>
              ) : (
                <>
                  <span>展开完整档案</span>
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