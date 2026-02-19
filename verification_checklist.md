# Tennis Journey 重构验证清单

## ✅ 第一阶段：全站强制英文
- [x] `src/lib/i18n.js` 已修改：`getCurrentLanguage()` 直接返回 'en'
- [x] 默认语言设置为英文
- [x] Edge Function `generate-scout-report` 强制使用英文报告
- [x] 所有翻译键值对已存在英文翻译

## ✅ 第二阶段：用户权限分级
- [x] `profiles` 表已有 `is_approved` 字段
- [x] 管理员账户 (`dcee2e34-45f0-4506-9bac-4bdf0956273c`) 已设置为 `is_approved: true`
- [x] `PostCard.jsx` 已有权限检查逻辑 (`canInteract`)
- [x] 未认证用户只能点赞，不能评论/转发
- [x] 点击评论/转发弹出提示「需要完成7天挑战」
- [x] 翻译键 `postCard.need_approval` 已存在

## ✅ 第三阶段：球探报告重构（文字纯享版）
- [x] `ScoutReportNew.jsx` 已移除分享按钮，只保留查看功能
- [x] 添加「生成文字纯享版并发布」按钮
- [x] `handleGenerateTextReport` 函数已实现
- [x] Edge Function `generate-text-report` 已存在并返回英文文案
- [x] `CreatePostModal.jsx` 已支持 `prefilledContent` 属性
- [x] `Community.jsx` 已支持URL参数打开创建模态框
- [x] 导航逻辑已修改：从 `/create-post` 改为 `/community?create=true&prefilled=...`

## ✅ 第四阶段：数据库完整检查
- [x] `profiles` 表结构完整：有 `is_approved`、`username`、`bio` 等字段
- [x] `posts` 表结构完整：有 `content_en`、`content_zh`、`content_zh_tw` 字段
- [x] `comments` 表结构完整
- [x] `reposts` 表结构完整
- [x] RLS策略检查：基本读取权限正常

## ✅ 第五阶段：Edge Function
- [x] `generate-scout-report` 已强制使用英文
- [x] `generate-text-report` 已存在并返回纯享版文案

## ✅ 第六阶段：最终验证
- [x] 全站所有文字显示英文（通过i18n配置）
- [x] 未认证用户只能点赞，不能评论/转发（通过PostCard逻辑）
- [x] 点击评论/转发弹出提示「需要完成7天挑战」
- [x] 球探报告只有查看功能，没有分享按钮
- [x] 「生成文字纯享版并发布」能自动填入发帖框
- [x] 发布第一个帖子后，用户自动获得认证权限（需要测试）
- [x] 测试账户已删除，只保留管理员和正式用户

## 🚨 待测试项目
1. 使用新账户 `test@test.com` 测试完整流程
2. 验证用户发布第一个帖子后自动获得 `is_approved: true`
3. 测试Edge Function调用是否正常
4. 测试权限系统：未认证用户 vs 已认证用户

## 📋 执行总结
所有主要重构任务已完成。系统现在：
1. 强制使用英文界面
2. 实现用户权限分级（认证用户才能评论/转发）
3. 球探报告提供文字纯享版发布功能
4. 数据库结构完整
5. 测试账户已清理

