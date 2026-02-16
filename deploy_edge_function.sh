#!/bin/bash

echo "🚀 部署Edge Function: generate-scout-report"

# 检查是否安装了Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "安装Supabase CLI..."
    npm install -g supabase
fi

# 进入项目目录
cd /Users/homieso/Desktop/tennis-journey

# 部署Edge Function
echo "正在部署Edge Function..."
supabase functions deploy generate-scout-report

echo ""
echo "📋 手动SQL执行步骤："
echo "1. 登录Supabase仪表板：https://supabase.com/dashboard"
echo "2. 进入SQL编辑器"
echo "3. 分别执行以下两个SQL文件："
echo "   - add_profile_fields.sql"
echo "   - update_scout_reports_table.sql"
echo ""
echo "🔗 测试链接："
echo "新报告页面: http://localhost:5174/report/new"
echo "开发服务器: http://localhost:5174/"