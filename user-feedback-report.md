# 用户反馈与打卡审核报表

**生成时间:** 2026/2/26 15:29:23

## 📈 统计概览

- **过去7天新用户:** 0
- **过去7天打卡记录:** 10
- **待处理反馈:** 0
- **待审核打卡:** 11

### 📊 1. 用户反馈汇总表（待处理）

**无数据**

### 📸 2. 待审核打卡记录

| 打卡日期 | 用户邮箱 | 内容摘要 | 图片信息 | 状态 |
| --- | --- | --- | --- | --- |
| 2026/02/23 08:00 | yumilishiyu@163.com | 食饭 | 📸 1 张图片 | pending |
| 2026/02/22 08:00 | yumilishiyu@163.com | 好gui | 📸 1 张图片 | pending |
| 2026/02/22 08:00 | allyhesmile@hotmail.com | 了解发球的站位和落点区域（对角发球区）。
发球分解：练习抛球（手臂伸直，球在掌心平稳上升）。抛球是最难的，只要求抛得稳。... | 📸 1 张图片 | pending |
| 2026/02/21 08:00 | yumilishiyu@163.com | 小猪王走累了 | 📸 1 张图片 | pending |
| 2026/02/21 08:00 | allyhesmile@hotmail.com | 学习“分腿垫步”：接球前的一个小跳，练习反应。
移动接球：在网前，从中间跑动向右或向左击球。
交叉组合：正手移动击球10... | 📸 1 张图片 | pending |
| 2026/02/20 08:00 | allyhesmile@hotmail.com | 学会双手反拍的基本动作。
了解双手反手握拍（大陆式握拍+另一只手辅助），明白击球点要比正手更靠前。
无球挥拍：双手反手挥... | 📸 1 张图片 | pending |
| 2026/02/20 08:00 | yumilishiyu@163.com | 吃饱喝足 | 📸 1 张图片 | pending |
| 2026/02/19 08:00 | yumilishiyu@163.com | 在健身房练了正手（照片上传不了，只能发零食 | 📸 1 张图片 | pending |
| 2026/02/19 08:00 | allyhesmile@hotmail.com | 学习东方式正手握拍。
无球挥拍分解动作：侧身引拍、降低拍头、向前挥送、随挥至肩膀。做20次。
定点喂球：朋友在网前用手扔... | 📸 1 张图片 | pending |
| 2026/02/18 08:00 | yumilishiyu@163.com | 跑步就算打球的前前前一步了啦 | 📸 1 张图片 | pending |
| 2026/02/18 08:00 | allyhesmile@hotmail.com | 了解网球计分规则：15、30、40；了解单打、双打线的区别。
认识场地：底线、发球线、网前。
球感练习：手持球拍，用拍面... | 📸 1 张图片 | pending |

### 🏆 3. 已完成7天挑战的用户

| 用户邮箱/ID | 用户名 | 挑战完成日期 | 总打卡数 |
| --- | --- | --- | --- |
| dcee2e34... | Homie | 2026/02/18 09:48 | 0 |

## 🔍 图片URL查看说明

如果打卡记录中包含图片URL，可以通过以下方式快速查看：

1. **直接访问URL**: 复制图片URL到浏览器地址栏
2. **Supabase Storage**: 图片存储在Supabase Storage的 `daily-log-images` 桶中
3. **格式**: URL通常为 `https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/daily-log-images/{filename}`

### 当前待审核记录中的图片URL示例

1. **yumilishiyu@163.com** (2026/02/23 08:00):
   - 图片 1: `https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/8badd4d1-395e-43ee-a7bf-8db7f74168e8_2026-02-23_1772015849858_0.jpeg`

2. **yumilishiyu@163.com** (2026/02/22 08:00):
   - 图片 1: `https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/8badd4d1-395e-43ee-a7bf-8db7f74168e8_2026-02-22_1771857277096_0.jpeg`

3. **allyhesmile@hotmail.com** (2026/02/22 08:00):
   - 图片 1: `https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/e2345e7f-2f66-497e-b7e5-a4ccaebbe500_2026-02-22_1772074417752_0.jpg`

## 📋 操作建议

1. **优先处理**: 按时间倒序处理最早的待审核记录
2. **反馈回复**: 及时回复用户反馈，更新 `admin_reply` 字段
3. **打卡审核**: 审核打卡记录，更新 `status` 为 'approved' 或 'rejected'
4. **挑战完成**: 祝贺完成7天挑战的用户
5. **图片审核**: 检查图片内容是否符合社区规范

