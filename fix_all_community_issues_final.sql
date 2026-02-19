-- Tennis Journey 社区功能终极修复SQL
-- 请在Supabase SQL编辑器中执行此SQL

-- ============================================
-- 1. 修复posts表RLS策略（解决球探报告发布失败问题）
-- ============================================

-- 确保posts表有正确的插入策略
CREATE POLICY IF NOT EXISTS "用户可以创建自己的帖子" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. 创建comments表（支持多级评论）
-- ============================================

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

-- ============================================
-- 3. 评论触发器（自动更新帖子评论数）
-- ============================================

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

-- ============================================
-- 4. 创建comment_likes表（评论点赞功能）
-- ============================================

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

-- ============================================
-- 5. 确保reposts表有正确的RLS策略
-- ============================================

-- 确保reposts表有正确的删除策略
CREATE POLICY IF NOT EXISTS "用户可以删除自己的转发" ON reposts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. 验证所有表结构
-- ============================================

-- 检查posts表结构
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('posts', 'comments', 'comment_likes', 'reposts')
ORDER BY table_name, ordinal_position;

-- ============================================
-- 7. 测试数据插入（可选）
-- ============================================

-- 测试评论功能（取消注释以测试）
/*
-- 插入测试评论
INSERT INTO comments (user_id, post_id, content) 
VALUES (
  'dcee2e34-45f0-4506-9bac-4bdf0956273c', -- 管理员ID
  (SELECT id FROM posts LIMIT 1), -- 第一个帖子
  '测试评论功能！'
);

-- 检查评论是否插入成功
SELECT * FROM comments WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c';
*/

-- ============================================
-- 8. 清理旧数据（如果需要）
-- ============================================

-- 删除可能存在的重复策略
-- DROP POLICY IF EXISTS "允许用户插入帖子" ON posts;
-- DROP POLICY IF EXISTS "允许用户创建帖子" ON posts;

-- ============================================
-- 完成消息
-- ============================================

SELECT '✅ 社区功能修复SQL执行完成！' as message,
       '1. posts表RLS策略已修复' as step1,
       '2. comments表已创建' as step2,
       '3. 评论触发器已创建' as step3,
       '4. comment_likes表已创建' as step4,
       '5. reposts表RLS策略已修复' as step5,
       '现在可以测试转发、评论和球探报告发布功能了！' as next_step;