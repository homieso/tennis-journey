import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { user_id, test_mode } = await req.json()
    
    // 检测域名，决定报告语言
    const origin = req.headers.get('origin') || req.headers.get('referer') || ''
    const isChineseDomain = origin.includes('tennisjourney.top')
    const isEnglishDomain = origin.includes('tj-7.vercel.app')
    // 默认根据域名决定语言，如果没有域名信息则使用中文
    const reportLanguage = isEnglishDomain ? 'en' : 'zh'
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError) {
      // 如果是测试模式，创建模拟档案
      if (test_mode) {
        console.log('测试模式：创建模拟用户档案')
        const mockProfile = {
          id: user_id,
          email: 'test@example.com',
          gender: '男',
          playing_years: 5,
          self_rated_ntrp: 3.5,
          idol: '费德勒',
          tennis_style: '全场型',
          age: 28,
          location: '北京',
          equipment: 'Wilson Blade v9',
          injury_history: '无',
          short_term_goal: '提高比赛稳定性'
        }
        // 这里我们使用模拟数据，不实际保存到数据库
      } else {
        throw profileError
      }
    }

    // 2. 获取7天打卡记录
    let logs = []
    if (!test_mode) {
      const { data: fetchedLogs, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'approved')
        .order('log_date', { ascending: true })
        .limit(7)

      if (logsError) throw logsError
      if (!fetchedLogs || fetchedLogs.length < 7) {
        throw new Error('用户尚未完成7天打卡')
      }
      logs = fetchedLogs
    } else {
      // 测试模式：创建模拟打卡记录
      console.log('测试模式：创建模拟打卡记录')
      logs = Array.from({ length: 7 }, (_, i) => ({
        id: `test-log-${i}`,
        user_id: user_id,
        log_date: `2026-02-${String(i + 7).padStart(2, '0')}`,
        text_content: `第${i + 1}天训练：正手练习${50 + i * 10}次，发球练习${20 + i * 5}分钟，垫步练习${3 + i}组`,
        image_urls: [
          'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg',
          'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg'
        ],
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    }

    // 3. 调用 DeepSeek API 生成结构化报告，根据域名语言选择提示词
    const systemPrompt = reportLanguage === 'en'
      ? `You are a professional tennis coach and scout. Generate a structured "scout report" based on the user's 7-day training logs and personal profile.

Return a strict JSON object with the following fields:

{
  "cover": {
    "title": "Your 7-Day Tennis Journey Report",
    "subtitle": "Personalized AI Scout Report",
    "date": "Generation date",
    "user_name": "Username"
  },
  "profile": {
    "gender": "Gender",
    "playing_years": "Years playing",
    "ntrp": "NTRP self-rating",
    "idol": "Idol",
    "style": "Tennis style",
    "summary": "Style characteristics summary"
  },
  "stats": {
    "total_days": 7,
    "total_photos": "Total photos",
    "latest_log_time": "Latest log time",
    "most_frequent_exercise": "Most frequent exercise",
    "keywords": ["Keyword1", "Keyword2", "Keyword3"]
  },
  "analysis": {
    "strengths": ["Strength1", "Strength2", "Strength3"],
    "improvements": ["Area to improve1", "Area to improve2"],
    "technical_insights": "Technical analysis summary"
  },
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Recommendation description",
      "frequency": "Training frequency",
      "icon": "Icon name"
    }
  ],
  "player_comparison": {
    "player_name": "Player comparison",
    "similarities": ["Similarity1", "Similarity2", "Similarity3"],
    "differences": ["Difference1", "Difference2"],
    "radar_chart": {
      "serve": 0-100,
      "baseline": 0-100,
      "net_play": 0-100,
      "movement": 0-100,
      "tactics": 0-100
    }
  },
  "achievements": {
    "badge": "Badge name",
    "badge_description": "Badge description",
    "next_goal": "Next goal"
  }
}

Requirements:
1. All fields must be in English
2. Generate realistic data based on user profile and training logs
3. Extract keywords from training logs
4. Radar chart values should be reasonably assessed based on user skill level
5. Choose a professional player with a similar style to the user for comparison`
      : `你是一位专业的网球教练和球探。根据用户7天的训练记录和个人档案，生成一份结构化的"球探报告"。

请返回一个严格的JSON对象，包含以下字段：

{
  "cover": {
    "title": "你的7天网球之旅报告",
    "subtitle": "专属AI球探报告",
    "date": "生成日期",
    "user_name": "用户名"
  },
  "profile": {
    "gender": "性别",
    "playing_years": "球龄",
    "ntrp": "NTRP自评",
    "idol": "偶像",
    "style": "网球风格",
    "summary": "风格特征总结"
  },
  "stats": {
    "total_days": 7,
    "total_photos": 照片总数,
    "latest_log_time": "最晚打卡时间",
    "most_frequent_exercise": "最常练习项目",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  },
  "analysis": {
    "strengths": ["优势1", "优势2", "优势3"],
    "improvements": ["待改进1", "待改进2"],
    "technical_insights": "技术分析总结"
  },
  "recommendations": [
    {
      "title": "建议标题",
      "description": "建议描述",
      "frequency": "训练频率",
      "icon": "图标名称"
    }
  ],
  "player_comparison": {
    "player_name": "对比球员",
    "similarities": ["相似点1", "相似点2", "相似点3"],
    "differences": ["差距1", "差距2"],
    "radar_chart": {
      "serve": 0-100,
      "baseline": 0-100,
      "net_play": 0-100,
      "movement": 0-100,
      "tactics": 0-100
    }
  },
  "achievements": {
    "badge": "勋章名称",
    "badge_description": "勋章描述",
    "next_goal": "下一个目标"
  }
}

要求：
1. 所有字段必须用中文
2. 基于用户档案和打卡记录生成真实数据
3. 关键词从打卡记录中提取
4. 雷达图数值基于用户技术水平合理评估
5. 对比球员选择与用户风格相似的职业球员`;

    const userContent = reportLanguage === 'en'
      ? `User profile:
- Gender: ${profile.gender}
- Years playing: ${profile.playing_years} years
- NTRP self‑rating: ${profile.self_rated_ntrp}
- Idol: ${profile.idol}
- Style: ${profile.tennis_style}
- Age: ${profile.age || 'Not set'}
- Location: ${profile.location || 'Not set'}

7‑day training logs:
${logs.map((log, i) => `Day ${i+1}: ${log.text_content} (photos: ${log.image_urls?.length || 0})`).join('\n')}

Please generate the structured scout report JSON.`
      : `用户档案：
- 性别：${profile.gender}
- 球龄：${profile.playing_years}年
- NTRP自评：${profile.self_rated_ntrp}
- 偶像：${profile.idol}
- 风格：${profile.tennis_style}
- 年龄：${profile.age || '未设置'}
- 地区：${profile.location || '未设置'}

7天训练记录：
${logs.map((log, i) => `第${i+1}天：${log.text_content} (照片数：${log.image_urls?.length || 0})`).join('\n')}

请生成结构化的球探报告JSON。`;

    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    })

    const deepseekData = await deepseekResponse.json()
    
    if (deepseekData.error) {
      throw new Error(deepseekData.error.message)
    }

    const structuredReport = JSON.parse(deepseekData.choices[0].message.content)
    
    // 生成HTML内容用于向后兼容，根据语言适配
    const reportContent = reportLanguage === 'en'
      ? `
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
    `
      : `
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
    `

    // 4. 保存报告到数据库（包含结构化数据）
    const { data: report, error: insertError } = await supabase
      .from('scout_reports')
      .insert([
        {
          user_id: user_id,
          content_html: reportContent,
          structured_data: structuredReport,
          report_version: 'v2.0',
          generation_status: 'success',
          generated_at: new Date(),
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

    // 5. 自动发布为社区首帖（产品设计：7天完成 → 报告生成 → 自动发布），根据语言适配
    const postContent = reportLanguage === 'en'
      ? `${structuredReport.cover?.title || 'My 7‑Day Tennis Scout Report'} 🎾\n\n${structuredReport.profile?.summary || ''}`
      : `${structuredReport.cover?.title || '我的7天网球球探报告'} 🎾\n\n${structuredReport.profile?.summary || ''}`
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([
        {
          user_id: user_id,
          report_id: report.id,
          content: postContent,
          created_at: new Date(),
        }
      ])
      .select()
      .single()

    if (!postError && post) {
      await supabase
        .from('scout_reports')
        .update({ is_published: true, published_at: new Date(), post_id: post.id })
        .eq('id', report.id)
    }

    // 6. 更新用户挑战状态并发放30天会员
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    await supabase
      .from('profiles')
      .update({
        challenge_status: 'success',
        challenge_success_date: new Date(),
        membership_valid_until: thirtyDaysLater,
      })
      .eq('id', user_id)

    return new Response(
      JSON.stringify({ success: true, report_id: report.id, post_id: post?.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('生成报告失败:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})