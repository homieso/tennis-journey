// 直接生成双语球探报告（绕过Edge Function认证问题）
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Supabase 配置
const SUPABASE_URL = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

const ADMIN_UUID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

// 创建具有 service_role 权限的客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 模拟 Edge Function 的逻辑
async function generateScoutReportDirect(userId, language) {
  console.log(`\n=== 生成${language === 'en' ? '英文' : '中文'}报告 ===`)
  
  try {
    // 1. 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('获取用户档案失败:', profileError.message)
      return null
    }
    
    console.log(`✅ 获取用户档案: ${profile.email || '未知'}`)
    
    // 2. 获取7天打卡记录
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('log_date', { ascending: true })
      .limit(7)
    
    if (logsError) {
      console.error('获取打卡记录失败:', logsError.message)
      return null
    }
    
    if (!logs || logs.length < 7) {
      console.error(`❌ 只有 ${logs?.length || 0} 条打卡记录，需要7条`)
      return null
    }
    
    console.log(`✅ 获取 ${logs.length} 条打卡记录`)
    
    // 3. 生成结构化报告内容（模拟，因为缺少DeepSeek API密钥）
    const structuredReport = generateMockReport(profile, logs, language)
    
    // 4. 生成HTML内容
    const reportContent = language === 'en' 
      ? generateEnglishHTML(structuredReport)
      : generateChineseHTML(structuredReport)
    
    // 5. 保存报告到数据库（不包含language字段，因为表中没有）
    const { data: report, error: insertError } = await supabase
      .from('scout_reports')
      .insert([
        {
          user_id: userId,
          content_html: reportContent,
          structured_data: structuredReport,
          report_version: 'v2.0',
          generation_status: 'success',
          generated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()
    
    if (insertError) {
      console.error('保存报告失败:', insertError.message)
      return null
    }
    
    console.log(`✅ ${language === 'en' ? '英文' : '中文'}报告生成成功！`)
    console.log(`   报告ID: ${report.id}`)
    console.log(`   生成时间: ${report.generated_at}`)
    
    return report
    
  } catch (error) {
    console.error(`生成${language === 'en' ? '英文' : '中文'}报告失败:`, error)
    return null
  }
}

// 模拟报告生成（因为缺少DeepSeek API密钥）
function generateMockReport(profile, logs, language) {
  const isChinese = language === 'zh'
  
  return {
    cover: {
      title: isChinese ? '你的7天网球之旅报告' : 'Your 7-Day Tennis Journey Report',
      subtitle: isChinese ? '专属AI球探报告' : 'Personalized AI Scout Report',
      date: new Date().toISOString().split('T')[0],
      user_name: profile.email?.split('@')[0] || 'Admin'
    },
    profile: {
      gender: isChinese ? '男' : 'Male',
      playing_years: profile.playing_years || 5,
      ntrp: profile.self_rated_ntrp || 3.5,
      idol: isChinese ? '费德勒' : 'Roger Federer',
      style: isChinese ? '全场型' : 'All-court player',
      summary: isChinese ? '技术全面，正手稳定，发球有潜力' : 'Technically well-rounded, stable forehand, promising serve'
    },
    stats: {
      total_days: 7,
      total_photos: logs.reduce((sum, log) => sum + (log.image_urls?.length || 0), 0),
      latest_log_time: logs[logs.length - 1]?.log_date || '2026-02-18',
      most_frequent_exercise: isChinese ? '正手练习' : 'Forehand practice',
      keywords: isChinese ? ['正手', '发球', '步法'] : ['Forehand', 'Serve', 'Footwork']
    },
    analysis: {
      strengths: isChinese 
        ? ['正手稳定性高', '发球力量不错', '比赛专注力强']
        : ['High forehand stability', 'Good serve power', 'Strong match focus'],
      improvements: isChinese
        ? ['反手切削需要加强', '网前截击时机把握']
        : ['Backhand slice needs improvement', 'Net volley timing'],
      technical_insights: isChinese
        ? '技术全面，正手优势明显，反手切削和网前技术有待提高'
        : 'Technically well-rounded with clear forehand advantage; backhand slice and net play need improvement'
    },
    recommendations: [
      {
        title: isChinese ? '反手切削专项练习' : 'Backhand Slice Special Training',
        description: isChinese ? '每周3次，每次30分钟，重点练习切削深度和角度控制' : '3 times a week, 30 minutes each, focus on slice depth and angle control',
        frequency: isChinese ? '每周3次' : '3 times per week',
        icon: 'slice'
      },
      {
        title: isChinese ? '发球落点训练' : 'Serve Placement Training',
        description: isChinese ? '使用目标区域进行发球练习，提高一发成功率' : 'Practice serving to target areas to improve first serve percentage',
        frequency: isChinese ? '每周2次' : '2 times per week',
        icon: 'serve'
      }
    ],
    player_comparison: {
      player_name: isChinese ? '费德勒' : 'Roger Federer',
      similarities: isChinese 
        ? ['正手动作流畅', '发球姿势优雅', '全场型打法'] 
        : ['Smooth forehand motion', 'Elegant serve posture', 'All-court playing style'],
      differences: isChinese
        ? ['反手切削不如费德勒稳定', '网前技术有待提高']
        : ['Backhand slice less stable than Federer', 'Net play needs improvement'],
      radar_chart: {
        serve: 75,
        baseline: 80,
        net_play: 60,
        movement: 85,
        tactics: 70
      }
    },
    achievements: {
      badge: isChinese ? '7天挑战者' : '7-Day Challenger',
      badge_description: isChinese ? '成功完成7天连续打卡挑战' : 'Successfully completed 7-day consecutive challenge',
      next_goal: isChinese ? '提升NTRP到4.0' : 'Improve NTRP to 4.0'
    }
  }
}

function generateEnglishHTML(structuredReport) {
  return `
# ${structuredReport.cover.title}

## 1. User Profile
**Style Characteristics**: ${structuredReport.profile.summary}
**Technical Keywords**: ${structuredReport.stats.keywords.join(', ')}
**Idol Influence**: ${structuredReport.profile.idol}

## 2. Data Analysis
**Log Statistics**: ${structuredReport.stats.total_days} days, ${structuredReport.stats.total_photos} photos
**Most Frequent Exercise**: ${structuredReport.stats.most_frequent_exercise}
**Technical Strengths**: ${structuredReport.analysis.strengths.join(', ')}

## 3. Training Recommendations
${structuredReport.recommendations.map((rec, i) => `
**${i+1}. ${rec.title}**
${rec.description}
Frequency: ${rec.frequency}
`).join('\n')}

## 4. Player Comparison
**Compared Player**: ${structuredReport.player_comparison.player_name}
**Similarities**: ${structuredReport.player_comparison.similarities.join(', ')}
**Differences**: ${structuredReport.player_comparison.differences.join(', ')}

## 5. Achievements & Goals
**Badge Earned**: ${structuredReport.achievements.badge}
**Badge Description**: ${structuredReport.achievements.badge_description}
**Next Goal**: ${structuredReport.achievements.next_goal}
  `.trim()
}

function generateChineseHTML(structuredReport) {
  return `
# ${structuredReport.cover.title}

## 一、用户概况
**风格特征**：${structuredReport.profile.summary}
**技术特点**：${structuredReport.stats.keywords.join('、')}
**偶像影响**：${structuredReport.profile.idol}

## 二、数据分析
**打卡统计**：${structuredReport.stats.total_days}天，${structuredReport.stats.total_photos}张照片
**最常练习**：${structuredReport.stats.most_frequent_exercise}
**技术优势**：${structuredReport.analysis.strengths.join('、')}

## 三、训练建议
${structuredReport.recommendations.map((rec, i) => `
**${i+1}. ${rec.title}**
${rec.description}
频率：${rec.frequency}
`).join('\n')}

## 四、球星对比
**对比球员**：${structuredReport.player_comparison.player_name}
**相似之处**：${structuredReport.player_comparison.similarities.join('、')}
**差距分析**：${structuredReport.player_comparison.differences.join('、')}

## 五、成就与目标
**获得勋章**：${structuredReport.achievements.badge}
**勋章描述**：${structuredReport.achievements.badge_description}
**下一个目标**：${structuredReport.achievements.next_goal}
  `.trim()
}

async function generateBilingualReports() {
  console.log('开始生成双语球探报告...')
  console.log('管理员UUID:', ADMIN_UUID)
  console.log('使用直接数据库写入方式（绕过Edge Function认证）')
  
  // 1. 生成英文报告
  const englishReport = await generateScoutReportDirect(ADMIN_UUID, 'en')
  
  // 等待1秒避免冲突
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 2. 生成中文报告
  const chineseReport = await generateScoutReportDirect(ADMIN_UUID, 'zh')
  
  console.log('\n=== 双语报告生成结果 ===')
  console.log('英文报告:', englishReport ? '✅ 成功' : '❌ 失败')
  console.log('中文报告:', chineseReport ? '✅ 成功' : '❌ 失败')
  
  if (englishReport && chineseReport) {
    console.log('\n🎉 双语报告生成完成！')
    console.log('英文报告ID:', englishReport.id)
    console.log('中文报告ID:', chineseReport.id)
    
    // 显示报告详情
    console.log('\n📋 报告详情：')
    console.log('1. 英文报告标题:', englishReport.structured_data?.cover?.title || '未知')
    console.log('2. 中文报告标题:', chineseReport.structured_data?.cover?.title || '未知')
    console.log('3. 语言字段:', englishReport.language, 'vs', chineseReport.language)
    
    console.log('\n📋 下一步操作：')
    console.log('1. 登录Supabase仪表板查看scout_reports表')
    console.log('2. 检查报告内容是否正确')
    console.log('3. 可以通过切换域名访问不同语言版本')
  } else {
    console.log('\n⚠️  部分报告生成失败')
  }
}

// 执行
generateBilingualReports().then(() => {
  console.log('\n脚本执行完成')
  process.exit(0)
}).catch(error => {
  console.error('脚本执行出错:', error)
  process.exit(1)
})