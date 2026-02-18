-- 修复 profiles 表并插入管理员档案
-- 在 Supabase SQL Editor 中执行此脚本

BEGIN;

-- 1. 添加 username 和 bio 列（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE profiles ADD COLUMN username VARCHAR(50);
        RAISE NOTICE '已添加 username 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'username 字段已存在，跳过';
    END;

    BEGIN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        RAISE NOTICE '已添加 bio 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'bio 字段已存在，跳过';
    END;
END $$;

-- 2. 为现有用户设置默认用户名（使用邮箱前缀）
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- 3. 为现有用户设置默认个人签名
UPDATE profiles 
SET bio = '热爱网球，享受每一次击球的快乐！'
WHERE bio IS NULL;

-- 4. 插入管理员档案（如果不存在）
INSERT INTO profiles (
    id,
    email,
    username,
    gender,
    playing_years,
    self_rated_ntrp,
    idol,
    tennis_style,
    location,
    avatar_url,
    challenge_status,
    bio,
    created_at,
    updated_at
)
SELECT 
    'dcee2e34-45f0-4506-9bac-4bdf0956273c',
    'admin@tennisjourney.com',
    'TennisJourney',
    '男', -- 检查约束可能要求 '男' 或 '女'
    10,
    5.0,
    'Roger Federer',
    'All-around',
    'Global',
    '',
    'success',
    'Welcome to Tennis Journey! I''m the community manager.',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
);

-- 5. 确保 RLS 策略允许所有人读取 profiles（如果尚未启用）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- 删除可能存在的旧策略
    DROP POLICY IF EXISTS "允许所有人读取档案" ON profiles;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 创建允许所有人读取的策略
CREATE POLICY "允许所有人读取档案" ON profiles
    FOR SELECT USING (true);

-- 6. 验证结果
SELECT 
    id,
    email,
    username,
    gender,
    playing_years,
    self_rated_ntrp,
    challenge_status
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

COMMIT;

-- 输出成功信息
SELECT '✅ profiles 表修复完成，管理员档案已创建，RLS 策略已更新' AS result;