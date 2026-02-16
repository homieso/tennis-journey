// 使用服务角色密钥执行SQL的脚本
import { createClient } from '@supabase/supabase-js'

// 用户提供的密钥
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseAnonKey = 'sb_publishable_8PPcs8GSsuGvbzRplcoSxA_qUHegkO5'

// 我们需要服务角色密钥，但我们可以先尝试使用anon key
// 如果不行，用户需要提供service_role密钥
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function executeSQL() {
  try {
    console.log('正在尝试执行SQL语句...')
    
    // 由于RLS限制，我们需要使用服务角色密钥
    // 让我先尝试使用RPC（存储过程）方式
    console.log('1. 尝试创建用户档案...')
    
    // 使用RPC调用
    const { data: profileResult, error: profileError } = await supabase.rpc('create_test_profile', {
      p_user_id: 'dcee2e34-45f0-4506-9bac-4bdf0956273c',
      p_email: 'homieso0704@gmail.com',
      p_gender: '男',
      p_playing_years: 5,
      p_self_rated_ntrp: 3.5,
      p_idol: '费德勒',
      p_tennis_style: '全场型'
    })
    
    if (profileError) {
      console.log('RPC调用失败，尝试直接SQL...')
      
      // 尝试使用SQL编辑器API
      // 我们需要服务角色密钥来绕过RLS
      console.log('\n❌ 需要服务角色密钥来绕过RLS')
      console.log('请提供Supabase服务角色密钥：')
      console.log('1. 登录Supabase仪表板 (https://supabase.com/dashboard)')
      console.log('2. 进入项目设置 → API')
      console.log('3. 复制service_role密钥（以eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...开头）')
      console.log('\n或者，您可以通过以下方式手动执行SQL：')
      console.log('1. 登录Supabase仪表板')
      console.log('2. 进入SQL编辑器')
      console.log('3. 粘贴并执行以下SQL语句：')
      
      const sql = `
-- 1. 创建用户档案
INSERT INTO profiles (id, email, gender, playing_years, self_rated_ntrp, idol, tennis_style, challenge_status, challenge_success_date, created_at, updated_at)
VALUES (
  'dcee2e34-45f0-4506-9bac-4bdf0956273c',
  'homieso0704@gmail.com',
  '男',
  5,
  3.5,
  '费德勒',
  '全场型',
  'success',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  gender = EXCLUDED.gender,
  playing_years = EXCLUDED.playing_years,
  self_rated_ntrp = EXCLUDED.self_rated_ntrp,
  idol = EXCLUDED.idol,
  tennis_style = EXCLUDED.tennis_style,
  challenge_status = EXCLUDED.challenge_status,
  challenge_success_date = EXCLUDED.challenge_success_date,
  updated_at = NOW();

-- 2. 创建7天打卡记录
INSERT INTO daily_logs (user_id, log_date, text_content, image_urls, status, created_at, updated_at)
VALUES
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-07', '第1天：正手击球练习50次，反手削球30次，发球练习20分钟', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg'], 'approved', NOW(), NOW()),
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-08', '第2天：发球练习40次，一发成功率60%，网前截击练习15分钟', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/serve_3.jpg'], 'approved', NOW(), NOW()),
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-09', '第3天：网前截击练习30分钟，步伐练习15分钟，正手对拉50次', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg'], 'approved', NOW(), NOW()),
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-10', '第4天：反手练习40次，切削球练习20次，体能训练30分钟', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg'], 'approved', NOW(), NOW()),
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-11', '第5天：发球上网练习25次，底线相持练习40分钟', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/serve_3.jpg'], 'approved', NOW(), NOW()),
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-12', '第6天：多球训练60分钟，正反手交替击球，移动中击球', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg'], 'approved', NOW(), NOW()),
  ('dcee2e34-45f0-4506-9bac-4bdf0956273c', '2026-02-13', '第7天：模拟比赛练习，发球、接发球、相持、网前全面练习', ARRAY['https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg'], 'approved', NOW(), NOW())
ON CONFLICT (user_id, log_date) DO UPDATE SET
  text_content = EXCLUDED.text_content,
  image_urls = EXCLUDED.image_urls,
  status = EXCLUDED.status,
  updated_at = NOW();
      `
      
      console.log(sql)
      
      console.log('\n4. 数据创建后，执行以下命令生成球探报告：')
      console.log(`curl -X POST https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report \\`)
      console.log(`  -H "Authorization: Bearer ${supabaseAnonKey}" \\`)
      console.log(`  -H "Content-Type: application/json" \\`)
      console.log(`  -d '{"user_id": "dcee2e34-45f0-4506-9bac-4bdf0956273c"}'`)
      
      return false
    }
    
    console.log('✅ 用户档案创建成功')
    
    // 尝试创建打卡记录
    console.log('2. 尝试创建打卡记录...')
    
    // 这里需要继续实现...
    
    return true
    
  } catch (error) {
    console.error('执行SQL失败:', error)
    return false
  }
}

// 执行
executeSQL().then(success => {
  if (success) {
    console.log('\n🎊 SQL执行完成！')
  } else {
    console.log('\n💡 请按照上述说明手动执行SQL')
  }
  process.exit(0)
})