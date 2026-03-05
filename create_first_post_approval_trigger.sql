-- 首次发帖自动批准触发器
-- 当用户首次发帖时，自动将其is_approved字段设置为true

-- 1. 首先确保is_approved字段存在
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_approved column to profiles table';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'is_approved column already exists';
    END;
END $$;

-- 2. 创建触发器函数：检查用户是否是首次发帖并自动批准
CREATE OR REPLACE FUNCTION auto_approve_on_first_post()
RETURNS TRIGGER AS $$
DECLARE
    post_count INTEGER;
BEGIN
    -- 检查该用户已有的帖子数量（不包括当前正在插入的帖子）
    SELECT COUNT(*) INTO post_count 
    FROM posts 
    WHERE user_id = NEW.user_id;
    
    -- 如果这是用户的第一篇帖子（计数为0），则自动批准
    IF post_count = 0 THEN
        UPDATE profiles 
        SET is_approved = true 
        WHERE id = NEW.user_id;
        
        RAISE NOTICE '用户 % 首次发帖，已自动批准', NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建触发器：在帖子插入后触发
DROP TRIGGER IF EXISTS trigger_auto_approve_on_first_post ON posts;
CREATE TRIGGER trigger_auto_approve_on_first_post
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION auto_approve_on_first_post();

-- 4. 为现有用户创建自动批准（如果已有帖子但未批准）
DO $$
DECLARE
    user_record RECORD;
    post_count INTEGER;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM posts LOOP
        -- 检查用户是否已有帖子
        SELECT COUNT(*) INTO post_count 
        FROM posts 
        WHERE user_id = user_record.user_id;
        
        -- 如果用户有帖子但未批准，则自动批准
        IF post_count > 0 THEN
            UPDATE profiles 
            SET is_approved = true 
            WHERE id = user_record.user_id 
            AND (is_approved IS NULL OR is_approved = false);
            
            RAISE NOTICE '用户 % 已有 % 篇帖子，已自动批准', user_record.user_id, post_count;
        END IF;
    END LOOP;
END $$;

-- 5. 验证触发器创建成功
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_auto_approve_on_first_post';

-- 6. 显示触发器效果预览
SELECT 
    p.id as user_id,
    p.username,
    p.is_approved as current_approval_status,
    COUNT(posts.id) as post_count
FROM profiles p
LEFT JOIN posts ON p.id = posts.user_id
GROUP BY p.id, p.username, p.is_approved
ORDER BY post_count DESC
LIMIT 10;