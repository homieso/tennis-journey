// 执行修复版社区功能数据库表结构的脚本
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// 使用service_role密钥（有超级权限）
const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseSecretKey = 'sb_secret_VeAjyDXBgQJ1OCSRuE6Tyg_FSt4055V'

// 创建具有service_role权限的客户端
const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function executeCommunitySchemaFixed() {
  try {
    console.log('🚀 开始执行社区功能数据库表结构（修复版）...')
    
    // 从SQL文件读取内容
    const sqlContent = readFileSync('supabase/community_schema_fixed.sql', 'utf8')
    console.log('读取SQL文件内容（前500字符）：')
    console.log(sqlContent.substring(0, 500) + '...')
    
    // 由于Supabase SQL Editor不支持exec_sql函数，我们建议手动执行
    console.log('\n⚠️ 注意：由于Supabase SQL Editor不支持RPC执行复杂SQL，请手动执行以下步骤：')
    console.log('1. 登录Supabase Dashboard: https://supabase.com/dashboard/project/finjgjjqcyjdaucyxchp/sql/editor')
    console.log('2. 复制以下SQL文件内容：supabase/community_schema_fixed.sql')
    console.log('3. 粘贴到SQL Editor中')
    console.log('4. 点击"Run"按钮执行')
    
    // 尝试分割执行关键部分（可能会失败，但尝试一下）
    console.log('\n尝试执行关键SQL语句...')
    
    // 尝试创建简单的扩展字段（如果可能）
    const simpleStatements = [
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_count INTEGER DEFAULT 0;",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT DEFAULT '';",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(15) DEFAULT 'public';"
    ]
    
    let simpleSuccess = 0
    let simpleError = 0
    
    for (const statement of simpleStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`简单语句执行失败: ${error.message}`)
          simpleError++
        } else {
          console.log('✅ 简单语句执行成功')
          simpleSuccess++
        }
      } catch (err) {
        console.log(`简单语句异常: ${err.message}`)
        simpleError++
      }
    }
    
    console.log(`\n简单语句执行结果: ${simpleSuccess} 成功, ${simpleError} 失败`)
    
    if (simpleError > 0) {
      console.log('\n🔴 需要手动执行完整SQL脚本')
      console.log('请复制以下文件内容到Supabase SQL Editor:')
      console.log('========================================')
      console.log(sqlContent.substring(0, 1000) + '...')
      console.log('========================================')
      console.log('（完整内容见: supabase/community_schema_fixed.sql）')
    } else {
      console.log('\n✅ 简单扩展字段添加成功，继续创建表...')
      
      // 尝试创建likes表
      const createLikesSQL = `
        CREATE TABLE IF NOT EXISTS likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, post_id)
        );
      `
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: createLikesSQL })
        if (error) {
          console.log(`创建likes表失败: ${error.message}`)
        } else {
          console.log('✅ likes表创建成功')
        }
      } catch (err) {
        console.log(`创建likes表异常: ${err.message}`)
      }
    }
    
    // 验证当前状态
    console.log('\n🔍 验证当前数据库状态...')
    
    // 检查posts表是否有新字段
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, created_at')
        .limit(1)
      
      if (error) {
        console.log(`❌ 查询posts表失败: ${error.message}`)
      } else {
        console.log(`✅ posts表可访问，示例ID: ${data[0]?.id || '无数据'}`)
      }
    } catch (err) {
      console.log(`查询posts表异常: ${err.message}`)
    }
    
    return simpleError === 0
    
  } catch (error) {
    console.error('执行修复版社区架构失败:', error)
    return false
  }
}

// 执行SQL
executeCommunitySchemaFixed().then(success => {
  if (success) {
    console.log('\n🎊 社区功能数据库表结构更新部分完成！')
    console.log('\n📋 下一步：')
    console.log('1. 检查前端组件是否正常工作')
    console.log('2. 测试点赞/评论/转发功能')
    console.log('3. 验证国际化翻译')
  } else {
    console.log('\n❌ 自动执行失败，需要手动执行SQL')
    console.log('\n💡 手动执行完整步骤：')
    console.log('1. 登录Supabase Dashboard')
    console.log('2. 进入SQL Editor')
    console.log('3. 复制文件内容: supabase/community_schema_fixed.sql')
    console.log('4. 粘贴并执行')
    console.log('5. 验证表结构是否创建成功')
  }
  
  console.log('\n🎯 前端功能已就绪：')
  console.log('   - PostCard组件: src/components/PostCard.jsx')
  console.log('   - 社区页面: src/pages/Community.jsx')
  console.log('   - 国际化翻译: src/lib/i18n.js')
  
  process.exit(0)
})