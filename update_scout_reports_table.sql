-- 更新scout_reports表以支持结构化报告
-- 使用Supabase SQL编辑器执行此脚本

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

-- 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'scout_reports' 
ORDER BY ordinal_position;