// src/lib/i18n.js
// 国际化支持框架

// 支持的语言
export const SUPPORTED_LANGUAGES = {
  zh: '简体中文',
  en: 'English',
  zh_tw: '繁體中文'
}

// 默认语言
export const DEFAULT_LANGUAGE = 'zh'

// 翻译字典
const translations = {
  zh: {
    // 通用
    'app.name': 'Tennis Journey',
    'app.tagline': '你的7天，你的球探报告。',
    'loading': '加载中...',
    'save': '保存',
    'cancel': '取消',
    'edit': '编辑',
    'delete': '删除',
    'back': '返回',
    'next': '下一步',
    'submit': '提交',
    
    // 导航
    'nav.home': '首页',
    'nav.challenge': '7天挑战',
    'nav.community': '社区',
    'nav.profile': '个人主页',
    'nav.report': '球探报告',
    'nav.language': '语言',
    'nav.language.zh': '中文',
    'nav.language.en': 'EN',
    'nav.language.zh_tw': '繁中',
    
    // 首页
    'home.welcome': '欢迎回来，{name}！',
    'home.welcome.guest': '欢迎来到 Tennis Journey',
    'home.description': '你的网球成长之旅从这里开始。连续7天打卡，生成专属AI球探报告。',
    'home.start_challenge': '开始挑战',
    'home.explore_community': '探索社区',
    'home.stats.title': 'Tennis Journey 数据看板',
    'home.stats.users': '累计用户',
    'home.stats.logs': '打卡次数',
    'home.stats.reports': '生成报告',
    'home.community.title': '社区精选',
    'home.community.view_all': '查看全部 →',
    'home.community.subtitle': '来自网球爱好者的真实分享和心得',
    'home.community.card_likes': '赞',
    'home.recommendations.title': '内容推荐',
    'home.recommendations.video_tag': '教学视频',
    'home.recommendations.video_title': '完美正手击球技巧',
    'home.recommendations.video_desc': '学习职业选手的正手发力技巧，提升击球稳定性和力量',
    'home.recommendations.video_cta': '观看视频',
    'home.recommendations.brand_title': 'Wilson 网球装备',
    'home.recommendations.brand_desc': '百年品牌，专业网球装备，为你的比赛保驾护航',
    'home.recommendations.brand_cta': '选购装备',
    'home.recommendations.event_tag': '赛事资讯',
    'home.recommendations.event_title': '2026 温布尔登网球锦标赛',
    'home.recommendations.event_desc': '草地大满贯，网坛巅峰对决，不容错过',
    'home.recommendations.event_cta': '查看详情',
    'home.recommendations.plan_tag': '训练计划',
    'home.recommendations.plan_title': '网球专项体能训练',
    'home.recommendations.plan_desc': '提升移动速度与核心力量，优化场上表现',
    'home.recommendations.plan_cta': '观看视频',
    
    // 挑战页面
    'challenge.title': '7天挑战',
    'challenge.started_on': '开始于：{date}',
    'challenge.description': '连续7天打卡，生成你的专属球探报告',
    'challenge.day': '第{day}天',
    'challenge.today': '今天',
    'challenge.status.approved': '已完成',
    'challenge.status.pending': '待审核',
    'challenge.status.waiting': '待打卡',
    'challenge.status.locked': '未解锁',
    'challenge.status.rejected': '已拒绝',
    'challenge.current_day': '第{day}天 · {type}',
    'challenge.today_log': '今日打卡',
    'challenge.makeup_log': '补打卡',
    'challenge.go_log': '去打卡',
    'challenge.example': '示例模板：',
    'challenge.example_content': '分腿垫步练习3组，正手击球50次，发球练习20分钟',
    'challenge.complete.title': '🎉 恭喜！你已完成7天挑战！',
    'challenge.complete.description': '你的球探报告正在生成中，预计1-2分钟。',
    'challenge.complete.view_report': '查看我的球探报告',
    
    // 个人主页
    'profile.title': '个人主页',
    'profile.logout': '退出登录',
    'profile.membership.title': '会员状态',
    'profile.membership.valid_until': '🎾 会员有效期至：{date}',
    'profile.membership.renew_note': '到期后可续费，继续享受AI球探报告服务',
    'profile.membership.no_membership': '暂无会员资格，完成7天挑战即可获得30天免费会员',
    'profile.membership.challenge_success': '恭喜完成挑战！报告生成后可获得30天免费会员',
    'profile.membership.renew': '续费会员',
    'profile.membership.manage': '管理订阅',
    'profile.membership.redeem': '兑换激活码',
    'profile.membership.view_challenge': '查看挑战',
    'profile.membership.start_challenge': '开始挑战',
    'profile.tennis_profile.title': '我的网球档案',
    'profile.tennis_profile.edit': '编辑档案',
    'profile.fields.gender': '性别',
    'profile.fields.age': '年龄',
    'profile.fields.playing_years': '球龄',
    'profile.fields.ntrp': 'NTRP自评',
    'profile.fields.location': '地区',
    'profile.fields.idol': '偶像',
    'profile.fields.tennis_style': '网球风格',
    'profile.fields.equipment': '装备',
    'profile.fields.injury_history': '伤病历史',
    'profile.fields.short_term_goal': '短期目标',
    'profile.fields.not_set': '未设置',
    'profile.fields.none': '无',
    'profile.fields.bio': '个人签名',
    'profile.fields.bio_default': '热爱网球，享受每一次击球的快乐！',
    'profile.reports.title': '我的球探报告',
    'profile.reports.no_reports': '暂无球探报告',
    'profile.reports.start_challenge': '开始7天挑战',
    'profile.reports.view': '查看 →',
    'profile.reports.published': '已发布',
    'profile.reports.pending': '待发布',
    'profile.nickname_label': '昵称/用户名',
    'profile.edit_nickname': '编辑',
    'profile.nickname_placeholder': '输入昵称',
    'profile.saving': '保存中...',
    'profile.click_edit_nickname': '点击编辑昵称',
    'profile.optional_edit_hint': '以上选填信息可在「编辑档案」中修改',
    
    // 社区
    'community.title': '社区广场',
    'community.subtitle': '完成7天挑战的用户在这里分享他们的网球故事',
    'community.no_posts': '还没有帖子',
    'community.no_posts_desc': '完成7天挑战，发布你的球探报告，成为第一位社区贡献者',
    'community.go_challenge': '去完成挑战',
    'community.load_more': '加载更多',
    'community.scout_report_label': '球探报告',
    'community.just_now': '刚刚',
    'community.post_image_alt': '帖子图片',
    'community.post_image': '帖子图片',
    'community.like': '赞',
    'community.comment': '评论',
    'community.share': '转发',
    'community.repost': '转发',
    'community.repost_prompt': '添加转发评论（可选）',
    'community.default_user': '网球爱好者',
    'community.years_suffix': '年',
    'community.minutes_ago': '{minutes}分钟前',
    'community.hours_ago': '{hours}小时前',
    'community.days_ago': '{days}天前',
    'community.expand': '全文',
    'community.collapse': '收起',
    'community.photo_count': '{count}张图片',
    'community.reposted_from': '转发自',

    // 创建帖子
    'create_post.title': '创建帖子',
    'create_post.content_placeholder': '分享你的网球故事、心得或问题...',
    'create_post.max_images': '最多只能上传 {count} 张图片',
    'create_post.invalid_format': '只支持 JPG/PNG/WEBP/GIF 格式',
    'create_post.file_too_large': '单张图片不能超过2MB',
    'create_post.content_or_image_required': '请填写内容或上传图片',
    'create_post.preview_alt': '预览图片 {index}',
    'create_post.upload_images': '上传图片',
    'create_post.publishing': '发布中...',
    'create_post.publish': '发布',
    'create_post.format_hint': '支持最多3张图片，每张不超过2MB',

    // 打卡页面
    'dailylog.title': '第 {day} 天 · {type}',
    'dailylog.back_to_challenge': '← 返回挑战',
    'dailylog.edit_mode': '编辑打卡',
    'dailylog.today_log': '今日打卡',
    'dailylog.makeup_log': '补打卡',
    'dailylog.example': '打卡示范',
    'dailylog.example_view': '点击查看',
    'dailylog.example_modal.title': '管理员打卡示范',
    'dailylog.example_modal.description': '这是管理员提供的真实打卡示范。上传符合示例质量的照片和文字，有助于更快通过审核。',
    'dailylog.photos.title': '训练照片 {editable}',
    'dailylog.photos.editable': '(可编辑)',
    'dailylog.photos.uploaded': '已上传照片：',
    'dailylog.photos.new': '新上传照片：',
    'dailylog.photos.upload': '点击上传照片',
    'dailylog.photos.format': '支持 JPG/PNG/WEBP，单张≤2MB',
    'dailylog.content.title': '训练心得',
    'dailylog.content.edit_mode': '(编辑模式)',
    'dailylog.content.edit_note': '修改后重新提交会覆盖原有记录',
    'dailylog.content.review_note': '提交后由管理员审核',
    'dailylog.submit': '提交打卡',
    'dailylog.update': '更新打卡',
    'dailylog.submitting': '提交中...',
    'dailylog.update_note': '⏎ 更新后会重新进入待审核状态',
    
    // 错误消息
    'error.required_photos': '请至少上传一张训练照片',
    'error.required_content': '请填写训练心得',
    'error.max_photos': '最多只能上传3张照片',
    'error.invalid_format': '只支持 JPG/PNG/WEBP 格式',
    'error.file_too_large': '单张照片不能超过2MB',
    'error.submission_failed': '提交失败，请重试',
    'error.login_required': '请先登录',
  },
  
  en: {
    // 通用
    'app.name': 'Tennis Journey',
    'app.tagline': 'Your 7 days, your scout report.',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'edit': 'Edit',
    'delete': 'Delete',
    'back': 'Back',
    'next': 'Next',
    'submit': 'Submit',
    
    // 导航
    'nav.home': 'Home',
    'nav.challenge': '7-Day Challenge',
    'nav.community': 'Community',
    'nav.profile': 'Profile',
    'nav.report': 'Scout Report',
    
    // 首页 - 简化的英文翻译
    'home.welcome': 'Welcome back, {name}!',
    'home.welcome.guest': 'Welcome to Tennis Journey',
    'home.description': 'Your tennis growth journey starts here. Log for 7 consecutive days to generate your personalized AI scout report.',
    'home.start_challenge': 'Start Challenge',
    'home.explore_community': 'Explore Community',
    'home.stats.title': 'Tennis Journey Dashboard',
    'home.stats.users': 'Total Users',
    'home.stats.logs': 'Total Logs',
    'home.stats.reports': 'Total Reports',
    'home.community.title': 'Community Picks',
    'home.community.view_all': 'View All →',
    'home.community.subtitle': 'Real stories and tips from tennis lovers',
    'home.community.card_likes': 'Likes',
    'home.recommendations.title': 'Recommendations',
    'home.recommendations.video_tag': 'Tutorial',
    'home.recommendations.video_title': 'Perfect Forehand Technique',
    'home.recommendations.video_desc': 'Learn pro-level forehand power and consistency',
    'home.recommendations.video_cta': 'Watch Video',
    'home.recommendations.brand_title': 'Wilson Tennis Gear',
    'home.recommendations.brand_desc': 'Century‑old brand, professional tennis equipment',
    'home.recommendations.brand_cta': 'Shop Gear',
    'home.recommendations.event_tag': 'Events',
    'home.recommendations.event_title': 'Wimbledon 2026 Championships',
    'home.recommendations.event_desc': 'Grass‑court Grand Slam, the pinnacle of tennis',
    'home.recommendations.event_cta': 'View Details',
    'home.recommendations.plan_tag': 'Training Plan',
    'home.recommendations.plan_title': 'Tennis‑Specific Fitness Training',
    'home.recommendations.plan_desc': 'Improve movement speed and core strength for on‑court performance',
    'home.recommendations.plan_cta': 'Watch Video',
    'profile.title': 'Profile',
    'profile.logout': 'Log out',
    'profile.membership.title': 'Membership',
    'profile.tennis_profile.title': 'My Tennis Profile',
    'profile.tennis_profile.edit': 'Edit Profile',
    'profile.nickname_label': 'Nickname',
    'profile.edit_nickname': 'Edit',
    'profile.nickname_placeholder': 'Enter nickname',
    'profile.saving': 'Saving...',
    'profile.click_edit_nickname': 'Click to edit nickname',
    'profile.optional_edit_hint': 'Optional fields can be edited in "Edit Profile".',
    'profile.fields.bio': 'Bio',
    'profile.fields.bio_default': 'Love tennis, enjoy every shot!',
    'community.title': 'Community',
    'community.subtitle': 'Users who completed the 7-day challenge share their tennis stories here',
    'community.no_posts': 'No posts yet',
    'community.no_posts_desc': 'Complete the 7-day challenge and publish your scout report to be the first contributor',
    'community.go_challenge': 'Start Challenge',
    'community.load_more': 'Load more',
    'community.scout_report_label': 'Scout Report',
    'community.just_now': 'Just now',
    'community.post_image_alt': 'Post image',
    'community.post_image': 'Post image',
    'community.like': 'Like',
    'community.comment': 'Comment',
    'community.share': 'Share',
    'community.repost': 'Repost',
    'community.repost_prompt': 'Add comment (optional)',
    'community.default_user': 'Tennis lover',
    'community.years_suffix': ' years',
    'community.minutes_ago': '{minutes} minutes ago',
    'community.hours_ago': '{hours} hours ago',
    'community.days_ago': '{days} days ago',
    'community.expand': 'Read more',
    'community.collapse': 'Collapse',
    'community.photo_count': '{count} photos',
    'community.reposted_from': 'Reposted from',
    'create_post.title': 'Create Post',
    'create_post.content_placeholder': 'Share your tennis story, tips, or questions...',
    'create_post.max_images': 'Maximum {count} images',
    'create_post.invalid_format': 'Only JPG/PNG/WEBP/GIF formats are supported',
    'create_post.file_too_large': 'Each image must be under 2MB',
    'create_post.content_or_image_required': 'Please write content or upload an image',
    'create_post.preview_alt': 'Preview image {index}',
    'create_post.upload_images': 'Upload images',
    'create_post.publishing': 'Publishing...',
    'create_post.publish': 'Publish',
    'create_post.format_hint': 'Up to 3 images, each under 2MB',
  },
  
  zh_tw: {
    // 通用
    'app.name': 'Tennis Journey',
    'app.tagline': '你的7天，你的球探報告。',
    'loading': '載入中...',
    'save': '儲存',
    'cancel': '取消',
    'edit': '編輯',
    'delete': '刪除',
    'back': '返回',
    'next': '下一步',
    'submit': '提交',
    
    // 导航
    'nav.home': '首頁',
    'nav.challenge': '7天挑戰',
    'nav.community': '社群',
    'nav.profile': '個人主頁',
    'nav.report': '球探報告',
    
    // 首页 - 简化的繁体翻译
    'home.welcome': '歡迎回來，{name}！',
    'home.welcome.guest': '歡迎來到 Tennis Journey',
    'home.description': '你的網球成長之旅從這裡開始。連續7天打卡，生成專屬AI球探報告。',
    'home.start_challenge': '開始挑戰',
    'home.explore_community': '探索社群',
    'home.stats.title': 'Tennis Journey 數據看板',
    'home.stats.users': '累計用戶',
    'home.stats.logs': '打卡次數',
    'home.stats.reports': '生成報告',
    'home.community.title': '社群精選',
    'home.community.view_all': '查看全部 →',
    'home.community.subtitle': '來自網球愛好者的真實分享與心得',
    'home.community.card_likes': '讚',
    'home.recommendations.title': '內容推薦',
    'home.recommendations.video_tag': '教學影片',
    'home.recommendations.video_title': '完美正手擊球技巧',
    'home.recommendations.video_desc': '學習職業選手的正手發力技巧，提升擊球穩定性和力量',
    'home.recommendations.video_cta': '觀看影片',
    'home.recommendations.brand_title': 'Wilson 網球裝備',
    'home.recommendations.brand_desc': '百年品牌，專業網球裝備，為你的比賽保駕護航',
    'home.recommendations.brand_cta': '選購裝備',
    'home.recommendations.event_tag': '賽事資訊',
    'home.recommendations.event_title': '2026 溫布爾登網球錦標賽',
    'home.recommendations.event_desc': '草地大滿貫，網壇巔峰對決，不容錯過',
    'home.recommendations.event_cta': '查看詳情',
    'home.recommendations.plan_tag': '訓練計劃',
    'home.recommendations.plan_title': '網球專項體能訓練',
    'home.recommendations.plan_desc': '提升移動速度與核心力量，優化場上表現',
    'home.recommendations.plan_cta': '觀看影片',
    'profile.title': '個人主頁',
    'profile.logout': '登出',
    'profile.tennis_profile.title': '我的網球檔案',
    'profile.tennis_profile.edit': '編輯檔案',
    'profile.nickname_label': '暱稱/用戶名',
    'profile.edit_nickname': '編輯',
    'profile.nickname_placeholder': '輸入暱稱',
    'profile.saving': '儲存中...',
    'profile.click_edit_nickname': '點擊編輯暱稱',
    'profile.optional_edit_hint': '以上選填資訊可在「編輯檔案」中修改',
    'profile.fields.bio': '個人簽名',
    'profile.fields.bio_default': '熱愛網球，享受每一次擊球的快樂！',
    'community.title': '社群廣場',
    'community.subtitle': '完成7天挑戰的用戶在這裡分享他們的網球故事',
    'community.no_posts': '還沒有帖子',
    'community.no_posts_desc': '完成7天挑戰，發布你的球探報告，成為第一位社群貢獻者',
    'community.go_challenge': '去完成挑戰',
    'community.load_more': '載入更多',
    'community.scout_report_label': '球探報告',
    'community.just_now': '剛剛',
    'community.post_image_alt': '帖子圖片',
    'community.post_image': '帖子圖片',
    'community.like': '讚',
    'community.comment': '評論',
    'community.share': '轉發',
    'community.repost': '轉發',
    'community.repost_prompt': '添加轉發評論（可選）',
    'community.default_user': '網球愛好者',
    'community.years_suffix': '年',
    'community.minutes_ago': '{minutes}分鐘前',
    'community.hours_ago': '{hours}小時前',
    'community.days_ago': '{days}天前',
    'community.expand': '全文',
    'community.collapse': '收起',
    'community.photo_count': '{count}張圖片',
    'community.reposted_from': '轉發自',
    'create_post.title': '創建帖子',
    'create_post.content_placeholder': '分享你的網球故事、心得或問題...',
    'create_post.max_images': '最多只能上傳 {count} 張圖片',
    'create_post.invalid_format': '只支援 JPG/PNG/WEBP/GIF 格式',
    'create_post.file_too_large': '單張圖片不能超過2MB',
    'create_post.content_or_image_required': '請填寫內容或上傳圖片',
    'create_post.preview_alt': '預覽圖片 {index}',
    'create_post.upload_images': '上傳圖片',
    'create_post.publishing': '發佈中...',
    'create_post.publish': '發佈',
    'create_post.format_hint': '支援最多3張圖片，每張不超過2MB',
  }
}

