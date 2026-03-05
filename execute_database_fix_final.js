// 使用 service_role 密钥执行完整的数据库初始化
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co';
const serviceRoleKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V';

// 创建具有服务角色的客户端
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeDatabaseFix() {
  console.log('🚀 开始执行完整的数据库初始化...');
  
  try {
    // 完整的数据库初始化 SQL
    const sql = `
-- ============================================
-- 1. 确保 profiles 表有正确的 RLS 策略
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户可以查看自己的档案" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的档案" ON profiles;
DROP POLICY IF EXISTS "用户可以插入自己的档案" ON profiles;
DROP POLICY IF EXISTS "允许所有人查看公开档案" ON profiles;

CREATE POLICY "用户可以查看自己的档案" ON profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的档案" ON profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可以插入自己的档案" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许所有人查看公开档案（用于社区显示）
CREATE POLICY "允许所有人查看公开档案" ON profiles 
  FOR SELECT USING (true);

-- ============================================
-- 2. 创建 comments 表（如果不存在）
-- ============================================
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

-- 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
DROP POLICY IF EXISTS "用户可以创建自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以更新自己的评论" ON comments;
DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;

-- 创建新策略
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的评论" ON comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的评论" ON comments 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments 
  FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ============================================
-- 3. 创建评论数更新触发器
-- ============================================
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

-- ============================================
-- 4. 确保 posts 表有正确的 RLS 策略
-- ============================================
DROP POLICY IF EXISTS "用户可以创建自己的帖子" ON posts;
DROP POLICY IF EXISTS "用户可以更新自己的帖子" ON posts;
DROP POLICY IF EXISTS "用户可以删除自己的帖子" ON posts;
DROP POLICY IF EXISTS "允许所有人查看帖子" ON posts;

CREATE POLICY "允许所有人查看帖子" ON posts FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的帖子" ON posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的帖子" ON posts 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的帖子" ON posts 
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. 确保 reposts 表存在且有正确策略
-- ============================================
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看转发" ON reposts;
DROP POLICY IF EXISTS "用户可以创建自己的转发" ON reposts;
DROP POLICY IF EXISTS "用户可以删除自己的转发" ON reposts;

CREATE POLICY "允许所有人查看转发" ON reposts FOR SELECT USING (true);
CREATE POLICY "用户可以创建自己的转发" ON reposts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的转发" ON reposts 
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);

-- ============================================
-- 6. 测试评论插入
-- ============================================
DO $$
DECLARE
  first_post_id UUID;
BEGIN
  -- 获取第一个帖子ID
  SELECT id INTO first_post_id FROM posts LIMIT 1;
  
  IF first_post_id IS NOT NULL THEN
    -- 插入测试评论
    INSERT INTO comments (user_id, post_id, content) 
    VALUES ('dcee2e34-45f0-4506-9bac-4bdf0956273c', first_post_id, '测试评论 - 如果能看到说明修复成功');
    
    RAISE NOTICE '✅ 测试评论插入成功';
  ELSE
    RAISE NOTICE '⚠️ 没有找到帖子，跳过测试评论插入';
  END IF;
END $$;

-- ============================================
-- 7. 验证所有表结构
-- ============================================
SELECT 
  '✅ 数据库初始化完成' as status,
  (SELECT COUNT(*) FROM comments) as comment_count,
  (SELECT COUNT(*) FROM reposts) as repost_count,
  (SELECT COUNT(*) FROM posts) as post_count;
    `;

    console.log('📝 执行数据库初始化SQL...');
    
    // 执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果 exec_sql 函数不存在，使用直接查询
      console.log('⚠️ exec_sql 函数不存在，尝试直接执行SQL...');
      
      // 分割SQL语句并逐个执行
      const sqlStatements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of sqlStatements) {
        try {
          const { error: stmtError } = await supabase.from('_exec_sql').select('*').limit(0);
          if (stmtError) {
            console.log(`执行: ${statement.substring(0, 100)}...`);
            // 这里需要实际执行SQL，但由于Supabase客户端限制，我们只能执行查询
            // 实际执行需要在Supabase仪表板的SQL编辑器中完成
          }
        } catch (err) {
          console.log(`跳过执行: ${err.message}`);
        }
      }
      
      console.log('📋 由于Supabase客户端限制，SQL需要在仪表板中手动执行：');
      console.log('1. 登录 https://supabase.com/dashboard/project/finjgjjqcyjdaucyxchp');
      console.log('2. 进入 SQL 编辑器');
      console.log('3. 复制并执行上面的SQL');
    } else {
      console.log('✅ 数据库初始化成功！');
      console.log('结果:', data);
    }

    // 测试查询功能
    console.log('\n🔍 测试查询功能...');
    
    // 测试查询评论
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(5);
    
    if (commentsError) {
      console.log('❌ 查询评论失败:', commentsError.message);
    } else {
      console.log(`✅ 查询评论成功，找到 ${comments?.length || 0} 条评论`);
    }
    
    // 测试查询帖子
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(5);
    
    if (postsError) {
      console.log('❌ 查询帖子失败:', postsError.message);
    } else {
      console.log(`✅ 查询帖子成功，找到 ${posts?.length || 0} 条帖子`);
    }
    
    // 测试查询转发
    const { data: reposts, error: repostsError } = await supabase
      .from('reposts')
      .select('*')
      .limit(5);
    
    if (repostsError) {
      console.log('❌ 查询转发失败:', repostsError.message);
    } else {
      console.log(`✅ 查询转发成功，找到 ${reposts?.length || 0} 条转发`);
    }

  } catch (error) {
    console.error('❌ 执行数据库修复失败:', error);
  }
}

// 执行修复
executeDatabaseFix();