-- 为 posts 表添加 report_id 字段，用于关联球探报告
DO $$
BEGIN
    BEGIN
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES scout_reports(id);
        RAISE NOTICE '已添加 posts.report_id 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'posts.report_id 字段已存在，跳过';
    END;
END $$;

-- 检查字段添加结果
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts'
  AND column_name IN ('is_published', 'published_at', 'report_id')
ORDER BY column_name;