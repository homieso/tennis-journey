// 全面自检脚本
import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStructure() {
  console.log('🔍 检查数据库结构...')
  
  try {
    // 1. 检查profiles表是否有username和bio字段
    console.log('\n1. 检查profiles表字段...')
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .in('column_name', ['username', 'bio'])
    
    if (profilesError) {
      console.error('查询profiles表失败:', profilesError)
    } else {
      console.log('profiles表相关字段:')
      if (profilesColumns.length === 0) {
        console.log('❌ username和bio字段不存在 - 需要执行add_profile_fields.sql')
      } else {
        profilesColumns.forEach(col => {
          console.log(`  ✅ ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? '可为空' : '非空'}`)
        })
      }
    }
    
    // 2. 检查scout_reports表是否有structured_data字段
    console.log('\n2. 检查scout_reports表字段...')
    const { data: reportsColumns, error: reportsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'scout_reports')
      .in('column_name', ['structured_data', 'report_version', 'shareable_image_url', 'qr_code_url'])
    
    if (reportsError) {
      console.error('查询scout_reports表失败:', reportsError)
    } else {
      console.log('scout_reports表相关字段:')
      const expectedFields = ['structured_data', 'report_version', 'shareable_image_url', 'qr_code_url']
      expectedFields.forEach(field => {
        const col = reportsColumns.find(c => c.column_name === field)
        if (col) {
          console.log(`  ✅ ${col.column_name} (${col.data_type})`)
        } else {
          console.log(`  ❌ ${field} 字段不存在`)
        }
      })
    }
    
    // 3. 检查现有报告是否有structured_data
    console.log('\n3. 检查现有报告数据...')
    const { data: reports, error: reportsDataError } = await supabase
      .from('scout_reports')
      .select('id, report_version, structured_data')
      .limit(5)
    
    if (reportsDataError) {
      console.error('查询报告数据失败:', reportsDataError)
    } else if (reports && reports.length > 0) {
      console.log(`找到 ${reports.length} 份报告:`)
      reports.forEach(report => {
        console.log(`  ID: ${report.id}, 版本: ${report.report_version || '未设置'}, 结构化数据: ${report.structured_data ? '✅ 有' : '❌ 无'}`)
      })
    } else {
      console.log('❌ 没有找到任何报告')
    }
    
    // 4. 检查社区帖子
    console.log('\n4. 检查社区帖子...')
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(5)
    
    if (postsError) {
      console.error('查询帖子失败:', postsError)
    } else if (posts && posts.length > 0) {
      console.log(`找到 ${posts.length} 个帖子:`)
      posts.forEach(post => {
        console.log(`  ID: ${post.id}, 标题: ${post.content?.substring(0, 50)}...`)
      })
    } else {
      console.log('❌ 没有找到任何帖子 - 社区页面将显示空白')
      console.log('💡 建议：创建测试帖子数据')
    }
    
    // 5. 检查用户数据示例
    console.log('\n5. 检查用户数据示例...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, username, bio')
      .limit(3)
    
    if (usersError) {
      console.error('查询用户数据失败:', usersError)
    } else if (users && users.length > 0) {
      console.log('用户数据示例:')
      users.forEach(user => {
        console.log(`  ${user.email}: username=${user.username || '未设置'}, bio=${user.bio || '未设置'}`)
      })
    }
    
  } catch (error) {
    console.error('自检过程中出错:', error)
  }
}

async function checkEdgeFunction() {
  console.log('\n🔍 检查Edge Function状态...')
  
  try {
    // 尝试调用Edge Function测试
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-scout-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        user_id: 'test-user-id',
        test_mode: true
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Edge Function可访问，响应:', data)
    } else {
      console.log(`❌ Edge Function调用失败: ${response.status} ${response.statusText}`)
      console.log('💡 需要部署Edge Function: npx supabase functions deploy generate-scout-report')
    }
  } catch (error) {
    console.error('检查Edge Function失败:', error.message)
  }
}

async function createTestData() {
  console.log('\n🔧 创建测试数据...')
  
  try {
    // 1. 创建测试帖子
    console.log('1. 创建测试帖子...')
    const testPost = {
      user_id: 'dcee2e34-45f0-4506-9bac-4bdf0956273c', // 测试用户ID
      report_id: null,
      content: '我的7天网球挑战心得分享 🎾\n\n通过7天的系统训练，我的正手稳定性明显提升，发球落点也更加精准。感谢Tennis Journey的AI分析，让我更了解自己的技术特点！',
      created_at: new Date().toISOString()
    }
    
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([testPost])
      .select()
    
    if (postError) {
      console.error('创建测试帖子失败:', postError)
    } else {
      console.log('✅ 测试帖子创建成功:', post[0].id)
    }
    
    // 2. 更新测试用户的username和bio
    console.log('\n2. 更新测试用户档案...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: '网球爱好者',
        bio: '热爱网球，享受每一次击球的快乐！目标是达到NTRP 4.0水平。'
      })
      .eq('id', 'dcee2e34-45f0-4506-9bac-4bdf0956273c')
    
    if (updateError) {
      console.error('更新用户档案失败:', updateError)
    } else {
      console.log('✅ 测试用户档案更新成功')
    }
    
  } catch (error) {
    console.error('创建测试数据失败:', error)
  }
}

async function fixI18n() {
  console.log('\n🔧 修复i18n问题...')
  
  try {
    // 检查i18n.js文件
    const fs = await import('fs')
    const i18nPath = '/Users/homieso/Desktop/tennis-journey/src/lib/i18n.js'
    
    if (fs.existsSync(i18nPath)) {
      const content = fs.readFileSync(i18nPath, 'utf8')
      
      // 检查关键函数
      const hasGetCurrentLanguage = content.includes('function getCurrentLanguage')
      const hasSetLanguage = content.includes('function setLanguage')
      const hasTFunction = content.includes('function t(')
      
      console.log('i18n.js检查:')
      console.log(`  getCurrentLanguage函数: ${hasGetCurrentLanguage ? '✅' : '❌'}`)
      console.log(`  setLanguage函数: ${hasSetLanguage ? '✅' : '❌'}`)
      console.log(`  t翻译函数: ${hasTFunction ? '✅' : '❌'}`)
      
      if (!hasGetCurrentLanguage || !hasSetLanguage || !hasTFunction) {
        console.log('💡 i18n.js可能不完整，需要修复')
      } else {
        console.log('✅ i18n.js看起来正常')
      }
    } else {
      console.log('❌ i18n.js文件不存在')
    }
  } catch (error) {
    console.error('检查i18n失败:', error)
  }
}

async function main() {
  console.log('🚀 开始全面自检...')
  
  // 检查数据库结构
  await checkDatabaseStructure()
  
  // 检查Edge Function
  await checkEdgeFunction()
  
  // 修复i18n问题
  await fixI18n()
  
  // 创建测试数据
  await createTestData()
  
  console.log('\n📋 自检完成！')
  console.log('\n🎯 修复建议：')
  console.log('1. 如果数据库字段缺失，手动执行SQL脚本')
  console.log('2. 如果Edge Function不可用，手动部署')
  console.log('3. 启动开发服务器测试：npm run dev')
  console.log('4. 访问 http://localhost:5174/ 验证功能')
  
  console.log('\n🔗 测试链接：')
  console.log('- 首页: http://localhost:5174/')
  console.log('- 新报告: http://localhost:5174/report/new')
  console.log('- 社区: http://localhost:5174/community')
  console.log('- 个人主页: http://localhost:5174/profile')
}

// 执行自检
main().catch(console.error)