# Tennis Journey 产品复盘修复总结

## 已完成的修复

### 1. P0：7天挑战日历不跳转 ✅
**原因**：日曆邏輯本身正確（前一天審核通過 → 當天解鎖），但頁面不會在「從後台返回」時重新拉取數據，所以管理員審核通過後用戶仍看到舊狀態。

**修改**：`src/pages/Challenge.jsx`
- 增加 `window.addEventListener('focus', fetchChallengeData)`，在用戶從後台回到頁面時重新拉取挑戰數據。
- 這樣第2天被審核通過後，用戶切回 App 或刷新後即可看到第3天解鎖。

**無需 SQL 或部署。**

---

### 2. P1：球探报告形式不对（改回分页滑动式）✅
**原因**：`ScoutReportNew` 已具備封面、檔案、打卡數據、技術分析、訓練建議、球星對比、成就、分享等 8 頁，但使用了 `effect="cards"`（卡片堆疊效果），且封面昵稱/日期未與報告、檔案聯動，容易被誤認為「個人主頁截圖」。

**修改**：`src/pages/ScoutReportNew.jsx`
- 將 Swiper 的 `effect="cards"` 改為普通 **slide**（分頁左右滑動），更貼近網易雲/QQ 音樂年度報告的線性滑動體驗。
- 移除對 `EffectCards` 的依賴與樣式引用。
- 封面頁：拉取 `profiles.username`，用於 `structuredData?.cover?.user_name` 的 fallback；日期使用 `report.generated_at` 的 fallback。
- 新增狀態 `reportUserName`，在 fetch 報告後一併拉取檔案並設置，封面顯示「昵稱 + 報告生成日期」。

**無需 SQL。** 報告內容仍來自 `scout_reports.structured_data`（由 Edge Function 的 DeepSeek 生成）。

---

### 3. P2：社区广场无帖子 ✅
**原因**：
1. 報告生成後**沒有自動發帖**：Edge Function 只寫入 `scout_reports` 和更新 `challenge_status`，沒有向 `posts` 表插入記錄。
2. 若未在 Supabase 執行「允許所有人讀取 posts」的 RLS，前端查詢會得到空列表。

**修改**：

- **`supabase/functions/generate-scout-report/index.ts`**
  - 在插入 `scout_reports` 之後：
    - 向 `posts` 表 **insert** 一條記錄：`user_id`、`report_id`、`content`（標題 + 摘要）、`created_at`。
    - 更新該報告：`is_published = true`、`published_at`、`post_id`。
    - 更新該用戶 `profiles`：`membership_valid_until = 當前時間 + 30 天`（與原「發布即得 30 天會員」一致，改為在生成報告時一併發放）。

- **RLS**：沿用既有 `supabase/posts_rls_allow_read.sql`。請在 **Supabase Dashboard → SQL Editor** 中執行該文件，確保有策略：
  - `FOR SELECT USING (true)`，允許所有人讀取帖子。

**你需要做的**：
1. **重新部署 Edge Function**（因為改了 generate-scout-report）：
   ```bash
   supabase functions deploy generate-scout-report
   ```
2. 在 Supabase 執行 `supabase/posts_rls_allow_read.sql`（若尚未執行）。
3. **已有報告但沒有帖子**：目前僅對「新生成的報告」自動建帖。若你希望為**已存在的報告**補一篇帖子，可以：
   - 在 Supabase 表 `posts` 中手動插入一筆（關聯對應的 `report_id` 和 `user_id`），或
   - 在後台提供「一鍵為某報告發帖」的小工具（可後續再加）。

---

### 4. P3：个人主页编辑功能位置不对 ✅
**原因**：昵稱在個人主頁有單獨的「編輯」按鈕，個人簽名無編輯入口；產品希望**所有編輯統一在「編輯檔案」**，進入 Onboarding 後在「基本信息（必填）」中編輯用戶名和個人簽名。

**修改**：

- **`src/pages/Profile.jsx`**
  - 移除昵稱的內聯編輯（狀態、輸入框、保存/取消、`updateProfileUsername` 調用）。
  - 昵稱與個人簽名改為**只讀展示**，僅保留右上角「編輯檔案」按鈕，點擊進入 Onboarding。

- **`src/pages/Onboarding.jsx`**
  - 在「基本信息（必填）」最上方新增：
    - **昵称/用户名**（必填），`name="username"`。
    - **个人签名（选填）**，`name="bio"`。
  - `formData` 增加 `username`、`bio`；`loadProfileData` 從 `profiles` 讀取並寫入 `username`、`bio`。
  - 提交時將 `username`、`bio` 傳給 `updateProfile`（`auth.js` 已支援）。

- **`src/lib/auth.js`**（此前已支援）
  - `updateProfile` 的 update/insert 已包含 `username`、`bio`；無需再改。

**無需 SQL。** 請確認 `profiles` 表已有 `username`、`bio` 欄位（若曾執行過 `add_profile_fields.sql` 則已有）。

---

## 你可能還需要檢查的點

1. **多語言**  
   挑戰頁、打卡頁、報告頁、Onboarding 等若仍有硬編碼中文，可逐步改為 `useTranslation()` + `t('key')`，並在 `src/lib/i18n.js` 補齊對應 key（含 en/zh_tw）。

2. **數據庫**  
   - `profiles`：確保有 `username`、`bio`（以及挑戰、會員相關欄位）。  
   - `scout_reports`：確保有 `structured_data`（JSONB）。  
   - `posts`：確保有 `user_id`、`report_id`、`content`、`created_at` 等，且 RLS 允許 SELECT。

3. **Edge Function 部署**  
   修改了 `generate-scout-report` 後需重新部署，新完成的 7 天挑戰才會自動發帖並發放 30 天會員。

4. **歷史報告補帖**  
   若之前已有生成報告但沒有對應帖子，需在 Supabase 手動補一筆 `posts` 或透過自建小工具批量補帖。

---

## 修改文件一覽

| 文件 | 變更摘要 |
|------|----------|
| `src/pages/Challenge.jsx` | 增加 focus 時重新拉取挑戰數據 |
| `src/pages/ScoutReportNew.jsx` | 改為 slide 效果；封面昵稱/日期與報告、檔案聯動 |
| `src/pages/Profile.jsx` | 移除昵稱內聯編輯，僅展示 + 編輯檔案入口 |
| `src/pages/Onboarding.jsx` | 基本信息增加昵稱（必填）、個人簽名（选填）；load/submit 含 username/bio |
| `supabase/functions/generate-scout-report/index.ts` | 報告生成後自動插入 posts、更新 is_published/post_id、發放 30 天會員 |
| `supabase/posts_rls_allow_read.sql` | 已存在，需在 Supabase 執行以允許讀取帖子 |

---

## 驗證建議

1. **日曆**：用測試帳號完成第 2 天打卡 → 在後台將該日審核通過 → 切到其他 App 再切回或刷新，確認第 3 天解鎖且可點擊。  
2. **報告**：完成 7 天並生成報告後，打開 `/report`，確認為左右分頁滑動、封面為昵稱與報告日期、內容為 AI 結構化報告。  
3. **社區**：執行 RLS SQL 並部署 Edge Function 後，用新完成 7 天的帳號觸發報告生成，確認社區廣場出現對應帖子。  
4. **編輯**：個人主頁僅顯示昵稱/簽名，點「編輯檔案」進入 Onboarding，修改昵稱與個人簽名後保存，返回個人主頁確認展示更新。

如有某一步與預期不符，可說明環境（本地/生產）和具體操作步驟，再針對該點排查。
