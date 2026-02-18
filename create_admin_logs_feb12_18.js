// 为管理员账号生成7天打卡记录（2月12日-18日）
import { createClient } from '@supabase/supabase-js'

// Supabase 配置（使用服务角色密钥）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 管理员 UUID
const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

// 创建具有 service_role 权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 日期范围：2026年2月12日至18日（共7天）
const startDate = new Date('2026-02-12')
const days = 7

// 每天的训练日志内容（英文）
const dailyContents = [
  "Focus on serve technique today. Practiced 100 serves with emphasis on toss consistency.",
  "Backhand slice drills for 45 minutes. Working on keeping the ball low and deep.",
  "Footwork agility ladder drills. Improving lateral movement for net approaches.",
  "Match play practice. Focused on point construction and mental toughness.",
  "Forehand topspin consistency drills. Hit 200 cross-court forehands.",
  "Volley and overhead practice at the net. Worked on quick reflex reactions.",
  "Full match simulation. Applied all techniques learned throughout the week."
]

// 示例图片链接（可选）
const exampleImageUrls = [
  'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg',
  'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg',
  'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/serve_3.jpg'
]

async function createDailyLogs() {
  console.log(`开始为管理员 ${ADMIN_UUID} 创建7天打卡记录...`)
  console.log(`日期范围: ${startDate.toISOString().split('T')[0]} 至 ${new Date(startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`)
  
  const logs = []
  
  for (let i = 0; i < days; i++) {
    const logDate = new Date(startDate)
    logDate.setDate(startDate.getDate() + i)
    const logDateStr = logDate.toISOString().split('T')[0]
    
    // 为每天创建记录
    logs.push({
      user_id: ADMIN_UUID,
      log_date: logDateStr,
      text_content: dailyContents[i],
      image_urls: [exampleImageUrls[i % exampleImageUrls.length]], // 循环使用示例图片
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    console.log(`  Day ${i + 1} (${logDateStr}): ${dailyContents[i]}`)
  }
  
  try {
    // 批量插入打卡记录
    console.log('\n正在插入 daily_logs 记录...')
    const { data: insertedLogs, error: logsError } = await supabase
      .from('daily_logs')
      .upsert(logs, { onConflict: ['user_id', 'log_date'] })
      .select()
    
    if (logsError) {
      console.error('❌ 插入打卡记录失败:', logsError)
      return false
    }
    
    console.log(`✅ 成功插入 ${insertedLogs?.length || 0} 条打卡记录`)
    
    // 验证插入结果
    console.log('\n验证插入结果...')
    const { data: verifiedLogs, error: verifyError } = await supabase
      .from('daily_logs')
      .select('id, log_date, status')
      .eq('user_id', ADMIN_UUID)
      .eq('status', 'approved')
      .gte('log_date', startDate.toISOString().split('T')[0])
      .lte('log_date', new Date(startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    if (verifyError) {
      console.error('❌ 验证数据失败:', verifyError)
      return false
    }
    
    console.log(`✅ 验证通过：管理员有 ${verifiedLogs.length} 条已审核的打卡记录`)
    verifiedLogs.forEach(log => console.log(`    - ${log.log_date}: ${log.status}`))
    
    // 检查是否满足7天
    if (verifiedLogs.length >= 7) {
      console.log('🎉 管理员已完成7天打卡，可以生成球探报告！')
    } else {
      console.warn(`⚠️  警告：只有 ${verifiedLogs.length} 条记录，未达到7天`)
    }
    
    // 更新用户挑战状态
    console.log('\n更新用户挑战状态...')
    const successDate = new Date('2026-02-18').toISOString().split('T')[0]
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        challenge_status: 'completed',
        challenge_success_date: successDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', ADMIN_UUID)
    
    if (profileError) {
      console.error('❌ 更新用户挑战状态失败:', profileError)
      // 继续执行，不中断
    } else {
      console.log('✅ 用户挑战状态已更新为 completed')
      console.log(`✅ 挑战成功日期: ${successDate}`)
    }
    
    // 最终验证
    console.log('\n最终验证...')
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('challenge_status, challenge_success_date')
      .eq('id', ADMIN_UUID)
      .single()
    
    if (!finalError && finalProfile) {
      console.log(`✅ 最终状态: challenge_status=${finalProfile.challenge_status}, success_date=${finalProfile.challenge_success_date}`)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 创建打卡记录过程中发生错误:', error)
    return false
  }
}

// 执行
createDailyLogs().then(success => {
  if (success) {
    console.log('\n🎊 管理员7天打卡记录创建完成！')
    console.log('📋 下一步：')
    console.log('1. 访问 http://localhost:5174/profile 查看个人主页')
    console.log('2. 访问 http://localhost:5174/scout-report 生成球探报告')
    console.log('3. 访问 http://localhost:5174/community 查看社区')
  } else {
    console.log('\n❌ 创建打卡记录失败')
    process.exit(1)
  }
  process.exit(0)
})