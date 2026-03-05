// src/lib/i18n.js
// 国际化支持框架

// 支持的语言
export const SUPPORTED_LANGUAGES = {
  zh: '简体中文',
  en: 'English',
  zh_tw: '繁體中文'
}

// 默认语言
export const DEFAULT_LANGUAGE = 'en'

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
    'challenge.submitting': '提交中...',
    'challenge.final_submit': '最终提交',
    'challenge.awaiting_report.title': '恭喜完成7天挑战',
    'challenge.awaiting_report.description': '报告生成中，预计1-2分钟。生成完成后可在此查看。',
    'challenge.go_view_report': '去查看报告',
    'challenge.report_generated_description': '你的球探报告已生成。',
    'challenge.congratulations_with_name': '恭喜 {name} 完成7天挑战',
    'challenge.final_submit_note': '请在最终提交前检查落实资料。',
    'challenge.today_log_description': '上传你的训练照片，记录今日心得',
    'challenge.makeup_log_description': '补打第{day}天的卡',
    'challenge.loading_calendar': '加载日历中...',
    
    // 新增挑战相关翻译
    'challenge.deadline': '截止时间',
    'challenge.reset_title': '挑战中断',
    'challenge.reset_message': '检测到第{day}天（{date}）未在截止时间前打卡',
    'challenge.reset_detail': '挑战已中断，需要重新开始。未审核的记录将被清除。',
    'challenge.reset_confirm': '重新开始挑战',
    'challenge.reset_cancel': '取消',
    'challenge.resetting': '重置中...',
    'challenge.reset_success': '挑战已重置，可以重新开始',
    'challenge.reset_failed': '重置挑战失败',
    'challenge.reset_cancelled': '已取消重置',
    'challenge.missed_day_reset': '检测到漏打卡，挑战已自动重置',
    'challenge.missed_day_detected': '漏打卡检测',
    'challenge.missed_guide': '检测到您有一天未在24小时内打卡，挑战已中断。请点击下方按钮重新开始。',
    'challenge.missed_tip': '提示：每天记得在24小时内打卡，保持连续记录！',
    'challenge.reset_now': '立即重新开始',
    'challenge.reset_will_clear': '重置将清除当前进度',
    'challenge.current_progress': '当前进度',
    'challenge.days': '天',
    
    // 个人主页
    'profile.title': '个人主页',
    'profile.logout': '退出登录',
    'profile.membership.title': '会员状态',
    'profile.membership.valid_until': '🎾 会员有效期至：{date}',
    'profile.membership.renew_note': '到期后可续费，继续享受AI球探报告服务',
    'profile.membership.no_membership': '暂无会员资格，完成7天挑战即可获得30天免费会员',
    'profile.membership.congrats': '恭喜完成挑战！',
    'profile.membership.report_reward': '报告生成后可获得30天免费会员',
    'profile.membership.subscribe': '订阅会员',
    'profile.membership.renew': '续费会员',
    'profile.membership.manage': '管理订阅',
    'profile.membership.redeem': '兑换激活码',
    'profile.membership.view_challenge': '查看挑战',
    'profile.membership.start_challenge': '开始挑战',
    
    // 球探报告按钮
    'scoutReport.share_report': '分享我的报告',
    'scoutReport.new_challenge': '开始新的挑战',
    'scoutReport.back_to_profile': '返回个人主页',
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
    'profile.avatar_alt': '头像',
    'profile.default_username': '用户',
    'profile.feedback_button': '📢 意见反馈',
    'profile.collapse_profile': '收起档案',
    'profile.expand_full_profile': '展开完整档案',
    
    // 个人主页 - 社交统计
    'profile.social_stats.title': '社交统计',
    'profile.social_stats.total_likes_received': '获赞总数',
    'profile.social_stats.total_posts': '发布帖子',
    'profile.social_stats.total_reposts': '转发帖子',
    'profile.social_stats.total_likes_given': '点赞过的',
    'profile.social_stats.total_comments_given': '评论过的',
    'profile.social_stats.my_posts': '我的帖子',
    'profile.social_stats.reposts': '转发的',
    'profile.social_stats.interactions': '互动记录',
    'profile.social_stats.collapse': '收起',
    'profile.social_stats.expand_all': '展开全部',
    'profile.social_stats.posts_unit': '条',
    'profile.social_stats.no_posts_yet': '还没有发布过帖子',
    'profile.social_stats.go_to_community': '去社区逛逛 →',
    'profile.social_stats.no_reposts_yet': '还没有转发过帖子',
    'profile.social_stats.repost_hint': '在社区广场发现有趣的内容可以转发分享',
    'profile.social_stats.reposted_by_you': '你转发了',
    'profile.social_stats.liked_posts': '点赞过的帖子',
    'profile.social_stats.no_liked_posts': '还没有点赞过任何帖子',
    'profile.social_stats.commented_posts': '评论过的帖子',
    'profile.social_stats.comments_coming_soon': '评论功能即将上线',
    'profile.social_stats.posts_count': '({count})',
    'profile.social_stats.comments': '評論',
    'profile.social_stats.comment_on': '評論於',
    'profile.social_stats.view_original_post': '查看原帖',
    'profile.social_stats.no_comments_yet': '還沒有發表過評論',
    'profile.social_stats.comment_hint': '在社群發現有趣的內容可以發表評論',
    'community.reply': '回覆',
    'profile.social_stats.comments': '评论',
    'profile.social_stats.comment_on': '评论于',
    'profile.social_stats.view_original_post': '查看原帖',
    'profile.social_stats.no_comments_yet': '还没有发表过评论',
    'profile.social_stats.comment_hint': '在社区发现有趣的内容可以发表评论',
    'community.reply': '回复',
    
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
    'community.manual_refresh': '手动刷新',
    'community.already_reposted': '您已经转发过此帖子',
    'community.repost_success': '转发成功！可以在你的个人主页查看',
    'community.default_repost_content': '转发分享',

    // 帖子详情和评论
    'postDetail.comment_required': '请输入评论内容',
    'postDetail.comment_success': '评论发布成功！',
    'postDetail.comment_failed': '评论发布失败，请重试',
    'postDetail.reply_to': '回复',
    'postDetail.reply': '回复',
    'postDetail.report': '举报',
    'postDetail.comments_title': '评论',
    'postDetail.no_comments': '还没有评论，快来抢沙发！',
    'postDetail.replying_to': '正在回复',
    'postDetail.comment_placeholder': '写下你的评论...',
    'postDetail.emoji': '表情',
    'postDetail.upload_image': '上传图片',
    'postDetail.simultaneous_repost': '同时转发',
    'postDetail.posting': '发布中...',
    'postDetail.post_comment': '发布评论',
    'postDetail.login_to_comment': '登录后即可评论',
    'postDetail.go_login': '去登录',
    'postDetail.load_more': '加载更多评论',
    'postDetail.loading_comments': '加载评论中...',
    'postDetail.post_not_found': '帖子不存在',
    'postDetail.post_deleted': '该帖子可能已被删除或不存在',
    'postDetail.back_to_community': '返回社区',
    'postDetail.back': '返回',
    'postCard.repost_success': '转发成功！可以在你的个人主页查看',
    'postCard.repost_failed': '转发失败，请重试',

    // 定价页面
    'pricing.title': '解锁你的网球进阶之路',
    'pricing.description': '完成7天挑战后，选择适合你的方式继续享受AI球探报告服务',
    'pricing.back': '返回首页',
    'pricing.monthlySubscription': '月付订阅',
    'pricing.redeemCode': '激活码兑换',
    'pricing.internationalPayment': '🌍 国际支付',
    'pricing.domesticUsersRecommend': '🇨🇳 国内用户推荐',
    'pricing.testMode': '测试模式 · 不会真实扣款',
    'pricing.startChallengeFree': '开始挑战（免费）',
    'pricing.unlockFeatures': '解锁功能',
    'pricing.seePricing': '查看定价',
    'pricing.monthlyPrice': '$5',
    'pricing.monthlyPriceCny': '¥35',
    'pricing.monthlyCardTitle': '月付订阅',
    'pricing.redeemCardTitle': '激活码兑换',
    'pricing.stripePayment': '使用 Stripe 安全支付，支持全球信用卡',
    'pricing.redeemPayment': '通过淘宝/微店购买激活码，输入即可兑换',
    'pricing.unlimitedReports': '无限次生成球探报告',
    'pricing.viewHistory': '查看历史打卡记录',
    'pricing.communityDiscussion': '参与社区讨论',
    'pricing.cancelAnyTime': '可随时取消',
    'pricing.alipayWechat': '支付宝/微信支付',
    'pricing.noIntlCard': '无需国际信用卡',
    'pricing.instantActivation': '即时到账',
    'pricing.multipleMonths': '可购买多个月份',
    'pricing.subscribeButton': '订阅月付 $5',
    'pricing.subscribeLoading': '跳转支付中...',
    'pricing.redeemButton': '输入激活码',
    'pricing.redeemHint': '前往淘宝/微店搜索「Tennis Journey」购买',
    'pricing.freeMembership': '🎉 完成7天挑战的用户自动获得30天免费会员',
    'pricing.paymentNote': '所有支付均通过 Stripe 或第三方平台处理，我们不会存储你的支付信息',

    // 球探报告
    'scoutReport.loading': '加载报告中...',
    'scoutReport.publishButton': '发布到社区',
    'scoutReport.shareFeatureComing': '分享功能即将上线！',
    'scoutReport.publishing': '发布中...',
    'scoutReport.published': '已发布',
    'scoutReport.publish_direct': '直接发布报告',
    'scoutReport.edit_profile': '✎ 编辑档案信息，重新生成报告',
    'scoutReport.publish_success': '报告已成功发布到社区！',
    'scoutReport.published_to_community': '你的报告已发布到社区',
    'scoutReport.view_post': '查看帖子',
    'scoutReport.generated_time': '生成时间：',
    'scoutReport.reward_note': '你的专属球探报告已生成，发布后可获得30天免费会员资格。',
    'scoutReport.publish_content_zh': '我的挑战成功了！快看我的专属球探报告！',
    'scoutReport.publish_content_en': 'I completed the challenge! Check out my exclusive scout report!',
    'scoutReport.publish_content_zh_tw': '我的挑戰成功了！快看我的專屬球探報告！',
    'scoutReport.completion_title': '报告完成',
    'scoutReport.completion_subtitle': '你的7天网球之旅总结',
    'scoutReport.completion_message': '恭喜你完成了7天网球挑战！这份报告记录了你的成长轨迹。',
    'scoutReport.completion_hint': '继续坚持训练，期待你的下一次进步！',
    'scoutReport.return': '返回',
    'scoutReport.title': '你的专属球探报告',
    'scoutReport.swipe_hint': '左右滑动查看完整报告',
    'scoutReport.noReport': '暂无球探报告，请先完成7天挑战',

    // 管理员
    'admin.only_admin_delete': '只有管理员可以删除帖子',
    'admin.delete_confirm': '确定要删除这个帖子吗？删除后无法恢复。',
    'admin.delete_success': '帖子删除成功',
    'admin.deleting': '删除中...',
    'admin.delete_button': '🗑️ 删除',
    'admin.announcement_label': '公告',
    'admin.mark_as_announcement': '标记为公告',
    'admin.announcement_hint': '仅管理员可发布公告，公告会置顶显示',
    'admin.edit_button': '✏️ 编辑',
    'admin.update_post': '更新帖子',
    'admin.edit_post': '编辑帖子',
    'admin.updating': '更新中...',
    'admin.edit_button': '✏️ 编辑',
    'admin.update_post': '更新帖子',
    'admin.edit_post': '编辑帖子',
    'admin.updating': '更新中...',

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

    // Example photo captions
    'dailylog.example_photo_captions.forehand': '正手练习',
    'dailylog.example_photo_captions.split_step': '垫步练习',
    'dailylog.example_photo_captions.serve': '发球练习',
    // Example bullet points
    'dailylog.example_bullet.forehand': '• 正手练习——右手持拍，充分侧身向前挥拍，确保击球点在身体前方。',
    'dailylog.example_bullet.split_step': '• 垫步练习——双腿站在边线，膝盖微弯，准备启动垫步。',
    'dailylog.example_bullet.serve': '• 发球练习——右手持拍置于后背，“奖杯式”举拍，充分顶肘向前向上挥拍。',
    // Common
    'common.close': '关闭',
    
    // 错误消息
    'error.required_photos': '请至少上传一张训练照片',
    'error.required_content': '请填写训练心得',
    'error.max_photos': '最多只能上传3张照片',
    'error.invalid_format': '只支持 JPG/PNG/WEBP 格式',
    'error.file_too_large': '单张照片不能超过2MB',
    'error.submission_failed': '提交失败，请重试',
    'error.login_required': '请先登录',
    'error.fetch_challenge_failed': '获取挑战数据失败',
    'error.final_submit_failed': '提交失败，请稍后重试',
    'error.fetch_profile_failed': '获取个人资料失败',
    'error.fetch_social_data_failed': '获取社交数据失败',
    'error.report_generation_failed': '生成球探报告失败',
    'error.report_not_completed_challenge': '用户尚未完成7天挑战',
    'error.report_not_found': '球探报告不存在',
    'error.load_failed': '加载失败',
    'error.retry': '重试',
    'error.password_mismatch': '两次输入的密码不一致',
    'error.password_too_short': '密码至少需要6个字符',
    
    // 注册页面
    'register.create_account': '创建你的账户',
    'register.email_label': '邮箱地址',
    'register.email_placeholder': 'your@email.com',
    'register.password_label': '密码',
    'register.password_placeholder': '至少6个字符',
    'register.confirm_password_label': '确认密码',
    'register.confirm_password_placeholder': '再次输入密码',
    'register.registering': '注册中...',
    'register.register_button': '注册',
    'register.have_account': '已有账户？',
    'register.login_now': '立即登录',
    
    // 账户注销
    'account.deletion.title': '注销账户',
    'account.deletion.warning': '⚠️ 温馨提示',
    'account.deletion.description': '你的数据会暂时保存30天，30天后永久删除。如果你只是想重新开始7天挑战，可以先清除挑战记录而不是注销账户。',
    'account.deletion.reason_label': '请告诉我们注销原因（选填）：',
    'account.deletion.reason_placeholder': '例如：不再使用、隐私考虑、重复账户等',
    'account.deletion.reason_optional': '选填',
    'account.deletion.clear_challenge': '清除挑战记录',
    'account.deletion.cancel': '取消',
    'account.deletion.confirm': '确认注销',
    'account.deletion.success': '账户注销请求已提交。数据将保留30天，之后永久删除。',
    'account.deletion.failed': '注销失败，请稍后重试',
    
    // 新增翻译键
    'post.publish_success': '帖子发布成功！',
    'scoutReport.no_report': '暂无球探报告，请先完成7天挑战',
    'scoutReport.no_report_title': '暂无球探报告',
    'scoutReport.congrats_title': '恭喜完成7天挑战！',
    'scoutReport.load_failed': '加载报告失败，请稍后重试',
    'scoutReport.go_challenge': '去完成挑战',
    'scoutReport.back_challenge': '← 返回挑战',
    'scoutReport.publishing': '发布中...',
    'scoutReport.published': '已发布',
    'scoutReport.publish_direct': '直接发布报告',
    'scoutReport.edit_profile': '✎ 编辑档案信息，重新生成报告',
    'scoutReport.publish_success': '报告已成功发布到社区！',
    'scoutReport.published_to_community': '你的报告已发布到社区',
    'scoutReport.view_post': '查看帖子',
    'scoutReport.generated_time': '生成时间：',
    'scoutReport.reward_note': '你的专属球探报告已生成，发布后可获得30天免费会员资格。',
    'pricing.card1': '月付订阅（国际用户）',
    'pricing.card2': '激活码（国内用户）',
    'redeem.example': '例如：TJ-2024-XXXX',
    'redeem.format': '激活码格式：TJ-XXXX-XXXX（不区分大小写）',
    'feedback.example': '例如：建议添加夜间模式、社区搜索功能等',
    'feedback.uploaded_images': '已上传图片：',
    'feedback.community_rules': '请保持文明用语，共同维护良好的社区氛围',
    'feedback.emergency_help': '如需紧急帮助，请通过客服邮箱联系：support@tennisjourney.top',
    'feedback.improve_experience': '你的反馈将帮助我们不断改进产品体验',
    'ntrp.self_rating': '自评等级：NTRP {value}',
    'shareReport.motivation': '分享你的7天网球挑战成果，激励更多网球爱好者！',
    'scoutReportNew.stats_title': '打卡数据',
    'scoutReportNew.stats_subtitle': '7天训练成果统计',
    'scoutReportNew.days_logged': '打卡天数',
    'scoutReportNew.report_complete': '报告完成',
    'scoutReportNew.report_summary': '你的7天网球之旅总结',
    'scoutReportNew.congrats_message': '恭喜你完成了7天网球挑战！这份报告记录了你的成长轨迹。',
    'scoutReportNew.share_report': '分享我的报告',
    'scoutReportNew.start_new_challenge': '开始新的挑战',
    'scoutReportNew.back_profile': '返回个人主页',
    'onboarding.example_nickname': '例如：网球小王',
    'onboarding.example_bio': '例如：热爱网球，享受每一次击球的快乐！',
    'onboarding.example_playing_years': '例如：3',
    'onboarding.example_idol': '例如：费德勒、纳达尔、李娜',
    'onboarding.example_tennis_style': '例如：发球上网、底线相持等',
    'onboarding.example_age': '例如：28',
    'onboarding.example_location': '例如：北京、上海、广州',
    'onboarding.example_equipment': '例如：Wilson Blade v9, 天然羊肠线',
    'onboarding.example_injury': '例如：膝盖不适、网球肘等',
    'onboarding.example_goal': '例如：提高一发成功率、反手稳定性',
    'onboarding.save_success': '档案保存成功！你可以继续完善信息，或开始7天挑战。',
    'onboarding.edit_description': '补充更多信息，让球探报告更精准',
    'onboarding.new_description': '只需一步，让我们更好地了解你',
    'onboarding.optional_hint': '填写更多信息，让AI生成更精准的球探报告',
    'onboarding.required_note': '标记 * 的项目为必填，选填信息可随时在个人主页补充',
    'onboarding.later_challenge': '稍后填写，先去挑战',
    
    // App.jsx 新增翻译
    'app.announcement1': '欢迎来到 Tennis Journey！完成7天挑战，解锁你的专属AI球探报告。',
    'app.announcement2': '社区交流规范：友善互动，分享网球心得，禁止广告与不当言论。',
    'app.announcement3': '产品愿景：帮助每一位网球爱好者记录成长，连接全球球友。',
    'app.admin': '管理员',
    'app.coming_soon': '此功能正在开发中，敬请期待！',
    'app.community_post_default': '社区帖子 {index}',
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
    'nav.language': 'Language',
    'nav.language.en': 'English',
    'nav.language.zh': '简体中文',
    'nav.language.zh_tw': '繁體中文',
    
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
    'profile.membership.congrats': 'Congratulations on completing the challenge!',
    'profile.membership.report_reward': 'You\'ll get 30 days free membership after the report is generated.',
    'profile.membership.subscribe': 'Subscribe',
    'profile.membership.no_membership': 'No membership yet. Complete the 7-day challenge to get 30 days free!',
    'profile.membership.view_challenge': 'View Challenge',
    
    // 球探报告按钮
    'scoutReport.share_report': 'Share My Report',
    'scoutReport.new_challenge': 'Start New Challenge',
    'scoutReport.back_to_profile': 'Back to Profile',
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
    'profile.fields.gender': 'Gender',
    'profile.fields.age': 'Age',
    'profile.fields.playing_years': 'Playing years',
    'profile.fields.ntrp': 'NTRP self‑rated',
    'profile.fields.location': 'Location',
    'profile.fields.idol': 'Idol',
    'profile.fields.tennis_style': 'Tennis style',
    'profile.fields.equipment': 'Equipment',
    'profile.fields.injury_history': 'Injury history',
    'profile.fields.short_term_goal': 'Short‑term goal',
    'profile.fields.not_set': 'Not set',
    'profile.fields.none': 'None',
    'profile.avatar_alt': 'Avatar',
    'profile.default_username': 'User',
    'profile.feedback_button': '📢 Feedback',
    'profile.collapse_profile': 'Collapse profile',
    'profile.expand_full_profile': 'Expand full profile',
    
    // Profile - Social Stats
    'profile.social_stats.title': 'Social Stats',
    'profile.social_stats.total_likes_received': 'Total Likes Received',
    'profile.social_stats.total_posts': 'Posts Published',
    'profile.social_stats.total_reposts': 'Posts Reposted',
    'profile.social_stats.total_likes_given': 'Likes Given',
    'profile.social_stats.total_comments_given': 'Comments Given',
    'profile.social_stats.my_posts': 'My Posts',
    'profile.social_stats.reposts': 'Reposts',
    'profile.social_stats.interactions': 'Interactions',
    'profile.social_stats.collapse': 'Collapse',
    'profile.social_stats.expand_all': 'Expand All',
    'profile.social_stats.posts_unit': 'more',
    'profile.social_stats.no_posts_yet': 'No posts yet',
    'profile.social_stats.go_to_community': 'Go to Community →',
    'profile.social_stats.no_reposts_yet': 'No reposts yet',
    'profile.social_stats.repost_hint': 'Discover interesting content in the Community to repost and share',
    'profile.social_stats.reposted_by_you': 'You reposted',
    'profile.social_stats.liked_posts': 'Liked Posts',
    'profile.social_stats.no_liked_posts': 'No liked posts yet',
    'profile.social_stats.commented_posts': 'Commented Posts',
    'profile.social_stats.comments_coming_soon': 'Comments feature coming soon',
    'profile.social_stats.posts_count': '({count})',
    'profile.social_stats.comments': 'Comments',
    'profile.social_stats.comment_on': 'Commented on',
    'profile.social_stats.view_original_post': 'View original post',
    'profile.social_stats.no_comments_yet': 'No comments yet',
    'profile.social_stats.comment_hint': 'Discover interesting content in the Community to comment on',
    'community.reply': 'Reply',
    
    // Profile - Reports
    'profile.reports.title': 'My Scout Reports',
    'profile.reports.no_reports': 'No scout reports yet',
    'profile.reports.start_challenge': 'Start 7-Day Challenge',
    'profile.reports.view': 'View →',
    'profile.reports.published': 'Published',
    'profile.reports.pending': 'Pending',
    
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
    'community.manual_refresh': 'Manual refresh',
    'community.already_reposted': 'You have already reposted this post',
    'community.repost_success': 'Repost successful! You can view it on your profile.',
    'community.default_repost_content': 'Repost share',
    
    // Post detail and comments
    'postDetail.comment_required': 'Please enter comment content',
    'postDetail.comment_success': 'Comment published successfully!',
    'postDetail.comment_failed': 'Comment publishing failed, please try again',
    'postDetail.reply_to': 'Reply to',
    'postDetail.reply': 'Reply',
    'postDetail.report': 'Report',
    'postDetail.comments_title': 'Comments',
    'postDetail.no_comments': 'No comments yet, be the first!',
    'postDetail.replying_to': 'Replying to',
    'postDetail.comment_placeholder': 'Write your comment...',
    'postDetail.emoji': 'Emoji',
    'postDetail.upload_image': 'Upload image',
    'postDetail.simultaneous_repost': 'Simultaneously repost',
    'postDetail.posting': 'Publishing...',
    'postDetail.post_comment': 'Post comment',
    'postDetail.login_to_comment': 'Log in to comment',
    'postDetail.go_login': 'Go to login',
    'postDetail.load_more': 'Load more comments',
    'postDetail.loading_comments': 'Loading comments...',
    'postDetail.post_not_found': 'Post not found',
    'postDetail.post_deleted': 'This post may have been deleted or does not exist',
    'postDetail.back_to_community': 'Back to community',
    'postDetail.back': 'Back',
    'postCard.repost_success': 'Repost successful!',
    
    'scoutReport.loading': 'Loading report...',
    'scoutReport.publishButton': 'Publish to Community',
    'scoutReport.shareFeatureComing': 'Share feature coming soon!',
    'scoutReport.completion_title': 'Report Complete',
    'scoutReport.completion_subtitle': 'Your 7‑day tennis journey summary',
    'scoutReport.completion_message': 'Congratulations on completing the 7‑day tennis challenge! This report records your growth trajectory.',
    'scoutReport.completion_hint': 'Keep training and look forward to your next progress!',
    'scoutReport.return': 'Back',
    'scoutReport.title': 'Your Exclusive Scout Report',
    'scoutReport.swipe_hint': 'Swipe to view full report',
    'scoutReport.noReport': 'No scout report yet, please complete the 7‑day challenge first',
    'admin.only_admin_delete': 'Only administrators can delete posts',
    'admin.delete_confirm': 'Are you sure you want to delete this post? It cannot be recovered after deletion.',
    'admin.delete_success': 'Post deleted successfully',
    'admin.deleting': 'Deleting...',
    'admin.delete_button': '🗑️ Delete',
    'admin.announcement_label': 'Announcement',
    'admin.mark_as_announcement': 'Mark as announcement',
    'admin.announcement_hint': 'Only administrators can post announcements, announcements will be pinned',
    'admin.edit_button': '✏️ Edit',
    'admin.update_post': 'Update Post',
    'admin.edit_post': 'Edit Post',
    'admin.updating': 'Updating...',
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

    // Daily log page
    'dailylog.title': 'Day {day} · {type}',
    'dailylog.back_to_challenge': '← Back to Challenge',
    'dailylog.edit_mode': 'Edit Log',
    'dailylog.today_log': 'Today\'s Log',
    'dailylog.makeup_log': 'Make-up Log',
    'dailylog.example': 'Log Example',
    'dailylog.example_view': 'Click to view',
    'dailylog.example_modal.title': 'Admin Log Example',
    'dailylog.example_modal.description': 'This is a real log example provided by the admin. Upload photos and text that match the example quality to speed up review.',
    'dailylog.photos.title': 'Training photos {editable}',
    'dailylog.photos.editable': '(editable)',
    'dailylog.photos.uploaded': 'Uploaded photos:',
    'dailylog.photos.new': 'New photos:',
    'dailylog.photos.upload': 'Click to upload photos',
    'dailylog.photos.format': 'Supports JPG/PNG/WEBP, each ≤2MB',
    'dailylog.content.title': 'Training reflections',
    'dailylog.content.edit_mode': '(edit mode)',
    'dailylog.content.edit_note': 'Resubmitting after modification will overwrite the existing record.',
    'dailylog.content.review_note': 'Submitted logs will be reviewed by admin.',
    'dailylog.submit': 'Submit log',
    'dailylog.update': 'Update log',
    'dailylog.submitting': 'Submitting...',
    'dailylog.update_note': '⏎ After updating, it will return to pending review.',

    // Example photo captions
    'dailylog.example_photo_captions.forehand': 'Forehand practice',
    'dailylog.example_photo_captions.split_step': 'Split‑step practice',
    'dailylog.example_photo_captions.serve': 'Serve practice',
    // Example bullet points
    'dailylog.example_bullet.forehand': '• Forehand practice—Right‑handed grip, full body rotation, ensure contact point in front of the body.',
    'dailylog.example_bullet.split_step': '• Split‑step practice—Stand on the baseline, knees slightly bent, ready to initiate split‑step.',
    'dailylog.example_bullet.serve': '• Serve practice—Right‑handed grip placed behind the back, "trophy pose" racket lift, fully extend elbow forward and upward.',
    // Common
    'common.close': 'Close',

    // Error messages
    'error.required_photos': 'Please upload at least one training photo',
    'error.required_content': 'Please fill in your training reflections',
    'error.max_photos': 'You can upload up to 3 photos',
    'error.invalid_format': 'Only JPG/PNG/WEBP formats are supported',
    'error.file_too_large': 'Each photo must be under 2MB',
    'error.submission_failed': 'Submission failed, please try again',
    'error.login_required': 'Please log in first',
    'error.no_challenge_start_date': 'User does not have a challenge start date',
    'error.check_log_failed': 'Failed to check log records',
    'error.delete_file_failed': 'Failed to delete file',
    'error.fetch_challenge_failed': 'Failed to fetch challenge data',
    'error.final_submit_failed': 'Submission failed, please try again later',
    'error.fetch_profile_failed': 'Failed to fetch profile data',
    'error.fetch_social_data_failed': 'Failed to fetch social data',
    'error.report_generation_failed': 'Scout report generation failed',
    'error.report_not_completed_challenge': 'User has not completed 7-day challenge',
    'error.report_not_found': 'Scout report not found',
    'error.load_failed': 'Load failed',
    'error.retry': 'Retry',
    'error.password_mismatch': 'Passwords do not match',
    'error.password_too_short': 'Password must be at least 6 characters',
    
    // Register page
    'register.create_account': 'Create your account',
    'register.email_label': 'Email address',
    'register.email_placeholder': 'your@email.com',
    'register.password_label': 'Password',
    'register.password_placeholder': 'At least 6 characters',
    'register.confirm_password_label': 'Confirm password',
    'register.confirm_password_placeholder': 'Enter password again',
    'register.registering': 'Registering...',
    'register.register_button': 'Register',
    'register.have_account': 'Already have an account?',
    'register.login_now': 'Login now',

    // Account deletion
    'account.deletion.title': 'Delete Account',
    'account.deletion.warning': '⚠️ Important Notice',
    'account.deletion.description': 'Your data will be kept for 30 days, then permanently deleted. If you just want to restart the 7-day challenge, you can clear challenge records instead of deleting your account.',
    'account.deletion.reason_label': 'Please tell us why you’re deleting your account (optional):',
    'account.deletion.reason_placeholder': 'e.g., no longer using, privacy concerns, duplicate account',
    'account.deletion.reason_optional': 'Optional',
    'account.deletion.clear_challenge': 'Clear Challenge Records',
    'account.deletion.cancel': 'Cancel',
    'account.deletion.confirm': 'Confirm Deletion',
    'account.deletion.success': 'Account deletion request submitted. Data will be retained for 30 days, then permanently deleted.',
    'account.deletion.failed': 'Deletion failed, please try again later',

    // Scout report page
    'scoutReport.reportTitle': 'Personal Scout Report',
    'scoutReport.share': 'Share',
    'scoutReport.swipeToView': 'Swipe to view',
    'scoutReport.userProfile': 'User Profile',
    'scoutReport.logData': 'Log Data',
    'scoutReport.technicalAnalysis': 'Technical Analysis',
    'scoutReport.trainingSuggestions': 'Training Suggestions',
    'scoutReport.playerComparison': 'Player Comparison',
    'scoutReport.achievementBadges': 'Achievement Badges',
    'scoutReport.shareAndSummary': 'Share & Summary',
    'scoutReport.yourTennisIdentity': 'Your tennis identity',
    'scoutReport.daysLogged': 'Days logged',
    'scoutReport.trainingPhotos': 'Training photos',
    'scoutReport.mostFrequentExercise': 'Most frequent exercise',
    'scoutReport.technicalKeywords': 'Technical keywords',
    'scoutReport.strengths': 'Strengths',
    'scoutReport.improvementsNeeded': 'Improvements needed',
    'scoutReport.technicalInsights': 'Technical insights',
    'scoutReport.personalizedTrainingPlan': 'Personalized training plan',
    'scoutReport.similarities': 'Similarities',
    'scoutReport.differences': 'Differences',
    'scoutReport.nextGoal': 'Next goal',
    'scoutReport.reportCompleted': 'Report completed',
    'scoutReport.summaryText': 'Congratulations on completing the 7‑day tennis challenge! This report documents your growth journey.',
    'scoutReport.keepTraining': 'Keep training and look forward to your next progress!',
    'scoutReport.shareMyReport': 'Share my report',
    'scoutReport.startNewChallenge': 'Start a new challenge',
    'scoutReport.backToProfile': 'Back to profile',
    'scoutReport.loadingReport': 'Loading report...',
    'scoutReport.noReport': 'No scout report yet, please complete the 7‑day challenge first',
    'scoutReport.loadFailed': 'Failed to load report, please try again later',
    'scoutReport.return': 'Back',
    'scoutReport.completeChallenge': 'Go complete challenge',
    'scoutReport.coverTitle': 'Your 7‑Day Tennis Journey Report',
    'scoutReport.coverSubtitle': 'Personal AI Scout Report',
    'scoutReport.swipeToExplore': 'Swipe right to explore →',
    'scoutReport.gender': 'Gender',
    'scoutReport.playingYears': 'Playing years',
    'scoutReport.ntrp': 'NTRP self‑rating',
    'scoutReport.idol': 'Idol',
    'scoutReport.summary': 'Summary',
    'scoutReport.totalDays': 'Total days',
    'scoutReport.technicalAdvantages': 'Technical advantages',
    'scoutReport.areasForImprovement': 'Areas for improvement',
    'scoutReport.recommendation': 'Recommendation',
    'scoutReport.frequency': 'Frequency',
    'scoutReport.comparePlayer': 'Compare player',
    'scoutReport.achievementBadge': 'Achievement badge',
    'scoutReport.badgeDescription': 'Badge description',
    'scoutReport.title': 'Your Exclusive Scout Report',
    'scoutReport.swipe_hint': 'Swipe to view full report',
    'scoutReport.page_profile': 'Profile',
    'scoutReport.page_stats': 'Stats',
    'scoutReport.page_analysis': 'Analysis',
    'scoutReport.page_tips': 'Tips',
    'scoutReport.page_comparison': 'Comparison',
    'scoutReport.page_achievements': 'Achievements',
    'scoutReport.page_summary': 'Summary',

    // Pricing page
    'pricing.title': 'Unlock Your Tennis Journey',
    'pricing.description': 'After completing the 7-day challenge, choose the right way for you to continue enjoying AI scout report service',
    'pricing.back': 'Back to Home',
    'pricing.monthlySubscription': 'Monthly Subscription',
    'pricing.redeemCode': 'Redeem Code',
    'pricing.internationalPayment': 'International Payment',
    'pricing.domesticUsersRecommend': 'Recommended for domestic users',
    'pricing.testMode': 'Test mode · no real charge',
    'pricing.startChallengeFree': 'Start Challenge (Free)',
    'pricing.unlockFeatures': 'Unlock Features',
    'pricing.seePricing': 'See Pricing',
    'pricing.monthlyPrice': '$5',
    'pricing.monthlyPriceCny': '¥35',
    'pricing.monthlyCardTitle': 'Monthly Subscription',
    'pricing.redeemCardTitle': 'Activation Code Redemption',
    'pricing.stripePayment': 'Secure payment via Stripe, supports global credit cards',
    'pricing.redeemPayment': 'Purchase activation code via Taobao/Weidian, enter to redeem',
    'pricing.unlimitedReports': 'Unlimited scout report generation',
    'pricing.viewHistory': 'View historical log records',
    'pricing.communityDiscussion': 'Participate in community discussions',
    'pricing.cancelAnyTime': 'Cancel anytime',
    'pricing.alipayWechat': 'Alipay/WeChat Pay',
    'pricing.noIntlCard': 'No international credit card required',
    'pricing.instantActivation': 'Instant activation',
    'pricing.multipleMonths': 'Can purchase multiple months',
    'pricing.subscribeButton': 'Subscribe Monthly $5',
    'pricing.subscribeLoading': 'Redirecting to payment...',
    'pricing.redeemButton': 'Enter Activation Code',
    'pricing.redeemHint': 'Search "Tennis Journey" on Taobao/Weidian to purchase',
    'pricing.freeMembership': '🎉 Users completing 7-day challenge automatically get 30 days free membership',
    'pricing.paymentNote': 'All payments are processed via Stripe or third-party platforms, we do not store your payment information',

    // Redeem page
    'redeem.title': 'Redeem Activation Code',
    'redeem.backToPricing': 'Back to Pricing',
    'redeem.redeemNow': 'Redeem Now',
    'redeem.success': 'Redeem successful!',
    'redeem.codeFormat': 'Activation code format',

    // Feedback page
    'feedback.title': 'Feedback',
    'feedback.title_label': 'Title',
    'feedback.content_label': 'Content',
    'feedback.images_label': 'Images (optional)',
    'feedback.contact_label': 'Contact (optional)',
    'feedback.submit_button': 'Submit Feedback',
    'feedback.submitting': 'Submitting...',
    'feedback.success': 'Feedback submitted successfully!',
    'feedback.error': 'Submission failed, please try again.',
    'feedback.notes_title': 'Notes',
    'feedback.note_emergency': 'For urgent help, please contact support email',
    'feedback.note_response': 'We will reply within 24 hours.',
    'feedback.back': 'Back',
    'feedback.thanks': 'Thank you for your feedback!',
    'feedback.thanks_message': 'We have received your suggestions and will reply as soon as possible.',
    'feedback.new_feedback': 'Submit New Feedback',
    'feedback.view_my_feedback': 'View My Feedback',
    'feedback.return_home': 'Return Home',
    'feedback.placeholder_title': 'Briefly describe your feedback',
    'feedback.placeholder_content': 'Please describe your suggestions or issues in detail',
    'feedback.placeholder_contact': 'Email or WeChat (for reply)',
    'feedback.example_title': 'For example: suggest adding dark mode, community search function, etc.',
    'feedback.example_content': 'Please be as detailed as possible to help us better understand and resolve the issue.',
    'feedback.upload_hint': 'Click to upload images',
    'feedback.upload_format': 'Supports JPG, PNG, WEBP formats, single file ≤2MB, up to 3 images',
    'feedback.uploaded_images': 'Uploaded images:',
    'feedback.max_images_alert': 'You can upload up to 3 images only',
    'feedback.invalid_format_alert': 'Only JPG, PNG, WEBP formats are supported',
    'feedback.file_too_large_alert': 'Image {name} exceeds 2MB limit',
    'feedback.upload_failed': 'File upload failed, please try again',
    'feedback.customerEmail': 'Customer service email',

    // Create post modal
    'createPost.title': 'Create Post',
    'createPost.post': 'Post',
    'createPost.uploadImages': 'Upload images',
    'createPost.maxThreeImages': 'Up to 3 images',

    // Post card
    'postCard.like': 'Like',
    'postCard.comment': 'Comment',
    'postCard.repost': 'Repost',
    'postCard.readMore': 'Read more',
    'postCard.collapse': 'Collapse',
    'postCard.need_approval': 'This feature requires you to complete the 7-day challenge and get approved. Start your journey now!',

    // Challenge page
    'challenge.title': '7-Day Challenge',
    'challenge.started_on': 'Started on: {date}',
    'challenge.description': 'Log for 7 consecutive days to generate your personalized scout report.',
    'challenge.day': 'Day {day}',
    'challenge.today': 'Today',
    'challenge.status.approved': 'Completed',
    'challenge.status.pending': 'Pending Review',
    'challenge.status.waiting': 'Waiting to Log',
    'challenge.status.locked': 'Locked',
    'challenge.status.rejected': 'Rejected',
    'challenge.current_day': 'Day {day} · {type}',
    'challenge.today_log': 'Today\'s Log',
    'challenge.makeup_log': 'Make-up Log',
    'challenge.go_log': 'Go Log',
    'challenge.example': 'Example Template:',
    'challenge.example_content': 'Split‑step drills 3 sets, forehand strokes 50 times, serve practice 20 minutes',
    'challenge.complete.title': '🎉 Congratulations! You have completed the 7‑day challenge!',
    'challenge.complete.description': 'Your scout report is being generated, estimated 1‑2 minutes.',
    'challenge.complete.view_report': 'View My Scout Report',
    'challenge.awaiting_report.title': 'Congratulations on completing the 7‑day challenge',
    'challenge.awaiting_report.description': 'Report is being generated, estimated 1‑2 minutes. You can view it here once ready.',
    'challenge.submitting': 'Submitting...',
    'challenge.final_submit': 'Final Submit',
    'challenge.loading_calendar': 'Loading your challenge calendar...',
    'challenge.go_view_report': 'Go to view report',
    'challenge.report_generated_description': 'Your scout report has been generated.',
    'challenge.congratulations_with_name': 'Congratulations {name} on completing the 7‑day challenge',
    'challenge.final_submit_note': 'Please verify your details before final submission.',
    'challenge.today_log_description': 'Upload your training photos and record today\'s reflections',
    'challenge.makeup_log_description': 'Make‑up log for day {day}',
    
    // 新增挑战相关翻译 - 英文
    'challenge.deadline': 'Deadline',
    'challenge.reset_title': 'Challenge Interrupted',
    'challenge.reset_message': 'Day {day} ({date}) was not logged before the deadline',
    'challenge.reset_detail': 'The challenge has been interrupted and needs to restart. Unapproved logs will be cleared.',
    'challenge.reset_confirm': 'Restart Challenge',
    'challenge.reset_cancel': 'Cancel',
    'challenge.resetting': 'Resetting...',
    'challenge.reset_success': 'Challenge reset, you can start over',
    'challenge.reset_failed': 'Failed to reset challenge',
    'challenge.reset_cancelled': 'Reset cancelled',
    'challenge.missed_day_reset': 'Missed day detected, challenge automatically reset',
    'challenge.missed_day_detected': 'Missed Day Detected',
    'challenge.missed_guide': 'We detected a missed day (no check-in within 24h). Please click below to restart your challenge.',
    'challenge.missed_tip': 'Tip: Remember to check in within 24 hours each day to maintain your streak!',
    'challenge.reset_now': 'Restart Now',
    'challenge.reset_will_clear': 'Reset will clear current progress',
    'challenge.current_progress': 'Current Progress',
    'challenge.days': 'days',
    
    // 新增翻译键 - 英文
    'post.publish_success': 'Post published successfully!',
    'scoutReport.no_report': 'No scout report yet, please complete the 7‑day challenge first',
    'scoutReport.no_report_title': 'No Scout Report',
    'scoutReport.congrats_title': 'Congratulations on completing the 7‑day challenge!',
    'scoutReport.load_failed': 'Failed to load report, please try again later',
    'scoutReport.go_challenge': 'Go to Challenge',
    'scoutReport.back_challenge': '← Back to Challenge',
    'scoutReport.publishing': 'Publishing...',
    'scoutReport.published': 'Published',
    'scoutReport.publish_direct': 'Publish Report Directly',
    'scoutReport.edit_profile': '✎ Edit profile information, regenerate report',
    'scoutReport.publish_success': 'Report successfully published to community!',
    'scoutReport.published_to_community': 'Your report has been published to community',
    'scoutReport.view_post': 'View Post',
    'scoutReport.generated_time': 'Generated time: ',
    'scoutReport.reward_note': 'Your exclusive scout report has been generated. Publish it to get 30 days free membership.',
    'pricing.card1': 'Monthly Subscription (International Users)',
    'pricing.card2': 'Activation Code (Domestic Users)',
    'redeem.example': 'Example: TJ-2024-XXXX',
    'redeem.format': 'Activation code format: TJ-XXXX-XXXX (case-insensitive)',
    'feedback.example': 'Example: suggest dark mode, community search function, etc.',
    'feedback.uploaded_images': 'Uploaded images:',
    'feedback.community_rules': 'Please use polite language, maintain a good community atmosphere',
    'feedback.emergency_help': 'For urgent help, please contact support email: support@tennisjourney.top',
    'feedback.improve_experience': 'Your feedback will help us continuously improve product experience',
    'ntrp.self_rating': 'Self‑rated level: NTRP {value}',
    'ntrp.slider_description': 'Drag the slider to select your skill level (1.0 Beginner - 5.0 Professional)',
    'shareReport.motivation': 'Share your 7‑day tennis challenge achievements, inspire more tennis enthusiasts!',
    'scoutReportNew.stats_title': 'Log Data',
    'scoutReportNew.stats_subtitle': '7‑day training results statistics',
    'scoutReportNew.days_logged': 'Days logged',
    'scoutReportNew.report_complete': 'Report Complete',
    'scoutReportNew.report_summary': 'Your 7‑day tennis journey summary',
    'scoutReportNew.congrats_message': 'Congratulations on completing the 7‑day tennis challenge! This report records your growth trajectory.',
    'scoutReportNew.share_report': 'Share My Report',
    'scoutReportNew.start_new_challenge': 'Start a New Challenge',
    'scoutReportNew.back_profile': 'Back to Profile',
    
    // Onboarding page translations
    'onboarding.title.edit': 'Edit Profile',
    'onboarding.title.new': 'Complete Your Profile',
    'onboarding.edit_description': 'Add more information to make scout report more accurate',
    'onboarding.new_description': 'Just one step, let us know you better',
    'onboarding.section.basic': 'Basic Information',
    'onboarding.label.username': 'Username',
    'onboarding.placeholder.username': 'Enter your username',
    'onboarding.label.bio': 'Bio',
    'onboarding.placeholder.bio': 'Tell us about your tennis journey',
    'onboarding.label.gender': 'Gender',
    'onboarding.gender.male': 'Male',
    'onboarding.gender.female': 'Female',
    'onboarding.gender.other': 'Other',
    'onboarding.gender.prefer_not': 'Prefer not to say',
    'onboarding.label.playing_years': 'Playing Years',
    'onboarding.placeholder.playing_years': 'How many years have you played tennis?',
    'onboarding.label.ntrp': 'NTRP Self‑Rating',
    'onboarding.label.idol': 'Tennis Idol',
    'onboarding.placeholder.idol': 'Who inspires your tennis game?',
    'onboarding.label.style': 'Tennis Style',
    'onboarding.select_placeholder': 'Select your playing style',
    'onboarding.label.custom_style': 'Custom Style',
    'onboarding.placeholder.custom_style': 'Describe your unique playing style',
    'onboarding.section.additional': 'Additional Information',
    'onboarding.additional_hint': 'Optional fields – fill in to get more personalized scout report',
    'onboarding.label.age': 'Age',
    'onboarding.placeholder.age': 'Your age',
    'onboarding.label.location': 'Location',
    'onboarding.placeholder.location': 'Where do you play tennis?',
    'onboarding.label.equipment': 'Equipment',
    'onboarding.placeholder.equipment': 'Your racket, strings, shoes, etc.',
    'onboarding.label.injury': 'Injury History',
    'onboarding.placeholder.injury': 'Any past tennis‑related injuries?',
    'onboarding.label.goal': 'Short‑term Goal',
    'onboarding.placeholder.goal': 'What do you want to improve next?',
    'onboarding.button.saving': 'Saving...',
    'onboarding.button.update': 'Update Profile',
    'onboarding.button.save': 'Save Profile',
    'onboarding.button.later': 'Fill Later, Go to Challenge',
    'onboarding.footer.required_note': '* Required fields. Optional information can be added anytime in your profile.',
    'onboarding.validation.username_required': 'Username is required',
    'onboarding.validation.gender_required': 'Please select your gender',
    'onboarding.validation.playing_years_required': 'Playing years is required',
    'onboarding.validation.playing_years_invalid': 'Playing years must be between 0 and 70',
    'onboarding.validation.idol_required': 'Please enter your tennis idol',
    'onboarding.validation.style_required': 'Please select your tennis style',
    'onboarding.validation.custom_style_required': 'Please describe your custom style',
    'onboarding.success.save': 'Profile saved successfully!',
    'onboarding.error.load_failed': 'Failed to load profile data',
    
    // Existing onboarding example keys
    'onboarding.example_nickname': 'Example: Tennis Wang',
    'onboarding.example_bio': 'Example: Love tennis, enjoy every shot!',
    'onboarding.example_playing_years': 'Example: 3',
    'onboarding.example_idol': 'Example: Federer, Nadal, Li Na',
    'onboarding.example_tennis_style': 'Example: serve and volley, baseline rally, etc.',
    'onboarding.example_age': 'Example: 28',
    'onboarding.example_location': 'Example: Beijing, Shanghai, Guangzhou',
    'onboarding.example_equipment': 'Example: Wilson Blade v9, natural gut strings',
    'onboarding.example_injury': 'Example: knee discomfort, tennis elbow, etc.',
    'onboarding.example_goal': 'Example: improve first serve success rate, backhand stability',
    'onboarding.save_success': 'Profile saved successfully! You can continue to improve information, or start the 7‑day challenge.',
    'onboarding.optional_hint': 'Fill in more information to let AI generate more accurate scout report',
    'onboarding.required_note': 'Items marked * are required, optional information can be supplemented anytime in profile',
    'onboarding.later_challenge': 'Fill later, go to challenge',
    
    // App.jsx 新增翻译 - 英文
    'app.announcement1': 'Welcome to Tennis Journey! Complete the 7-day challenge to unlock your exclusive AI scout report.',
    'app.announcement2': 'Community guidelines: Friendly interaction, sharing tennis insights, no ads or inappropriate content.',
    'app.announcement3': 'Product vision: Help every tennis enthusiast record growth and connect with global players.',
    'app.admin': 'Admin',
    'app.coming_soon': 'This feature is under development, stay tuned!',
    'app.community_post_default': 'Community post {index}',
    
    // 新增翻译键 - 权限相关
    'error.permission_denied': 'You don\'t have permission to perform this action',
    'postDetail.approval_required': 'You need to complete the 7-day challenge to comment',
    'postDetail.start_challenge': 'Start Challenge',
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
    'nav.language': '語言',
    'nav.language.en': 'English',
    'nav.language.zh': '简体中文',
    'nav.language.zh_tw': '繁體中文',
    
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
    'profile.fields.gender': '性別',
    'profile.fields.age': '年齡',
    'profile.fields.playing_years': '球齡',
    'profile.fields.ntrp': 'NTRP自評',
    'profile.fields.location': '地區',
    'profile.fields.idol': '偶像',
    'profile.fields.tennis_style': '網球風格',
    'profile.fields.equipment': '裝備',
    'profile.fields.injury_history': '傷病歷史',
    'profile.fields.short_term_goal': '短期目標',
    'profile.fields.not_set': '未設置',
    'profile.fields.none': '無',
    'profile.avatar_alt': '頭像',
    'profile.default_username': '用戶',
    'profile.feedback_button': '📢 意見回饋',
    'profile.collapse_profile': '收起檔案',
    'profile.expand_full_profile': '展開完整檔案',
    
    // 個人主頁會員狀態
    'profile.membership.no_membership': '暫無會員資格，完成7天挑戰即可獲得30天免費會員',
    'profile.membership.view_challenge': '查看挑戰',
    
    // 球探報告按鈕
    'scoutReport.share_report': '分享我的報告',
    'scoutReport.new_challenge': '開始新的挑戰',
    'scoutReport.back_to_profile': '返回個人主頁',
    
    // 個人主頁 - 社交統計
    'profile.social_stats.title': '社交統計',
    'profile.social_stats.total_likes_received': '獲讚總數',
    'profile.social_stats.total_posts': '發布帖子',
    'profile.social_stats.total_reposts': '轉發帖子',
    'profile.social_stats.total_likes_given': '點贊過的',
    'profile.social_stats.total_comments_given': '評論過的',
    'profile.social_stats.my_posts': '我的帖子',
    'profile.social_stats.reposts': '轉發的',
    'profile.social_stats.interactions': '互動記錄',
    'profile.social_stats.collapse': '收起',
    'profile.social_stats.expand_all': '展開全部',
    'profile.social_stats.posts_unit': '條',
    'profile.social_stats.no_posts_yet': '還沒有發布過帖子',
    'profile.social_stats.go_to_community': '去社區逛逛 →',
    'profile.social_stats.no_reposts_yet': '還沒有轉發過帖子',
    'profile.social_stats.repost_hint': '在社群廣場發現有趣的內容可以轉發分享',
    'profile.social_stats.reposted_by_you': '你轉發了',
    'profile.social_stats.liked_posts': '點贊過的帖子',
    'profile.social_stats.no_liked_posts': '還沒有點贊過任何帖子',
    'profile.social_stats.commented_posts': '評論過的帖子',
    'profile.social_stats.comments_coming_soon': '評論功能即將上線',
    'profile.social_stats.posts_count': '({count})',
    
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
    'community.manual_refresh': '手動刷新',
    'community.already_reposted': '您已經轉發過此帖子',
    'community.repost_success': '轉發成功！可以在你的個人主頁查看',
    'community.default_repost_content': '轉發分享',
    
    // 帖子詳情和評論
    'postDetail.comment_required': '請輸入評論內容',
    'postDetail.comment_success': '評論發佈成功！',
    'postDetail.comment_failed': '評論發佈失敗，請重試',
    'postDetail.reply_to': '回覆',
    'postDetail.reply': '回覆',
    'postDetail.report': '舉報',
    'postDetail.comments_title': '評論',
    'postDetail.no_comments': '還沒有評論，快來搶沙發！',
    'postDetail.replying_to': '正在回覆',
    'postDetail.comment_placeholder': '寫下你的評論...',
    'postDetail.emoji': '表情',
    'postDetail.upload_image': '上傳圖片',
    'postDetail.simultaneous_repost': '同時轉發',
    'postDetail.posting': '發佈中...',
    'postDetail.post_comment': '發佈評論',
    'postDetail.login_to_comment': '登入後即可評論',
    'postDetail.go_login': '去登入',
    'postDetail.load_more': '載入更多評論',
    'postDetail.loading_comments': '載入評論中...',
    'postDetail.post_not_found': '帖子不存在',
    'postDetail.post_deleted': '該帖子可能已被刪除或不存在',
    'postDetail.back_to_community': '返回社群',
    'postDetail.back': '返回',
    'postCard.repost_success': '轉發成功！',

    'scoutReport.loading': '載入報告中...',
    'scoutReport.publishButton': '發佈到社區',
    'scoutReport.shareFeatureComing': '分享功能即將上線！',
    'scoutReport.completion_title': '報告完成',
    'scoutReport.completion_subtitle': '你的7天網球之旅總結',
    'scoutReport.completion_message': '恭喜你完成了7天網球挑戰！這份報告記錄了你的成長軌跡。',
    'scoutReport.completion_hint': '繼續堅持訓練，期待你的下一次進步！',
    'scoutReport.return': '返回',
    'scoutReport.title': '你的專屬球探報告',
    'scoutReport.swipe_hint': '左右滑動查看完整報告',
    'scoutReport.noReport': '暫無球探報告，請先完成7天挑戰',

    // 管理員
    'admin.only_admin_delete': '只有管理員可以刪除帖子',
    'admin.delete_confirm': '確定要刪除這個帖子嗎？刪除後無法恢復。',
    'admin.delete_success': '帖子刪除成功',
    'admin.deleting': '刪除中...',
    'admin.delete_button': '🗑️ 刪除',
    'admin.announcement_label': '公告',
    'admin.mark_as_announcement': '標記為公告',
    'admin.announcement_hint': '僅管理員可發佈公告，公告會置頂顯示',
    'admin.edit_button': '✏️ 編輯',
    'admin.update_post': '更新帖子',
    'admin.edit_post': '編輯帖子',
    'admin.updating': '更新中...',

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

    // 打卡頁面
    'dailylog.title': '第 {day} 天 · {type}',
    'dailylog.back_to_challenge': '← 返回挑戰',
    'dailylog.edit_mode': '編輯打卡',
    'dailylog.today_log': '今日打卡',
    'dailylog.makeup_log': '補打卡',
    'dailylog.example': '打卡示範',
    'dailylog.example_view': '點擊查看',
    'dailylog.example_modal.title': '管理員打卡示範',
    'dailylog.example_modal.description': '這是管理員提供的真實打卡示範。上傳符合示例質量的照片和文字，有助於更快通過審核。',
    'dailylog.photos.title': '訓練照片 {editable}',
    'dailylog.photos.editable': '(可編輯)',
    'dailylog.photos.uploaded': '已上傳照片：',
    'dailylog.photos.new': '新上傳照片：',
    'dailylog.photos.upload': '點擊上傳照片',
    'dailylog.photos.format': '支援 JPG/PNG/WEBP，單張≤2MB',
    'dailylog.content.title': '訓練心得',
    'dailylog.content.edit_mode': '(編輯模式)',
    'dailylog.content.edit_note': '修改後重新提交會覆蓋原有記錄',
    'dailylog.content.review_note': '提交後由管理員審核',
    'dailylog.submit': '提交打卡',
    'dailylog.update': '更新打卡',
    'dailylog.submitting': '提交中...',
    'dailylog.update_note': '⏎ 更新後會重新進入待審核狀態',

    // Example photo captions
    'dailylog.example_photo_captions.forehand': '正手練習',
    'dailylog.example_photo_captions.split_step': '墊步練習',
    'dailylog.example_photo_captions.serve': '發球練習',
    // Example bullet points
    'dailylog.example_bullet.forehand': '• 正手練習——右手持拍，充分側身向前揮拍，確保擊球點在身體前方。',
    'dailylog.example_bullet.split_step': '• 墊步練習——雙腿站在邊線，膝蓋微彎，準備啟動墊步。',
    'dailylog.example_bullet.serve': '• 發球練習——右手持拍置於後背，「獎杯式」舉拍，充分頂肘向前向上揮拍。',
    // Common
    'common.close': '關閉',

    // 挑戰頁面
    'challenge.title': '7天挑戰',
    'challenge.started_on': '開始於：{date}',
    'challenge.description': '連續7天打卡，生成你的專屬球探報告',
    'challenge.day': '第{day}天',
    'challenge.today': '今天',
    'challenge.status.approved': '已完成',
    'challenge.status.pending': '待審核',
    'challenge.status.waiting': '待打卡',
    'challenge.status.locked': '未解鎖',
    'challenge.status.rejected': '已拒絕',
    'challenge.current_day': '第{day}天 · {type}',
    'challenge.today_log': '今日打卡',
    'challenge.makeup_log': '補打卡',
    'challenge.go_log': '去打卡',
    'challenge.example': '示例模板：',
    'challenge.example_content': '分腿墊步練習3組，正手擊球50次，發球練習20分鐘',
    'challenge.complete.title': '🎉 恭喜！你已完成7天挑戰！',
    'challenge.complete.description': '你的球探報告正在生成中，預計1-2分鐘。',
    'challenge.complete.view_report': '查看我的球探報告',
    'challenge.loading_calendar': '載入你的挑戰日曆...',

    // 挑戰重置功能
    'challenge.deadline': '截止時間',
    'challenge.reset_title': '挑戰中斷',
    'challenge.reset_message': '檢測到第{day}天（{date}）未在截止時間前打卡',
    'challenge.reset_detail': '挑戰已中斷，需要重新開始。未審核的記錄將被清除。',
    'challenge.reset_confirm': '重新開始挑戰',
    'challenge.reset_cancel': '取消',
    'challenge.resetting': '重置中...',
    'challenge.reset_success': '挑戰已重置，可以重新開始',
    'challenge.reset_failed': '重置挑戰失敗',
    'challenge.reset_cancelled': '已取消重置',
    'challenge.missed_day_reset': '檢測到漏打卡，挑戰已自動重置',
    'challenge.missed_day_detected': '漏打卡檢測',
    'challenge.missed_guide': '檢測到您有一天未在24小時內打卡，挑戰已中斷。請點擊下方按鈕重新開始。',
    'challenge.missed_tip': '提示：每天記得在24小時內打卡，保持連續記錄！',
    'challenge.reset_now': '立即重新開始',
    'challenge.reset_will_clear': '重置將清除當前進度',
    'challenge.current_progress': '當前進度',
    'challenge.days': '天',

    // 錯誤消息
    'error.required_photos': '請至少上傳一張訓練照片',
    'error.required_content': '請填寫訓練心得',
    'error.max_photos': '最多只能上傳3張照片',
    'error.invalid_format': '只支援 JPG/PNG/WEBP 格式',
    'error.file_too_large': '單張照片不能超過2MB',
    'error.submission_failed': '提交失敗，請重試',
    'error.login_required': '請先登入',
    'error.no_challenge_start_date': '用戶沒有挑戰開始日期',
    'error.check_log_failed': '檢查打卡記錄失敗',
    'error.delete_file_failed': '刪除文件失敗',
    'error.fetch_challenge_failed': '獲取挑戰數據失敗',
    'error.final_submit_failed': '提交失敗，請稍後重試',
    'error.fetch_profile_failed': '獲取個人資料失敗',
    'error.fetch_social_data_failed': '獲取社交數據失敗',
    'error.password_mismatch': '兩次輸入的密碼不一致',
    'error.password_too_short': '密碼至少需要6個字符',
    
    // 註冊頁面
    'register.create_account': '創建你的賬戶',
    'register.email_label': '郵箱地址',
    'register.email_placeholder': 'your@email.com',
    'register.password_label': '密碼',
    'register.password_placeholder': '至少6個字符',
    'register.confirm_password_label': '確認密碼',
    'register.confirm_password_placeholder': '再次輸入密碼',
    'register.registering': '註冊中...',
    'register.register_button': '註冊',
    'register.have_account': '已有賬戶？',
    'register.login_now': '立即登入',
    
    // App.jsx 新增翻译 - 繁体中文
    'app.announcement1': '歡迎來到 Tennis Journey！完成7天挑戰，解鎖你的專屬AI球探報告。',
    'app.announcement2': '社群交流規範：友善互動，分享網球心得，禁止廣告與不當言論。',
    'app.announcement3': '產品願景：幫助每一位網球愛好者記錄成長，連接全球球友。',
    'app.admin': '管理員',
    'app.coming_soon': '此功能正在開發中，敬請期待！',
    'app.community_post_default': '社群帖子 {index}',
  }
}

