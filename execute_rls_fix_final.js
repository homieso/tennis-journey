#!/usr/bin/env node

// 执行SQL修复posts表RLS策略
// 使用Supabase REST API执行SQL

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

// 使用服务角色密钥（需要从Supabase仪表板获取）
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('错误：请设置SUPABASE_SERVICE_ROLE_KEY环境变量')
  console.error('可以从Supabase仪表板获取：Project Settings -> API -> service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQL(sql) {
  try {
    console.log('执行SQL:')
    console.log(sql)
    
    // 使用Supabase REST API执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('SQL执行错误:', error)
      return false
    }
    
    console.log('SQL执行成功')
    return true
  } catch (error) {
    console.error('执行SQL时出错:', error)
    return false
  }
}

async function main() {
  console.log('开始修复posts表RLS策略...')
  
  // 1. 确保posts表有正确的插入策略
  const sql1 = `
-- 确保posts表有正确的插入策略
CREATE POLICY IF NOT EXISTS "用户可以创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
`
  
  // 2. 创建comments表（如果不存在）
  const sql2 = `
-- 确保 comments 表结构完整
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
`
  
  // 3. 评论触发器（更新帖子评论数）
  const sql3 = `
-- 创建更新帖子评论数的函数
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

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
`
  
  // 4. 确保comment_likes表存在
  const sql4 = `
-- 创建comment_likes表（如果不存在）
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 启用RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许所有人查看评论点赞" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论点赞" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论点赞" ON comment_likes FOR DELETE USING (auth.uid() = user_id);
`
  
  try {
    console.log('步骤1: 修复posts表RLS策略...')
    const success1 = await executeSQL(sql1)
    
    console.log('步骤2: 创建comments表...')
    const success2 = await executeSQL(sql2)
    
    console.log('步骤3: 创建评论触发器...')
    const success3 = await executeSQL(sql3)
    
    console.log('步骤4: 创建comment_likes表...')
    const success4 = await executeSQL(sql4)
    
    if (success1 && success2 && success3 && success4) {
      console.log('✅ 所有SQL修复执行成功！')
      console.log('✅ posts表RLS策略已修复')
      console.log('✅ comments表已创建')
      console.log('✅ 评论触发器已创建')
      console.log('✅ comment_likes表已创建')
    } else {
      console.error('❌ 部分SQL执行失败')
    }
    
  } catch (error) {
    console.error('执行过程中出错:', error)
  }
}

// 检查是否可以直接使用SQL文件
console.log('注意：由于Supabase REST API限制，可能需要通过Supabase仪表板手动执行SQL')
console.log('请将以下SQL复制到Supabase SQL编辑器中执行：')
console.log('')
console.log('1. 修复posts表RLS策略：')
console.log(`
-- 确保posts表有正确的插入策略
CREATE POLICY IF NOT EXISTS "用户可以创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
`)
console.log('')
console.log('2. 创建comments表：')
console.log(`
-- 确保 comments 表结构完整
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
`)
console.log('')
console.log('3. 创建评论触发器：')
console.log(`
-- 创建更新帖子评论数的函数
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

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
`)
console.log('')
console.log('4. 创建comment_likes表：')
console.log(`
-- 创建comment_likes表（如果不存在）
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 启用RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许所有人查看评论点赞" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论点赞" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论点赞" ON comment_likes FOR DELETE USING (auth.uid() = user_id);
`)

// 尝试执行
main().catch(console.error)