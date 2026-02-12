import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { user_id } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. 获取用户档案
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError) throw profileError

    // 2. 获取7天打卡记录
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'approved')
      .order('log_date', { ascending: true })
      .limit(7)

    if (logsError) throw logsError
    if (!logs || logs.length < 7) {
      throw new Error('用户尚未完成7天打卡')
    }

    // 3. 调用 DeepSeek API
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
            content: `你是一位专业的网球教练和球探。根据用户7天的训练记录和个人档案，生成一份专业的"球探报告"。

报告必须包含以下三个部分，用清晰的标题分隔：

## 一、用户概况表
- 风格特征：根据打球年限、自评等级、偏好风格总结
- 技术特点：从7天打卡记录中提取3-5个关键词
- 偶像影响：说明偶像对其打法的可能影响

## 二、个性化训练建议
- 给出3条具体、可执行的训练建议
- 每条建议包含：训练项目、训练频率、预期效果
- 结合打卡记录中的具体内容

## 三、球星相似度对比
- 选择1位职业球员
- 说明相似之处（技术、风格、特点）
- 差距分析（哪些方面需要提升）

语言风格：专业、激励、个性化。使用中文。`
          },
          {
            role: 'user',
            content: `用户档案：
- 性别：${profile.gender}
- 球龄：${profile.playing_years}年
- NTRP自评：${profile.self_rated_ntrp}
- 偶像：${profile.idol}
- 风格：${profile.tennis_style}

7天训练记录摘要：
${logs.map((log, i) => `第${i+1}天：${log.text_content}`).join('\n')}

请生成球探报告。`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    const deepseekData = await deepseekResponse.json()
    
    if (deepseekData.error) {
      throw new Error(deepseekData.error.message)
    }

    const reportContent = deepseekData.choices[0].message.content

    // 4. 保存报告到数据库
    const { data: report, error: insertError } = await supabase
      .from('scout_reports')
      .insert([
        {
          user_id: user_id,
          content_html: reportContent,
          generation_status: 'success',
          generated_at: new Date(),
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

    // 5. 更新用户挑战状态
    await supabase
      .from('profiles')
      .update({
        challenge_status: 'success',
        challenge_success_date: new Date(),
      })
      .eq('id', user_id)

    return new Response(
      JSON.stringify({ success: true, report_id: report.id }),
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