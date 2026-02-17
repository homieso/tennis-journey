-- Tennis Journey 帖子多语言支持迁移脚本
-- 为 posts 表添加多语言字段，并更新管理员公告的英文版本
-- 执行顺序：在 Supabase SQL Editor 中按顺序执行

BEGIN;

-- 1. 添加多语言字段（如果不存在）
DO $$
BEGIN
    BEGIN
        ALTER TABLE posts ADD COLUMN content_zh TEXT;
        RAISE NOTICE '已添加 content_zh 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'content_zh 字段已存在，跳过';
    END;

    BEGIN
        ALTER TABLE posts ADD COLUMN content_en TEXT;
        RAISE NOTICE '已添加 content_en 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'content_en 字段已存在，跳过';
    END;

    BEGIN
        ALTER TABLE posts ADD COLUMN content_zh_tw TEXT;
        RAISE NOTICE '已添加 content_zh_tw 字段';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'content_zh_tw 字段已存在，跳过';
    END;
END $$;

-- 2. 将现有中文内容复制到 content_zh（仅管理员帖子）
UPDATE posts 
SET content_zh = content 
WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c' 
  AND content_zh IS NULL;

-- 3. 为管理员帖子填充英文内容（基于现有中文内容）
UPDATE posts 
SET content_en = 
  CASE 
    WHEN content LIKE '%欢迎来到 Tennis Journey%' THEN 'Welcome to Tennis Journey! 🏆This product aims to help every tennis enthusiast record their growth and connect with global tennis friends. I am Homie, the developer and community manager. Complete the 7-day challenge to unlock your exclusive AI scout report!'
    WHEN content LIKE '%新用户必读%' THEN 'New User Guide 📖Complete the 7-day challenge to unlock your exclusive AI scout report and the global tennis community platform. 7 days, a better version of yourself.'
    WHEN content LIKE '%社区交流规范%' THEN 'Community Guidelines 🤝Friendly interaction, share tennis experiences, no advertisements or inappropriate言论. Let''s maintain a high-quality tennis community together.'
    ELSE content_en
  END
WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  AND content_en IS NULL;

-- 4. 为未来帖子设置默认值：如果 content 字段有值但多语言字段为空，则复制到 content_zh
UPDATE posts 
SET content_zh = COALESCE(content_zh, content)
WHERE content IS NOT NULL AND content_zh IS NULL;

-- 5. 创建视图或函数（可选）以简化前端查询
CREATE OR REPLACE FUNCTION get_post_content_by_lang(post_id UUID, lang_code TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    selected_lang TEXT;
    result TEXT;
BEGIN
    -- 如果未提供语言代码，尝试从当前用户设置或浏览器语言获取
    IF lang_code IS NULL THEN
        selected_lang := 'zh'; -- 默认简体中文
    ELSE
        selected_lang := lang_code;
    END IF;

    SELECT 
        CASE selected_lang
            WHEN 'zh' THEN content_zh
            WHEN 'en' THEN content_en
            WHEN 'zh_tw' THEN content_zh_tw
            ELSE content
        END
    INTO result
    FROM posts
    WHERE id = post_id;

    RETURN COALESCE(result, (SELECT content FROM posts WHERE id = post_id));
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- 6. 验证结果
SELECT 
    id, 
    user_id, 
    LEFT(content, 30) as original_content,
    LEFT(content_zh, 30) as content_zh,
    LEFT(content_en, 30) as content_en,
    LEFT(content_zh_tw, 30) as content_zh_tw
FROM posts 
WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
ORDER BY created_at DESC;