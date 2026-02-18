-- 为 daily_logs 表添加 submitted_at 列，用于记录打卡提交时间
-- 以便实现24小时自动解锁下一日逻辑

BEGIN;

-- 如果列不存在则添加
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_logs' AND column_name = 'submitted_at') THEN
        ALTER TABLE daily_logs ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '已添加 submitted_at 列';
    ELSE
        RAISE NOTICE 'submitted_at 列已存在，跳过';
    END IF;
END $$;

-- 为现有记录设置 submitted_at 为 created_at（如果 submitted_at 为空）
UPDATE daily_logs SET submitted_at = created_at WHERE submitted_at IS NULL;

-- 添加索引以加速基于用户和日期的查询
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id_log_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_submitted_at ON daily_logs(submitted_at);

COMMIT;

SELECT '✅ daily_logs 表已更新，支持 submitted_at 列' AS result;