// 获取当前语言
export const getCurrentLanguage = () => {
  // 1. 优先使用用户保存的语言
  const savedLanguage = localStorage.getItem('preferred_language');
  
  if (savedLanguage && savedLanguage !== 'undefined' && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
    return savedLanguage;
  }

  // 2. 其次根据域名检测
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // 域名检测规则（从具体到一般）
    const domainRules = [
      // 国内版域名
      { pattern: 'tennisjourney.top', language: 'zh' },
      { pattern: 'tennis-journey.vercel.app', language: 'zh' },
      { pattern: 'localhost', language: 'zh' }, // 本地开发默认中文
      { pattern: '127.0.0.1', language: 'zh' },
      
      // 国际版域名
      { pattern: 'tj-7.vercel.app', language: 'en' },
      { pattern: 'tennis-journey-en.vercel.app', language: 'en' },
      
      // 繁体中文版域名
      { pattern: 'tennis-journey-tw.vercel.app', language: 'zh_tw' },
    ];
    
    // 检查域名匹配
    for (const rule of domainRules) {
      if (hostname.includes(rule.pattern)) {
        return rule.language;
      }
    }
    
    // 3. 根据URL路径检测（如果域名不匹配）
    const pathRules = [
      { pattern: '/zh/', language: 'zh' },
      { pattern: '/en/', language: 'en' },
      { pattern: '/zh_tw/', language: 'zh_tw' },
      { pattern: '/tw/', language: 'zh_tw' },
    ];
    
    for (const rule of pathRules) {
      if (pathname.includes(rule.pattern)) {
        return rule.language;
      }
    }
    
    // 4. 根据浏览器语言设置检测
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLanguage = navigator.language.toLowerCase();
      
      // 浏览器语言到应用语言的映射
      const languageMapping = {
        'zh-cn': 'zh',
        'zh-hans': 'zh',
        'zh': 'zh',
        'zh-tw': 'zh_tw',
        'zh-hk': 'zh_tw',
        'zh-mo': 'zh_tw',
        'en': 'en',
        'en-us': 'en',
        'en-gb': 'en',
        'en-au': 'en',
        'en-ca': 'en',
      };
      
      // 检查完全匹配
      if (languageMapping[browserLanguage]) {
        return languageMapping[browserLanguage];
      }
      
      // 检查前缀匹配（如zh-XX）
      for (const [key, value] of Object.entries(languageMapping)) {
        if (browserLanguage.startsWith(key.split('-')[0])) {
          return value;
        }
      }
    }
    
    console.log('⚠️  域名未匹配任何预设规则，使用浏览器语言检测');
  } else {
    console.log('⚠️  window对象未定义（可能是在服务器端渲染）');
  }

  // 5. 最后根据时区/地理位置推断
  if (typeof Intl !== 'undefined') {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // 中国时区使用中文，其他时区使用英文
      if (timeZone.includes('Asia/Shanghai') ||
          timeZone.includes('Asia/Beijing') ||
          timeZone.includes('Asia/Taipei') ||
          timeZone.includes('Asia/Hong_Kong')) {
        return 'zh';
      }
    } catch (error) {
      // 忽略时区检测错误
    }
  }

  // 6. 最终默认：简体中文（主要用户群体）
  return 'zh';
};

