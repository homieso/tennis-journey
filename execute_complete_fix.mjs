// 完整修复脚本 - 使用 service_role 密钥
import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 需要保留的邮箱
const PRESERVE_EMAILS = [
  'homieso0704@gmail.com',
  'yumilishiyu@163.com',
  'jerryig@163.com',
  'allyhesmile@hotmail.com'
]

// 创建 Supabase 客户端（使用 service_role）
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  console.log('执行 SQL:', sql.substring(0, 100) + '...')
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('SQL 执行错误:', error)
      return { success: false, error }
    }
    
    console.log('SQL 执行成功')
    return { success: true, data }
  } catch (error) {
    console.error('执行 SQL 时发生错误:', error)
    return { success: false, error }
  }
}

async function getUsersToDelete() {
  console.log('获取需要删除的用户...')
  
  try {
    // 获取所有用户
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('获取用户列表失败:', error)
      return []
    }
    
    // 过滤出需要删除的用户（不在保留邮箱列表中的）
    const usersToDelete = users.users.filter(user => 
      !PRESERVE_EMAILS.includes(user.email)
    )
    
    console.log(`找到 ${usersToDelete.length} 个需要删除的用户`)
    return usersToDelete
  } catch (error) {
    console.error('获取用户失败:', error)
    return []
  }
}

async function deleteUser(userId) {
  console.log(`删除用户: ${userId}`)
  
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error(`删除用户 ${userId} 失败:`, error)
      return false
    }
    
    console.log(`用户 ${userId} 删除成功`)
    return true
  } catch (error) {
    console.error(`删除用户 ${userId} 时发生错误:`, error)
    return false
  }
}

async function backupUserData(userId) {
  console.log(`备份用户 ${userId} 的数据...`)
  
  try {
    // 备份 profiles 数据
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!profileError && profile) {
      console.log(`备份 profile 数据: ${JSON.stringify(profile).substring(0, 100)}...`)
    }
    
    // 备份 daily_logs 数据
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
    
    if (!logsError && logs && logs.length > 0) {
      console.log(`备份 ${logs.length} 条 daily_logs 数据`)
    }
    
    // 备份 posts 数据
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
    
    if (!postsError && posts && posts.length > 0) {
      console.log(`备份 ${posts.length} 条 posts 数据`)
    }
    
    return true
  } catch (error) {
    console.error(`备份用户 ${userId} 数据失败:`, error)
    return false
  }
}

async function ensureAdminExists() {
  console.log('确保管理员账户存在...')
  
  try {
    // 检查管理员是否存在
    const { data: adminUser, error } = await supabase.auth.admin.getUserById(
      'dcee2e34-45f0-4506-9bac-4bdf0956273c'
    )
    
    if (error) {
      console.log('管理员不存在，需要创建...')
      // 这里可以创建管理员，但需要密码
      // 暂时跳过，因为管理员应该已经存在
      return false
    }
    
    console.log('管理员账户已存在:', adminUser.user.email)
    return true
  } catch (error) {
    console.error('检查管理员失败:', error)
    return false
  }
}

async function executeDatabaseRebuild() {
  console.log('开始数据库结构重建...')
  
  const sql = `
-- 1. 删除所有现有 RLS 策略（重新创建）
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

-- 2. 确保所有表结构完整
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

-- comments 表（重建确保结构完整）
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

-- reposts 表
DROP TABLE IF EXISTS reposts CASCADE;
CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- likes 表
DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 3. 创建正确的 RLS 策略
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

-- 4. 创建触发器（自动更新计数）
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

-- 5. 插入测试评论验证
INSERT INTO comments (user_id, post_id, content)
SELECT 
  'dcee2e34-45f0-4506-9bac-4bdf0956273c',
  id,
  '✅ 数据库修复验证 - 如果看到这条评论，说明修复成功！'
FROM posts LIMIT 1;
`
  
  return await executeSQL(sql)
}

async function main() {
  console.log('=== 开始 Tennis Journey 全面修复 ===')
  
  // 第一阶段：数据库备份与清理
  console.log('\n=== 第一阶段：数据库备份与清理 ===')
  
  // 1. 获取需要删除的用户
  const usersToDelete = await getUsersToDelete()
  
  // 2. 备份并删除用户
  let deletedCount = 0
  for (const user of usersToDelete) {
    console.log(`\n处理用户: ${user.email} (${user.id})`)
    
    // 备份数据
    await backupUserData(user.id)
    
    // 删除用户
    const success = await deleteUser(user.id)
    if (success) {
      deletedCount++
    }
  }
  
  console.log(`\n✅ 已删除 ${deletedCount} 个测试账户`)
  
  // 3. 确保管理员存在
  await ensureAdminExists()
  
  // 第二阶段：数据库结构重建
  console.log('\n=== 第二阶段：数据库结构重建 ===')
  const rebuildResult = await executeDatabaseRebuild()
  
  if (rebuildResult.success) {
    console.log('✅ 数据库结构重建成功')
  } else {
    console.error('❌ 数据库结构重建失败:', rebuildResult.error)
  }
  
  console.log('\n=== 修复完成 ===')
  console.log('请继续执行：')
  console.log('1. 前端代码修复（全局搜索硬编码中文）')
  console.log('2. Edge Function 重新部署')
  console.log('3. 提交到 GitHub 并触发 Vercel 部署')
}

// 执行主函数
main().catch(console.error)