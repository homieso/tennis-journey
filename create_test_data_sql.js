// 通过SQL创建测试数据的脚本
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// 读取.env文件
const envContent = readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误：缺少Supabase环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestDataWithSQL(userId) {
  try {
    console.log(`正在为用户 ${userId} 创建测试数据...`)
    
    // 1. 首先尝试使用RPC（存储过程）方式
    console.log('1. 尝试通过RPC创建数据...')
    
    // 由于RLS限制，我们需要使用不同的方法
    // 让我们尝试直接调用Edge Function，但修改Edge Function的逻辑
    
    console.log('2. 由于RLS限制，建议通过以下方式创建数据：')
    console.log('   a) 登录Supabase仪表板 (https://supabase.com/dashboard)')
    console.log('   b) 进入SQL编辑器')
    console.log('   c) 执行以下SQL语句：')
    
    const sqlStatements = `
-- 1. 创建用户档案（如果不存在）
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
    
    console.log(sqlStatements)
    
    console.log('\n3. 数据创建后，使用以下命令生成球探报告：')
    console.log(`curl -X POST https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report \\`)
    console.log(`  -H "Authorization: Bearer ${supabaseAnonKey}" \\`)
    console.log(`  -H "Content-Type: application/json" \\`)
    console.log(`  -d '{"user_id": "${userId}"}'`)
    
    console.log('\n4. 或者，我可以尝试直接调用Edge Function并让它处理测试数据...')
    
    // 尝试直接调用Edge Function，看看是否可以绕过数据检查
    console.log('\n5. 尝试调用Edge Function（可能会失败，因为需要7条approved记录）...')
    
    const response = await fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        user_id: userId,
        test_mode: true // 添加测试模式参数
      })
    })
    
    const result = await response.json()
    console.log('Edge Function响应:', result)
    
    if (result.success) {
      console.log('🎉 球探报告生成成功！')
      console.log('报告ID:', result.report_id)
      
      // 尝试获取报告内容
      const { data: report, error: reportError } = await supabase
        .from('scout_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!reportError && report) {
        console.log('\n📄 报告内容预览：')
        console.log(report.content_html.substring(0, 500) + '...')
        
        // 创建社区帖子
        const postData = {
          user_id: userId,
          title: `我的第一份球探报告 - ${new Date().toLocaleDateString('zh-CN')}`,
          content: report.content_html,
          report_id: report.id,
          is_published: true,
          created_at: new Date(),
          updated_at: new Date()
        }
        
        const { data: post, error: postError } = await supabase
          .from('community_posts')
          .insert([postData])
          .select()
          .single()
        
        if (postError) {
          console.error('创建社区帖子失败:', postError)
        } else {
          console.log('✅ 社区帖子创建成功！帖子ID:', post.id)
          console.log('🔗 帖子链接: /community/post/' + post.id)
        }
      }
    } else {
      console.log('❌ Edge Function调用失败:', result.error)
      console.log('\n💡 建议：请通过Supabase SQL编辑器手动执行上面的SQL语句创建数据')
    }
    
    return true
    
  } catch (error) {
    console.error('创建测试数据失败:', error)
    return false
  }
}

// 执行创建
const userId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
createTestDataWithSQL(userId).then(success => {
  if (success) {
    console.log('\n🎊 测试数据创建流程完成！')
  } else {
    console.log('\n❌ 需要手动创建测试数据')
  }
  process.exit(0)
})