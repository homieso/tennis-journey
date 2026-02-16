// 为用户创建测试数据的脚本
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

async function createTestData(userId) {
  try {
    console.log(`正在为用户 ${userId} 创建测试数据...`)
    
    // 1. 首先检查用户是否在auth.users中
    console.log('1. 检查用户认证状态...')
    
    // 2. 创建用户档案（如果不存在）
    console.log('2. 创建用户档案...')
    const profileData = {
      id: userId,
      email: 'homieso0704@gmail.com',
      gender: '男',
      playing_years: 3,
      self_rated_ntrp: 3.5,
      idol: '费德勒',
      tennis_style: '底线型',
      age: 28,
      location: '北京',
      equipment: 'Wilson Blade v9, 天然羊肠线',
      injury_history: '膝盖轻微不适',
      short_term_goal: '提高一发成功率',
      challenge_status: 'in_progress',
      challenge_start_date: '2026-02-07', // 7天前
      created_at: new Date(),
      updated_at: new Date()
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single()
    
    if (profileError) {
      console.error('创建用户档案失败:', profileError)
      return false
    }
    
    console.log('✅ 用户档案创建成功:', profile.email)
    
    // 3. 创建7条已审核的打卡记录
    console.log('3. 创建7条已审核的打卡记录...')
    
    const startDate = new Date('2026-02-07')
    const logs = []
    
    for (let i = 0; i < 7; i++) {
      const logDate = new Date(startDate)
      logDate.setDate(startDate.getDate() + i)
      const logDateStr = logDate.toISOString().split('T')[0]
      
      logs.push({
        user_id: userId,
        log_date: logDateStr,
        text_content: `第${i + 1}天训练：正手练习${50 + i * 10}次，发球练习${20 + i * 5}分钟，垫步练习${3 + i}组`,
        image_urls: [
          `https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg`,
          `https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg`
        ],
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date()
      })
    }
    
    // 批量插入打卡记录
    const { data: insertedLogs, error: logsError } = await supabase
      .from('daily_logs')
      .upsert(logs, { onConflict: ['user_id', 'log_date'] })
      .select()
    
    if (logsError) {
      console.error('创建打卡记录失败:', logsError)
      return false
    }
    
    console.log(`✅ 成功创建 ${insertedLogs.length} 条打卡记录`)
    
    // 4. 验证数据
    console.log('4. 验证数据...')
    
    const { data: verifiedLogs, error: verifyError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
    
    if (verifyError) {
      console.error('验证数据失败:', verifyError)
      return false
    }
    
    console.log(`✅ 验证通过：用户有 ${verifiedLogs.length} 条已审核的打卡记录`)
    
    if (verifiedLogs.length >= 7) {
      console.log('🎉 用户已完成7天打卡，现在可以生成球探报告！')
      
      // 5. 调用Edge Function生成球探报告
      console.log('5. 调用Edge Function生成球探报告...')
      
      const response = await fetch('https://finjgjjqcyjdaucyxchp.supabase.co/functions/v1/generate-scout-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      })
      
      const result = await response.json()
      console.log('Edge Function响应:', result)
      
      if (result.success) {
        console.log('🎉 球探报告生成成功！报告ID:', result.report_id)
        
        // 6. 将报告发布为社区帖子
        console.log('6. 将报告发布为社区帖子...')
        
        const { data: report, error: reportError } = await supabase
          .from('scout_reports')
          .select('*')
          .eq('id', result.report_id)
          .single()
        
        if (!reportError && report) {
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
        console.error('❌ 球探报告生成失败:', result.error)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('创建测试数据失败:', error)
    return false
  }
}

// 执行创建
const userId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
createTestData(userId).then(success => {
  if (success) {
    console.log('\n🎊 所有测试数据创建完成！')
    console.log('📋 下一步：')
    console.log('1. 访问 http://localhost:5174/ 查看首页')
    console.log('2. 访问 http://localhost:5174/profile 查看个人主页')
    console.log('3. 访问 http://localhost:5174/community 查看社区帖子')
  } else {
    console.log('\n❌ 测试数据创建失败')
  }
  process.exit(0)
})