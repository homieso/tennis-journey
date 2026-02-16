-- 为profiles表添加用户名/昵称和个人签名字段
-- 使用Supabase SQL编辑器执行此脚本

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

-- 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;