// 获取当前语言
export function getCurrentLanguage() {
  const savedLang = localStorage.getItem('preferred_language')
  if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
    return savedLang
  }
  
  // 检测域名，自动设置默认语言
  // 注意：域名检测的优先级低于用户手动保存的语言，但高于浏览器语言
  const hostname = window.location.hostname
  if (hostname.includes('tennisjourney.top')) {
    // 国内域名默认简体中文
    return 'zh'
  } else if (hostname.includes('tj-7.vercel.app')) {
    // 国际域名默认英语
    return 'en'
  }
  
  // 检测浏览器语言
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('tw') || browserLang.includes('hant')) {
      return 'zh_tw'
    }
    return 'zh'
  } else if (browserLang.startsWith('en')) {
    return 'en'
  }
  
  return DEFAULT_LANGUAGE
}

// 设置语言
export function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES[lang]) {
    localStorage.setItem('preferred_language', lang)
    window.location.reload() // 重新加载页面以应用新语言
  }
}

// 翻译函数
export function t(key, params = {}) {
  const lang = getCurrentLanguage()
  let translation = translations[lang]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key
  
  // 替换参数
  Object.keys(params).forEach(param => {
    translation = translation.replace(`{${param}}`, params[param])
  })
  
  return translation
}

// React Hook for translations
export function useTranslation() {
  return {
    t,
    currentLanguage: getCurrentLanguage(),
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES
  }
}

// 语言切换组件（返回纯JavaScript对象，不包含JSX）
export function LanguageSwitcher() {
  // 这个函数现在只返回配置对象，实际的组件应该在React组件中实现
  const { currentLanguage, setLanguage, supportedLanguages } = useTranslation()
  
  return {
    currentLanguage,
    setLanguage,
    supportedLanguages,
    // 返回一个函数来渲染语言选择器
    render: () => {
      // 这个函数应该在React组件中调用
      console.log('LanguageSwitcher.render() should be implemented in a React component')
      return null
    }
  }
}

export default {
  t,
  getCurrentLanguage,
  setLanguage,
  useTranslation,
  LanguageSwitcher,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE
}