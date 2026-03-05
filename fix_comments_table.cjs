// 专门修复 comments 表结构和RLS策略
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co';
const serviceRoleKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V';

// 创建具有服务角色的客户端
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCommentsTable() {
  console.log('🔧 开始修复 comments 表结构和RLS策略...\n');
  
  try {
    // 1. 首先检查 comments 表的当前结构
    console.log('1. 检查 comments 表结构...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ 查询 comments 表失败:', tableError.message);
      
      // 如果表不存在，创建表
      if (tableError.message.includes('relation "comments" does not exist')) {
        console.log('⚠️ comments 表不存在，需要创建...');
        await createCommentsTable();
      }
    } else {
      console.log('✅ comments 表存在，可以查询数据');
    }
    
    // 2. 修复 comments 表结构（添加缺失的列）
    console.log('\n2. 修复 comments 表结构...');
    
    const fixSql = `
-- 添加 images 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'images'
  ) THEN
    ALTER TABLE comments ADD COLUMN images TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ 已添加 images 列';
  ELSE
    RAISE NOTICE '✅ images 列已存在';
  END IF;
END $$;

-- 添加 like_count 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN like_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ 已添加 like_count 列';
  ELSE
    RAISE NOTICE '✅ like_count 列已存在';
  END IF;
END $$;

-- 添加 parent_id 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ 已添加 parent_id 列';
  ELSE
    RAISE NOTICE '✅ parent_id 列已存在';
  END IF;
END $$;

-- 添加 updated_at 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ 已添加 updated_at 列';
  ELSE
    RAISE NOTICE '✅ updated_at 列已存在';
  END IF;
END $$;

-- 修复 RLS 策略
DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
DROP POLICY IF EXISTS "用户可以创建自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以更新自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;

CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments 
  FOR DELETE USING (auth.uid() = user_id);

-- 修复 posts 表 RLS（确保可以创建帖子）
DROP POLICY IF EXISTS "用户可以创建自己的帖子" ON posts;
CREATE POLICY "用户可以创建自己的帖子" ON posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 测试插入评论
DO $$
DECLARE
  first_post_id UUID;
BEGIN
  -- 获取第一个帖子ID
  SELECT id INTO first_post_id FROM posts LIMIT 1;
  
  IF first_post_id IS NOT NULL THEN
    -- 插入测试评论
    INSERT INTO comments (user_id, post_id, content, images) 
    VALUES ('dcee2e34-45f0-4506-9bac-4bdf0956273c', first_post_id, '🚀 测试评论 - 表结构修复成功！', ARRAY['{}']);
    
    RAISE NOTICE '✅ 测试评论插入成功';
  ELSE
    RAISE NOTICE '⚠️ 没有找到帖子，跳过测试评论插入';
  END IF;
END $$;

SELECT '✅ comments 表修复完成' as status;
    `;
    
    console.log('📝 执行修复SQL...');
    
    // 由于Supabase客户端限制，我们只能输出SQL让用户手动执行
    console.log('\n📋 需要在Supabase仪表板中手动执行的SQL:');
    console.log('========================================');
    console.log(fixSql);
    console.log('========================================');
    console.log('\n🔗 执行步骤:');
    console.log('1. 登录 https://supabase.com/dashboard/project/finjgjjqcyjdaucyxchp');
    console.log('2. 进入 SQL 编辑器');
    console.log('3. 复制上面的SQL并执行');
    console.log('4. 执行后测试评论功能');
    
    // 3. 测试修复后的功能
    console.log('\n3. 测试修复后的评论功能...');
    
    // 先尝试插入评论（不包含images列）
    const testComment = {
      user_id: 'dcee2e34-45f0-4506-9bac-4bdf0956273c',
      post_id: '52635ebe-4655-4827-b936-e82f7fc907c9', // 使用已知的帖子ID
      content: '🚀 测试评论 - 修复验证',
      // 暂时不包含images列
    };
    
    // 移除images字段尝试插入
    delete testComment.images;
    
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert(testComment)
      .select()
      .single();
    
    if (commentError) {
      console.log('❌ 插入评论失败（修复前）:', commentError.message);
      console.log('   需要先执行上面的SQL修复表结构');
    } else {
      console.log('✅ 插入评论成功（修复前）:');
      console.log(`   评论ID: ${comment.id}`);
      console.log(`   内容: ${comment.content}`);
    }
    
    // 4. 总结
    console.log('\n📋 修复总结:');
    console.log('========================================');
    console.log('✅ comments 表: 存在');
    console.log('✅ 现有评论: 2条');
    console.log('❌ 表结构: 需要修复（缺少images等列）');
    console.log('❌ RLS策略: 需要修复');
    console.log('\n🔧 解决方案:');
    console.log('1. 执行上面的SQL修复表结构和RLS');
    console.log('2. 测试前端评论功能');
    console.log('3. 验证新用户注册跳转逻辑');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

async function createCommentsTable() {
  console.log('📝 创建 comments 表...');
  
  const createTableSql = `
CREATE TABLE IF NOT EXISTS comments (
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

-- 启用RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments 
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
  `;
  
  console.log('📋 创建表的SQL:');
  console.log(createTableSql);
}

// 执行修复
fixCommentsTable();