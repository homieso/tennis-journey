-- 为管理员帖子补充繁体中文内容
-- 在 Supabase SQL Editor 中执行此脚本

BEGIN;

-- 为现有的管理员帖子添加繁体中文内容
UPDATE posts 
SET content_zh_tw = 
  CASE 
    WHEN content LIKE '%欢迎来到 Tennis Journey%' THEN '歡迎來到 Tennis Journey！🏆本產品希望幫助每一位網球愛好者記錄成長，連接全球球友。我是開發者兼社群管理人員 Homie。完成7天挑戰，解鎖你的專屬AI球探報告！'
    WHEN content LIKE '%新用户必读%' THEN '新用戶必讀 📖作為新用戶，希望你完成7天挑戰，審核通過後立即解鎖專屬AI球探報告以及全球網球社群交流平台。7天，遇見更好的自己。'
    WHEN content LIKE '%社区交流规范%' THEN '社群交流規範 🤝友善互動，分享網球心得，禁止廣告與不當言論。讓我們共同維護一個高品質的網球社群。'
    ELSE content_zh_tw
  END
WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
  AND content_zh_tw IS NULL;

-- 验证结果
SELECT 
    id, 
    LEFT(content, 40) as original_content,
    LEFT(content_zh, 40) as content_zh,
    LEFT(content_en, 40) as content_en,
    LEFT(content_zh_tw, 40) as content_zh_tw
FROM posts 
WHERE user_id = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
ORDER BY created_at DESC;

COMMIT;

SELECT '✅ 管理员帖子的繁体中文内容已补充' AS result;