// 设置语言
export function setLanguage(lang) {
  console.log('🔄 setLanguage被调用，目标语言:', lang);
  console.log('  - 支持的语言列表:', Object.keys(SUPPORTED_LANGUAGES));
  console.log('  - 请求的语言是否支持:', SUPPORTED_LANGUAGES[lang] ? '是' : '否');
  
  if (SUPPORTED_LANGUAGES[lang]) {
    console.log('✅ 设置语言到localStorage:', lang);
    localStorage.setItem('preferred_language', lang);
    
    // 触发自定义事件，让 useTranslation hook 可以监听
    console.log('📢 触发languageChanged事件');
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    
    // 强制刷新让所有组件重新渲染
    console.log('🔄 刷新页面以应用语言更改');
    window.location.reload();
  } else {
    console.error('❌ 不支持的语言:', lang);
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
import { useState, useEffect, useCallback } from 'react';

export function useTranslation() {
  const initialLanguage = getCurrentLanguage();
  console.log('🎯 useTranslation初始化，当前语言:', initialLanguage);
  
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);

  // 监听语言变化
  useEffect(() => {
    console.log('👂 useTranslation开始监听语言变化');
    
    const handleLanguageChange = () => {
      console.log('📡 收到languageChanged事件');
      const newLang = getCurrentLanguage();
      console.log('🔄 更新当前语言状态:', newLang);
      setCurrentLanguage(newLang);
    };

    // 监听 localStorage 变化（来自其他标签页）
    const handleStorageChange = (e) => {
      console.log('💾 storage事件:', e.key, '=', e.newValue);
      if (e.key === 'preferred_language') {
        console.log('🔄 检测到preferred_language变化，更新语言状态');
        const newLang = getCurrentLanguage();
        setCurrentLanguage(newLang);
      }
    };

    // 监听自定义事件（来自当前标签页的 setLanguage 调用）
    window.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      console.log('🧹 useTranslation清理监听器');
      window.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 包装 setLanguage 函数，更新状态
  const handleSetLanguage = useCallback((lang) => {
    console.log('🎯 useTranslation.handleSetLanguage被调用，语言:', lang);
    // 直接调用我们之前定义的setLanguage函数
    setLanguage(lang);
  }, []);

  // 包装 t 函数，使用当前语言
  const tFunction = useCallback((key, params = {}) => {
    const lang = currentLanguage;
    let translation = translations[lang]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
    
    // 替换参数
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  }, [currentLanguage]);

  return {
    t: tFunction,
    currentLanguage,
    setLanguage: handleSetLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
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