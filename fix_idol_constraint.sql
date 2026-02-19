-- 放开 idol 字段约束
-- 在 Supabase SQL Editor 执行此脚本，或通过服务角色执行

-- 删除现有的 CHECK 约束（如果存在）
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_idol_check;

-- 将 idol 字段类型改为 TEXT（如果当前不是 TEXT）
-- 注意：如果已经是 TEXT，此操作无影响；如果为 VARCHAR 等，则改为 TEXT
ALTER TABLE public.profiles ALTER COLUMN idol TYPE TEXT;

-- 验证更改
COMMENT ON COLUMN public.profiles.idol IS '启蒙球星/偶像（自由文本）';