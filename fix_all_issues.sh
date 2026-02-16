#!/bin/bash

echo "🔧 修复所有问题脚本"
echo "======================"

cd /Users/homieso/Desktop/tennis-journey

echo ""
echo "=== 问题1: 数据库字段缺失 ==="
echo "需要手动执行两个SQL脚本："
echo ""
echo "📋 执行步骤："
echo "1. 登录Supabase仪表板：https://supabase.com/dashboard"
echo "2. 进入SQL编辑器"
echo "3. 分别执行以下SQL语句："
echo ""
echo "📄 SQL脚本1: 添加username和bio字段"
cat << 'EOF'
-- 添加username字段（用户名/昵称）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- 添加bio字段（个人签名/简介）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 为现有用户设置默认用户名（使用邮箱前缀）
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- 为现有用户设置默认个人签名
UPDATE profiles 
SET bio = '热爱网球，享受每一次击球的快乐！'
WHERE bio IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
EOF

echo ""
echo "📄 SQL脚本2: 添加球探报告结构化数据字段"
cat << 'EOF'
-- 添加structured_data字段（存储结构化JSON数据）
ALTER TABLE scout_reports 
ADD COLUMN IF NOT EXISTS structured_data JSONB;

-- 添加report_version字段（报告版本）
ALTER TABLE scout_reports 
ADD COLUMN IF NOT EXISTS report_version VARCHAR(10) DEFAULT 'v1.0';

-- 添加shareable_image_url字段（可分享的长图URL）
ALTER TABLE scout_reports 
ADD COLUMN IF NOT EXISTS shareable_image_url TEXT;

-- 添加qr_code_url字段（分享二维码URL）
ALTER TABLE scout_reports 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- 为现有报告设置默认版本
UPDATE scout_reports 
SET report_version = 'v1.0'
WHERE report_version IS NULL;

-- 创建索引以提高JSON查询性能
CREATE INDEX IF NOT EXISTS idx_scout_reports_structured_data ON scout_reports USING GIN (structured_data);
EOF

echo ""
echo "=== 问题2: Edge Function未部署 ==="
echo "使用Personal Access Token部署..."
echo ""
echo "📋 执行步骤："
echo "1. 登录Supabase仪表板：https://supabase.com/dashboard"
echo "2. 进入Edge Functions页面"
echo "3. 选择generate-scout-report函数"
echo "4. 上传文件：supabase/functions/generate-scout-report/index.ts"
echo "5. 点击部署"
echo ""
echo "或者使用CLI（如果已安装）："
echo "export SUPABASE_ACCESS_TOKEN='sbp_e92c31dea20a5e5f6dbc8511dcaad9b22ec8ea84'"
echo "npx supabase functions deploy generate-scout-report --project-ref finjgjjqcyjdaucyxchp"

echo ""
echo "=== 问题3: 多语言切换不生效 ==="
echo "检查i18n.js文件..."
echo ""
echo "📋 检查要点："
echo "1. 确保i18n.js文件存在：src/lib/i18n.js"
echo "2. 确保翻译字典已加载"
echo "3. 确保App.jsx中正确使用了useTranslation()"
echo ""
echo "💡 快速测试：打开浏览器控制台，输入："
echo "   localStorage.setItem('language', 'en')"
echo "   然后刷新页面看是否变成英文"

echo ""
echo "=== 问题4: 球探报告仍是纯文字 ==="
echo "原因分析："
echo "1. 数据库缺少structured_data字段"
echo "2. Edge Function未部署或未返回结构化JSON"
echo "3. 前端路由可能有问题"
echo ""
echo "📋 修复步骤："
echo "1. 先执行上面的SQL脚本2"
echo "2. 部署Edge Function"
echo "3. 触发一次新的报告生成"
echo "4. 访问 http://localhost:5174/report/new 测试"

echo ""
echo "=== 问题5: 社区广场无内容 ==="
echo "✅ 已解决：测试帖子已创建"
echo "帖子ID: 1c104502-e196-4a17-b1ab-9821a5cb98f5"
echo "访问 http://localhost:5174/community 应该能看到内容"

echo ""
echo "=== 启动测试 ==="
echo "1. 启动开发服务器："
echo "   cd /Users/homieso/Desktop/tennis-journey"
echo "   npm run dev"
echo ""
echo "2. 测试链接："
echo "   - 首页: http://localhost:5174/"
echo "   - 新报告: http://localhost:5174/report/new"
echo "   - 社区: http://localhost:5174/community"
echo "   - 个人主页: http://localhost:5174/profile"
echo ""
echo "3. 验证功能："
echo "   ✅ 多语言切换（右上角🌐）"
echo "   ✅ 球探报告分页滑动"
echo "   ✅ 社区帖子显示"
echo "   ✅ 用户名显示"

echo ""
echo "🎯 优先级："
echo "1. 立即：执行两个SQL脚本（必需）"
echo "2. 立即：部署Edge Function（必需）"
echo "3. 然后：启动开发服务器测试"
echo "4. 最后：验证所有功能"

echo ""
echo "📝 注意：SQL脚本必须手动执行，因为Supabase的RPC函数不存在"
echo "Edge Function可以手动部署或使用CLI部署"