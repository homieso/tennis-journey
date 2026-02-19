-- 紧急修复：数据库 + Edge Function + 前端功能

-- 1. 确保 comments 表存在
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
DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
CREATE POLICY "允许所有人查看评论" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "用户可以创建自己的评论" ON comments;
CREATE POLICY "用户可以创建自己的评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的评论" ON comments;
CREATE POLICY "用户可以更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;
CREATE POLICY "用户可以删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 2. 确保 posts 表有插入策略
DROP POLICY IF EXISTS "用户可以创建自己的帖子" ON posts;
CREATE POLICY "用户可以创建自己的帖子" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 确保 comment_likes 表存在
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 启用 RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 创建策略
DROP POLICY IF EXISTS "允许所有人查看评论点赞" ON comment_likes;
CREATE POLICY "允许所有人查看评论点赞" ON comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "用户可以创建自己的评论点赞" ON comment_likes;
CREATE POLICY "用户可以创建自己的评论点赞" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的评论点赞" ON comment_likes;
CREATE POLICY "用户可以删除自己的评论点赞" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 4. 评论触发器（更新帖子评论数）
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

-- 5. 确保 storage 权限允许图片上传
-- 检查 storage.buckets 表是否存在 'tennis-journey' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tennis-journey', 'tennis-journey', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 为 tennis-journey bucket 设置存储策略
DROP POLICY IF EXISTS "允许所有人读取图片" ON storage.objects;
CREATE POLICY "允许所有人读取图片" ON storage.objects
FOR SELECT USING (bucket_id = 'tennis-journey');

DROP POLICY IF EXISTS "允许认证用户上传图片" ON storage.objects;
CREATE POLICY "允许认证用户上传图片" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'tennis-journey' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "允许用户删除自己的图片" ON storage.objects;
CREATE POLICY "允许用户删除自己的图片" ON storage.objects
FOR DELETE USING (bucket_id = 'tennis-journey' AND auth.uid() = owner);

-- 6. 确保 profiles 表有 preferred_language 字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'zh';

-- 7. 确保 scout_reports 表有正确的字段
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS structured_data JSONB;
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS report_version VARCHAR(20);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS generation_status VARCHAR(20);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- 8. 确保 posts 表有 multilingual 字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_zh TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_zh_tw TEXT;

-- 9. 创建测试数据（可选）
-- INSERT INTO comments (user_id, post_id, content) VALUES 
-- ('dcee2e34-45f0-4506-9bac-4bdf0956273c', 'some-post-id', '测试评论内容');

-- 显示修复结果
SELECT '数据库修复完成' as status;