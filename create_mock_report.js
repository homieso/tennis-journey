// 创建模拟球探报告的脚本
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

async function createMockReport(userId) {
  try {
    console.log(`正在为用户 ${userId} 创建模拟球探报告...`)
    
    // 创建模拟报告内容
    const mockReportContent = `
# 🎾 球探报告：网球成长之旅

## 一、用户概况表

**风格特征**：
- 球龄：5年，具备扎实的网球基础
- 自评等级：NTRP 3.5，处于中级向高级过渡阶段
- 偏好风格：全场型选手，技术全面，攻防兼备

**技术特点**：
1. **正手稳定性**：7天训练中正手练习累计超过400次，击球动作规范
2. **发球进步**：发球练习从20分钟逐步增加到50分钟，一发成功率稳步提升
3. **步伐移动**：垫步练习从3组增加到9组，场上移动更加灵活
4. **战术意识**：从基础练习逐步过渡到模拟比赛，战术意识明显增强

**偶像影响**：
- 偶像：费德勒
- 影响：追求优雅的击球动作和全场控制能力，注重技术细节和比赛节奏

## 二、个性化训练建议

**建议1：正手深度控制训练**
- 训练项目：在底线后1米处练习正手深球，目标落点在底线内1米区域
- 训练频率：每周3次，每次30分钟
- 预期效果：提高击球深度，增加对手回球难度

**建议2：发球落点精准度训练**
- 训练项目：在发球区设置4个目标区域（内外角各2个），练习精准发球
- 训练频率：每周2次，每次40分钟
- 预期效果：提高一发成功率和落点控制能力

**建议3：网前截击反应训练**
- 训练项目：搭档在底线随机击球，练习快速上网截击
- 训练频率：每周2次，每次20分钟
- 预期效果：提高网前反应速度和截击成功率

## 三、球星相似度对比

**对比球员：罗杰·费德勒**

**相似之处**：
1. **技术全面性**：与费德勒一样，你追求全场型打法，正反手均衡
2. **优雅风格**：注重击球动作的美感和流畅性
3. **战术意识**：从训练记录看，你注重战术练习而不仅仅是技术练习

**差距分析**：
1. **发球威力**：需要提高发球速度和旋转变化
2. **反手稳定性**：反手击球次数相对较少，需要加强练习
3. **比赛经验**：需要更多实战比赛来积累经验

## 四、成长路线图

**短期目标（1-3个月）**：
- 将一发成功率从60%提高到70%
- 正手深球成功率从65%提高到80%
- 参加2-3场业余比赛积累经验

**中期目标（3-6个月）**：
- 达到NTRP 4.0水平
- 掌握至少2种发球变化（平击、上旋）
- 建立稳定的比赛战术体系

**长期目标（6-12个月）**：
- 成为地区业余比赛的有力竞争者
- 技术风格更加成熟稳定
- 享受网球带来的乐趣和成就感

---

*报告生成时间：${new Date().toLocaleString('zh-CN')}*
*Tennis Journey AI 球探系统*
    `
    
    // 1. 创建球探报告
    console.log('1. 创建球探报告...')
    const { data: report, error: reportError } = await supabase
      .from('scout_reports')
      .insert([
        {
          user_id: userId,
          content_html: mockReportContent,
          generation_status: 'success',
          generated_at: new Date(),
        }
      ])
      .select()
      .single()
    
    if (reportError) {
      console.error('创建球探报告失败:', reportError)
      return false
    }
    
    console.log('✅ 球探报告创建成功！报告ID:', report.id)
    
    // 2. 创建社区帖子
    console.log('2. 创建社区帖子...')
    const postData = {
      user_id: userId,
      title: `我的第一份球探报告 - ${new Date().toLocaleDateString('zh-CN')}`,
      content: mockReportContent,
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
      return false
    }
    
    console.log('✅ 社区帖子创建成功！帖子ID:', post.id)
    console.log('🔗 帖子链接: /community/post/' + post.id)
    
    // 3. 更新用户挑战状态
    console.log('3. 更新用户挑战状态...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        challenge_status: 'success',
        challenge_success_date: new Date(),
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('更新用户状态失败:', updateError)
    } else {
      console.log('✅ 用户挑战状态更新为"success"')
    }
    
    // 4. 显示报告预览
    console.log('\n📄 报告内容预览：')
    console.log('='.repeat(50))
    console.log(mockReportContent.substring(0, 300) + '...')
    console.log('='.repeat(50))
    
    return true
    
  } catch (error) {
    console.error('创建模拟报告失败:', error)
    return false
  }
}

// 执行创建
const userId = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'
createMockReport(userId).then(success => {
  if (success) {
    console.log('\n🎊 模拟球探报告创建完成！')
    console.log('\n📋 下一步：')
    console.log('1. 访问 http://localhost:5174/report 查看报告')
    console.log('2. 访问 http://localhost:5174/community 查看社区帖子')
    console.log('3. 访问 http://localhost:5174/profile 查看个人主页更新')
  } else {
    console.log('\n❌ 模拟报告创建失败')
    console.log('\n💡 建议：请通过Supabase SQL编辑器手动创建数据')
  }
  process.exit(0)
})