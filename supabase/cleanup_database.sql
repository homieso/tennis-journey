-- Tennis Journey 数据库清理脚本
-- 清空所有测试数据，重置为纯净状态
-- 请根据需求选择执行以下选项之一

-- ========================================
-- 选项1：激进清理（推荐用于开发环境重置）
-- 清空所有用户生成的内容，保留用户账户
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '开始执行激进清理...';
    
    -- 1. 清空社交互动表（外键约束使用CASCADE）
    RAISE NOTICE '清空 likes 表...';
    TRUNCATE likes CASCADE;
    
    RAISE NOTICE '清空 comments 表...';
    TRUNCATE comments CASCADE;
    
    RAISE NOTICE '清空 reposts 表...';
    TRUNCATE reposts CASCADE;
    
    RAISE NOTICE '清空 follows 表...';
    TRUNCATE follows CASCADE;
    
    -- 2. 清空反馈表
    RAISE NOTICE '清空 feedback 表...';
    TRUNCATE feedback CASCADE;
    
    -- 3. 删除所有帖子
    RAISE NOTICE '删除所有帖子...';
    DELETE FROM posts;
    
    -- 4. 清空球探报告表
    RAISE NOTICE '清空球探报告...';
    DELETE FROM scout_reports;
    
    -- 5. 清空打卡记录
    RAISE NOTICE '清空打卡记录...';
    DELETE FROM daily_logs;
    
    -- 6. 重置用户档案挑战状态
    RAISE NOTICE '重置用户挑战状态...';
    UPDATE profiles 
    SET challenge_status = 'not_started', 
        challenge_start_date = NULL,
        membership_valid_until = NULL,
        -- 可选：重置用户自定义字段
        username = COALESCE(username, NULL),  -- 保持已有用户名
        bio = NULL,
        age = NULL,
        location = NULL,
        equipment = NULL,
        injury_history = NULL,
        short_term_goal = NULL;
    
    RAISE NOTICE '✅ 激进清理完成！';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ 清理过程中出现错误: %', SQLERRM;
    RAISE NOTICE '请检查外键约束或表是否存在。';
END $$;

-- ========================================
-- 选项2：保守清理（保留报告生成的帖子）
-- 仅删除手动添加的测试数据
-- ========================================

-- 注释掉以下DO块如果不需要
/*
DO $$ 
BEGIN
    RAISE NOTICE '开始执行保守清理...';
    
    -- 1. 清空社交互动表
    TRUNCATE likes CASCADE;
    TRUNCATE comments CASCADE;
    TRUNCATE reposts CASCADE;
    TRUNCATE follows CASCADE;
    
    -- 2. 清空反馈表
    TRUNCATE feedback CASCADE;
    
    -- 3. 删除手动添加的测试帖子（没有关联报告的帖子）
    DELETE FROM posts WHERE report_id IS NULL;
    
    -- 4. 重置用户档案挑战状态
    UPDATE profiles 
    SET challenge_status = 'not_started', 
        challenge_start_date = NULL;
    
    RAISE NOTICE '✅ 保守清理完成！';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ 清理过程中出现错误: %', SQLERRM;
END $$;
*/

-- ========================================
-- 清理后验证
-- ========================================

DO $$ 
DECLARE
    likes_count INT;
    comments_count INT;
    reposts_count INT;
    follows_count INT;
    feedback_count INT;
    posts_count INT;
    reports_count INT;
    logs_count INT;
BEGIN
    -- 统计清理后的数据量
    SELECT COUNT(*) INTO likes_count FROM likes;
    SELECT COUNT(*) INTO comments_count FROM comments;
    SELECT COUNT(*) INTO reposts_count FROM reposts;
    SELECT COUNT(*) INTO follows_count FROM follows;
    SELECT COUNT(*) INTO feedback_count FROM feedback;
    SELECT COUNT(*) INTO posts_count FROM posts;
    SELECT COUNT(*) INTO reports_count FROM scout_reports;
    SELECT COUNT(*) INTO logs_count FROM daily_logs;
    
    RAISE NOTICE '📊 清理后数据统计:';
    RAISE NOTICE '   - likes: %', likes_count;
    RAISE NOTICE '   - comments: %', comments_count;
    RAISE NOTICE '   - reposts: %', reposts_count;
    RAISE NOTICE '   - follows: %', follows_count;
    RAISE NOTICE '   - feedback: %', feedback_count;
    RAISE NOTICE '   - posts: %', posts_count;
    RAISE NOTICE '   - scout_reports: %', reports_count;
    RAISE NOTICE '   - daily_logs: %', logs_count;
    
    -- 检查用户档案状态
    RAISE NOTICE '👥 用户档案状态:';
    RAISE NOTICE '   - 总用户数: %', (SELECT COUNT(*) FROM profiles);
    RAISE NOTICE '   - 挑战进行中: %', (SELECT COUNT(*) FROM profiles WHERE challenge_status = 'in_progress');
    RAISE NOTICE '   - 挑战未开始: %', (SELECT COUNT(*) FROM profiles WHERE challenge_status = 'not_started');
END $$;

-- ========================================
-- 重要提示
-- ========================================

-- 1. 执行前请确保已备份重要数据
-- 2. 建议在非生产环境执行
-- 3. 执行后重启应用以确保缓存更新
-- 4. 如果有外键约束错误，请检查表结构是否完整

SELECT '🎉 数据库清理脚本已准备就绪！请根据需求执行相应选项。' AS status;