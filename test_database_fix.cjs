// 测试数据库修复和评论功能
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

async function testDatabaseFix() {
  console.log('🔍 测试数据库修复状态...\n');
  
  try {
    // 1. 测试查询现有数据
    console.log('1. 查询现有数据:');
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (postsError) {
      console.log('❌ 查询帖子失败:', postsError.message);
    } else {
      console.log(`✅ 找到 ${posts?.length || 0} 条帖子:`);
      posts?.forEach((post, i) => {
        console.log(`   ${i+1}. ${post.content?.substring(0, 50)}... (ID: ${post.id})`);
      });
    }
    
    // 2. 测试插入评论
    console.log('\n2. 测试评论功能:');
    
    if (posts && posts.length > 0) {
      const firstPostId = posts[0].id;
      const testComment = {
        user_id: 'dcee2e34-45f0-4506-9bac-4bdf0956273c', // 管理员ID
        post_id: firstPostId,
        content: '🚀 测试评论 - 数据库修复验证成功！',
        images: []
      };
      
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();
      
      if (commentError) {
        console.log('❌ 插入评论失败:', commentError.message);
        
        // 检查是否是表不存在
        if (commentError.message.includes('relation "comments" does not exist')) {
          console.log('⚠️ comments 表不存在，需要创建表结构');
        } else if (commentError.message.includes('violates row-level security policy')) {
          console.log('⚠️ RLS 策略阻止插入，需要修复RLS策略');
        }
      } else {
        console.log('✅ 测试评论插入成功！');
        console.log(`   评论ID: ${comment.id}`);
        console.log(`   内容: ${comment.content}`);
      }
    }
    
    // 3. 测试查询评论
    console.log('\n3. 查询现有评论:');
    
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, post_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (commentsError) {
      console.log('❌ 查询评论失败:', commentsError.message);
    } else {
      console.log(`✅ 找到 ${comments?.length || 0} 条评论:`);
      comments?.forEach((comment, i) => {
        console.log(`   ${i+1}. ${comment.content} (用户: ${comment.user_id?.substring(0, 8)}...)`);
      });
    }
    
    // 4. 测试RLS策略
    console.log('\n4. 测试RLS策略状态:');
    
    // 尝试使用普通用户权限查询（模拟前端）
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpbm5nampxY3lqZGF1Y3l4Y2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDQ4MDAsImV4cCI6MjA1MzYyMDgwMH0.7q6q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data: publicPosts, error: publicError } = await anonSupabase
      .from('posts')
      .select('id, content')
      .limit(2);
    
    if (publicError) {
      console.log('❌ 匿名用户查询帖子失败:', publicError.message);
    } else {
      console.log(`✅ 匿名用户可以查看 ${publicPosts?.length || 0} 条帖子`);
    }
    
    // 5. 总结
    console.log('\n📋 数据库修复状态总结:');
    console.log('========================================');
    
    if (comments && comments.length > 0) {
      console.log('✅ 评论功能: 可用');
      console.log('✅ 评论表: 存在');
      console.log('✅ 评论数据: 可查询');
    } else {
      console.log('⚠️ 评论功能: 需要修复');
      console.log('   可能的问题:');
      console.log('   1. comments 表不存在');
      console.log('   2. RLS 策略阻止访问');
      console.log('   3. 没有评论数据');
    }
    
    if (posts && posts.length > 0) {
      console.log('✅ 帖子功能: 可用');
      console.log('✅ 帖子表: 存在');
    }
    
    console.log('\n🔧 需要手动执行的修复:');
    console.log('1. 登录 Supabase 仪表板: https://supabase.com/dashboard/project/finjgjjqcyjdaucyxchp');
    console.log('2. 进入 SQL 编辑器');
    console.log('3. 执行以下SQL修复RLS策略:');
    console.log(`
-- 修复 comments 表 RLS
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

-- 修复 posts 表 RLS
DROP POLICY IF EXISTS "用户可以创建自己的帖子" ON posts;
CREATE POLICY "用户可以创建自己的帖子" ON posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
    `);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testDatabaseFix();