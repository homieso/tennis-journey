# Supabase SQL 执行指南

## 步骤1：登录Supabase Dashboard
1. 访问 https://app.supabase.com/
2. 登录账号
3. 选择 `finjgjjqcyjdaucyxchp` 项目

## 步骤2：执行SQL脚本
1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 复制以下SQL并执行：

```sql
-- 第一阶段：清理测试用户数据（先删除关联数据）
-- 注意：需要先删除关联数据，然后才能删除用户

-- 1. 删除测试用户的关联数据
DELETE FROM daily_logs WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN (
    'homieso0704@gmail.com',
    'yumilishiyu@163.com',
    'jerryig@163.com',
    'allyhesmile@hotmail.com'
  )
);

DELETE FROM posts WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN (
    'homieso0704@gmail.com',
    'yumilishiyu@163.com',
    'jerryig@163.com',
    'allyhesmile@hotmail.com'
  )
);

DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN (
    'homieso0704@gmail.com',
    'yumilishiyu@163.com',
    'jerryig@163.com',
    'allyhesmile@hotmail.com'
  )
);
```

## 步骤3：执行数据库重建SQL
执行以下完整SQL脚本：

```sql
-- 2. 删除所有现有 RLS 策略（重新创建）
DO $$ DECLARE
  pol_record RECORD;
BEGIN
  FOR pol_record IN 
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_record.policyname, pol_record.tablename);
  END LOOP;
END $$;

-- 3. 确保所有表结构完整
-- profiles 表
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- posts 表
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS content_zh TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS content_zh_tw TEXT,
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repost_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES scout_reports(id);

-- 4. comments 表（重建确保结构完整）
DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. reposts 表
DROP TABLE IF EXISTS reposts CASCADE;
CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. likes 表
DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 7. 创建正确的 RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人查看公开档案" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户可以查看自己的档案" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的档案" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可以插入自己的档案" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人查看帖子" ON posts FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的帖子" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的帖子" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的帖子" ON posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人查看转发" ON reposts FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的转发" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的转发" ON reposts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人查看点赞" ON likes FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的点赞" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的点赞" ON likes FOR DELETE USING (auth.uid() = user_id);

-- 8. 创建触发器（自动更新计数）
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- 9. 插入测试评论验证
INSERT INTO comments (user_id, post_id, content)
SELECT 
  'dcee2e34-45f0-4506-9bac-4bdf0956273c',
  id,
  '✅ 数据库修复验证 - 如果看到这条评论，说明修复成功！'
FROM posts LIMIT 1;

-- 10. 验证修复结果
SELECT '✅ 数据库修复完成' as status;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'posts', 'comments', 'reposts', 'likes')
ORDER BY table_name;
```

## 步骤4：验证结果
执行后应该看到：
1. "✅ 数据库修复完成" 状态
2. 各表的列数和策略数统计

## 步骤5：手动删除剩余测试用户
在Supabase Dashboard中：
1. 点击 **Authentication** → **Users**
2. 删除以下测试用户（保留4个指定用户）：
   - homieso@cchengholdings.com
   - 384373358@qq.com
   - 其他所有测试账户

## 注意事项
1. 执行SQL前建议备份重要数据
2. 确保只删除测试用户，保留：
   - homieso0704@gmail.com (管理员)
   - yumilishiyu@163.com
   - jerryig@163.com
   - allyhesmile@hotmail.com
3. 如果遇到外键约束错误，可能需要调整删除顺序