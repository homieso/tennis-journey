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
    'home.recommendations.title': '内容推荐',
    
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
    'profile.reports.title': '我的球探报告',
    'profile.reports.no_reports': '暂无球探报告',
    'profile.reports.start_challenge': '开始7天挑战',
    'profile.reports.view': '查看 →',
    'profile.reports.published': '已发布',
    'profile.reports.pending': '待发布',
    
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
    'home.recommendations.title': 'Recommendations',
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
    'home.recommendations.title': '內容推薦',
  }
}

// 获取当前语言
export function getCurrentLanguage() {
  const savedLang = localStorage.getItem('preferred_language')
  if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
    return savedLang
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