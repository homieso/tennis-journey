import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, test_mode } = await req.json()
    
    // 强制使用英文报告（根据第一阶段要求）
    const reportLanguage = 'en' // 强制英文，不再检测域名或用户偏好
    console.log('强制使用英文报告（第一阶段重构要求）')
    
    // 初始化Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()
    
    // 调试日志：显示最终决定的语言
    console.log(`最终报告语言: ${reportLanguage} (强制英文)`)

    if (profileError) {
      // 如果是测试模式，创建模拟档案
      if (test_mode) {
        console.log('Test mode: creating mock user profile')
        const mockProfile = {
          id: user_id,
          email: 'test@example.com',
          gender: 'Male',
          playing_years: 5,
          self_rated_ntrp: 3.5,
          idol: 'Roger Federer',
          tennis_style: 'All-court player',
          age: 28,
          location: 'Beijing',
          equipment: 'Wilson Blade v9',
          injury_history: 'None',
          short_term_goal: 'Improve match stability'
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
        throw new Error('User has not completed 7-day challenge')
      }
      logs = fetchedLogs
    } else {
      // 测试模式：创建模拟打卡记录
      console.log('Test mode: creating mock training logs')
      logs = Array.from({ length: 7 }, (_, i) => ({
        id: `test-log-${i}`,
        user_id: user_id,
        log_date: `2026-02-${String(i + 7).padStart(2, '0')}`,
        text_content: `Day ${i+1} training: forehand practice ${50 + i * 10} times, serve practice ${20 + i * 5} minutes, split‑step practice ${3 + i} sets`,
        image_urls: [
          'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/forehand_1.jpg',
          'https://finjgjjqcyjdaucyxchp.supabase.co/storage/v1/object/public/tennis-journey/examples/split_step_2.jpg'
        ],
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    }

    // 3. 调用 DeepSeek API 生成结构化报告，强制使用英文提示词
    const systemPrompt = `You are a professional tennis coach and scout. Generate a structured "scout report" based on the user's 7-day training logs and personal profile.

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

    // 构建用户内容
    const username = profile?.username || profile?.email?.split('@')[0] || 'Tennis Player'
    const gender = profile?.gender || 'Not specified'
    const playingYears = profile?.playing_years || 'Unknown'
    const ntrp = profile?.self_rated_ntrp || 'Not rated'
    const idol = profile?.idol || 'Not specified'
    const style = profile?.tennis_style || 'All-court'

    const userContent = `User profile:
- Username: ${username}
- Gender: ${gender}
- Playing years: ${playingYears}
- NTRP self-rating: ${ntrp}
- Tennis idol: ${idol}
- Playing style: ${style}

7-day training logs:
${logs.map((log: any, i: number) => `Day ${i+1}: ${log.text_content} (photos: ${log.image_urls?.length || 0})`).join('\n')}`

    // 调用 DeepSeek API
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const structuredReport = JSON.parse(result.choices[0].message.content)

    // 4. 生成HTML内容用于向后兼容
    const reportContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${structuredReport.cover?.title || 'Tennis Scout Report'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
        .report-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .cover { text-align: center; margin-bottom: 40px; }
        .cover h1 { color: #2d3748; font-size: 2.5rem; margin-bottom: 10px; }
        .cover .subtitle { color: #718096; font-size: 1.2rem; margin-bottom: 20px; }
        .section { margin-bottom: 30px; padding: 20px; background: #f7fafc; border-radius: 12px; }
        .section h2 { color: #4a5568; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .stat-card { background: white; padding: 15px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .recommendation { background: white; padding: 15px; margin: 10px 0; border-radius: 10px; border-left: 4px solid #4299e1; }
        .footer { text-align: center; margin-top: 40px; color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="cover">
            <h1>${structuredReport.cover?.title || 'Your 7-Day Tennis Journey Report'}</h1>
            <div class="subtitle">${structuredReport.cover?.subtitle || 'Personalized AI Scout Report'}</div>
            <div class="date">${structuredReport.cover?.date || new Date().toLocaleDateString('en-US')}</div>
            <div class="user-name">For: ${structuredReport.cover?.user_name || username}</div>
        </div>
        
        <div class="section">
            <h2>Player Profile</h2>
            <p><strong>Gender:</strong> ${structuredReport.profile?.gender || gender}</p>
            <p><strong>Playing Years:</strong> ${structuredReport.profile?.playing_years || playingYears}</p>
            <p><strong>NTRP Rating:</strong> ${structuredReport.profile?.ntrp || ntrp}</p>
            <p><strong>Tennis Idol:</strong> ${structuredReport.profile?.idol || idol}</p>
            <p><strong>Playing Style:</strong> ${structuredReport.profile?.style || style}</p>
            <p><strong>Summary:</strong> ${structuredReport.profile?.summary || 'Well-rounded player with good fundamentals'}</p>
        </div>
        
        <div class="section">
            <h2>Training Analysis</h2>
            <p><strong>Strengths:</strong> ${structuredReport.analysis?.strengths?.join(', ') || 'Consistency, Footwork, Determination'}</p>
            <p><strong>Areas to Improve:</strong> ${structuredReport.analysis?.improvements?.join(', ') || 'Serve placement, Net play, Match strategy'}</p>
            <p><strong>Technical Insights:</strong> ${structuredReport.analysis?.technical_insights || 'Solid foundation with room for tactical development'}</p>
        </div>
        
        <div class="section">
            <h2>Training Recommendations</h2>
            ${structuredReport.recommendations?.map((rec: any, i: number) => `
            <div class="recommendation">
                <h3>${rec.title || `Recommendation ${i+1}`}</h3>
                <p>${rec.description || 'Focus on specific skill development'}</p>
                <p><em>Frequency: ${rec.frequency || '2-3 times per week'}</em></p>
            </div>
            `).join('') || '<p>No specific recommendations available</p>'}
        </div>
        
        <div class="footer">
            <p>Generated by Tennis Journey AI Scout • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    </div>
</body>
</html>`

    // 5. 保存报告到数据库
    const { data: report, error: reportError } = await supabase
      .from('scout_reports')
      .insert({
        user_id: user_id,
        content: reportContent,
        structured_data: structuredReport,
        generated_at: new Date().toISOString(),
        language: 'en' // 强制英文
      })
      .select()
      .single()

    if (reportError) {
      throw new Error(`Failed to save report: ${reportError.message}`)
    }

    // 6. 自动创建社区帖子（英文内容）
    const postContentEn = `🎾 My 7-Day Tennis Scout Report 🎾

👤 Player: ${username}
📅 Completed: ${new Date().toLocaleDateString('en-US')}

🏆 Highlights:
${structuredReport.analysis?.strengths?.slice(0, 3).map((s: string) => `• ${s}`).join('\n') || '• Consistent training\n• Good technique foundation\n• Strong determination'}

💪 Recommendations:
${structuredReport.recommendations?.slice(0, 2).map((rec: any, i: number) => `• ${rec.title}: ${rec.description}`).join('\n') || '• Serve practice: Improve placement and power\n• Net play: Develop volley skills'}

🎯 Next Goal: ${structuredReport.achievements?.next_goal || 'Reach NTRP 4.0 level'}

#TennisJourney #ScoutReport #7DayChallenge #TennisImprovement`

    // 创建帖子
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user_id,
        content: postContentEn, // 英文内容
        content_en: postContentEn, // 英文内容
        content_zh: '', // 留空，因为强制英文
        content_zh_tw: '', // 留空，因为强制英文
        report_id: report.id,
        like_count: 0,
        comment_count: 0,
        repost_count: 0,
        is_announcement: false
      })
      .select()
      .single()

    if (postError) {
      console.warn('Failed to create community post:', postError)
      // 不抛出错误，报告生成仍然成功
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: report.id,
        post_id: post?.id || null,
        language: 'en',
        generated_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Scout report generation failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})