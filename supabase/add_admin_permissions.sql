-- 管理员权限增强脚本
-- 1. 为 posts 表添加 is_announcement 字段（公告标识）
-- 2. 添加管理员删除任意帖子的 RLS 策略
-- 3. 添加管理员更新任意帖子的策略（可选）
-- 在 Supabase SQL Editor 中执行

BEGIN;

-- 1. 添加 is_announcement 字段
DO $$
BEGIN
    BEGIN
        ALTER TABLE posts ADD COLUMN is_announcement BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '已添加 is_announcement 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'is_announcement 字段已存在，跳过';
    END;
END $$;

-- 2. 添加管理员删除任意帖子的策略
DROP POLICY IF EXISTS "允许管理员删除任意帖子" ON posts;
CREATE POLICY "允许管理员删除任意帖子" ON posts
  FOR DELETE USING (
    auth.uid() = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  );

-- 3. 可选：添加管理员更新任意帖子的策略（用于标记公告等）
DROP POLICY IF EXISTS "允许管理员更新任意帖子" ON posts;
CREATE POLICY "允许管理员更新任意帖子" ON posts
  FOR UPDATE USING (
    auth.uid() = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  ) WITH CHECK (
    auth.uid() = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  );

-- 4. 可选：添加管理员插入公告的策略（允许管理员插入任意用户ID的帖子？通常不需要，因为管理员创建帖子时 user_id 是自己的ID）
-- 当前策略“允许用户创建自己的帖子”已足够，因为管理员也是用户。

COMMIT;

-- 验证
SELECT '✅ 管理员权限增强完成' AS status;
SELECT '📊 当前 posts 表列:' AS info, column_name FROM information_schema.columns WHERE table_name = 'posts' ORDER BY ordinal_position;