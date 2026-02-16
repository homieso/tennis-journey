-- Tennis Journey 意见反馈系统数据库表结构
-- 创建 feedback 表用于存储用户反馈

-- ========================================
-- 1. 创建 feedback 表
-- ========================================

DO $$ 
BEGIN
    -- 如果表已存在，先删除依赖的策略
    DROP POLICY IF EXISTS "允许用户创建自己的反馈" ON feedback;
    DROP POLICY IF EXISTS "允许用户查看自己的反馈" ON feedback;
    DROP POLICY IF EXISTS "允许管理员查看所有反馈" ON feedback;
    DROP POLICY IF EXISTS "允许管理员更新反馈状态" ON feedback;
    
    -- 删除表（如果存在）
    DROP TABLE IF EXISTS feedback CASCADE;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 创建 feedback 表
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  contact VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 添加约束
  CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed'))
);

-- ========================================
-- 2. 启用 RLS
-- ========================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. 创建 RLS 策略
-- ========================================

-- 策略 1: 允许用户创建自己的反馈
CREATE POLICY "允许用户创建自己的反馈" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 策略 2: 允许用户查看自己的反馈
CREATE POLICY "允许用户查看自己的反馈" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- 策略 3: 允许管理员查看所有反馈（需要 admin 角色，这里先放宽为所有登录用户可查看）
-- 实际生产中应根据用户角色进行限制
CREATE POLICY "允许管理员查看所有反馈" ON feedback
  FOR SELECT USING (true);

-- 策略 4: 允许管理员更新反馈状态
CREATE POLICY "允许管理员更新反馈状态" ON feedback
  FOR UPDATE USING (true); -- 实际应根据角色限制

-- ========================================
-- 4. 添加索引以提高查询性能
-- ========================================

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- ========================================
-- 5. 创建触发器函数自动更新 updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_feedback_updated_at ON feedback;
CREATE TRIGGER trigger_update_feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

-- ========================================
-- 6. 添加示例数据（可选）
-- ========================================

INSERT INTO feedback (user_id, title, content, status, created_at) VALUES
  (NULL, '建议添加夜间模式', '希望能在设置中添加深色/夜间模式，晚上使用更护眼。', 'pending', NOW() - INTERVAL '5 days'),
  (NULL, '社区搜索功能', '社区帖子越来越多，建议添加搜索功能，可以按关键词搜索帖子。', 'in_progress', NOW() - INTERVAL '3 days'),
  (NULL, '个人主页优化', '个人主页的社交统计可以更详细一些，比如增加「周活跃度」图表。', 'resolved', NOW() - INTERVAL '1 day'),
  (NULL, '打卡提醒功能', '可以添加每日打卡提醒功能，通过邮件或站内信提醒用户打卡。', 'pending', NOW() - INTERVAL '2 hours');

-- ========================================
-- 7. 验证和输出
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ 反馈系统数据库表结构已创建';
    RAISE NOTICE '✅ feedback 表已创建';
    RAISE NOTICE '✅ RLS 策略已配置';
    RAISE NOTICE '✅ 索引已添加';
    RAISE NOTICE '✅ 触发器已创建';
    
    -- 显示统计信息
    RAISE NOTICE '📊 当前反馈数据:';
    RAISE NOTICE '   - 总反馈数: %', (SELECT COUNT(*) FROM feedback);
    RAISE NOTICE '   - 待处理: %', (SELECT COUNT(*) FROM feedback WHERE status = 'pending');
    RAISE NOTICE '   - 处理中: %', (SELECT COUNT(*) FROM feedback WHERE status = 'in_progress');
    RAISE NOTICE '   - 已解决: %', (SELECT COUNT(*) FROM feedback WHERE status = 'resolved');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ 验证过程中出现错误: %', SQLERRM;
END $$;

-- 执行完成后，请验证表结构是否正确
SELECT '🎉 反馈系统数据库表结构部署完成！' AS status;