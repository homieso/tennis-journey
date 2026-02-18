// 上传首页推荐卡片图片到Supabase Storage
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://finjgjjqcyjdaucyxchp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('错误：请设置 SUPABASE_SERVICE_KEY 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadImage(filePath, bucket, path) {
  try {
    const fileData = readFileSync(filePath)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileData, {
        contentType: getMimeType(filePath),
        upsert: true
      })

    if (error) {
      console.error(`上传 ${filePath} 失败:`, error.message)
      return null
    }

    console.log(`✅ 上传成功: ${filePath} → ${path}`)
    
    // 获取公开URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return publicUrlData.publicUrl
  } catch (err) {
    console.error(`上传 ${filePath} 时出错:`, err.message)
    return null
  }
}

function getMimeType(filePath) {
  if (filePath.endsWith('.png')) return 'image/png'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'
  if (filePath.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

async function main() {
  console.log('开始上传首页推荐卡片图片...')
  
  // 确保home文件夹存在
  const bucket = 'tennis-journey'
  
  // 上传Wilson logo
  const wilsonUrl = await uploadImage(
    'home/Wilson-Sporting-Goods-Logo.png',
    bucket,
    'home/wilson-logo.jpg'
  )
  
  // 上传温网图片
  const wimbledonUrl = await uploadImage(
    'home/温布尔登.webp',
    bucket,
    'home/wimbledon.jpg'
  )
  
  console.log('\n上传完成:')
  if (wilsonUrl) console.log(`Wilson URL: ${wilsonUrl}`)
  if (wimbledonUrl) console.log(`Wimbledon URL: ${wimbledonUrl}`)
  
  if (wilsonUrl && wimbledonUrl) {
    console.log('\n✅ 两张图片都已成功上传！')
    console.log('\n请将以下URL复制到 src/App.jsx 的 recommendationImages 中:')
    console.log(`brand: '${wilsonUrl}', // Wilson品牌logo`)
    console.log(`event: '${wimbledonUrl}', // 温网赛事图片`)
  } else {
    console.log('\n⚠️ 部分图片上传失败，请检查错误信息')
  }
}

main().catch(console.error)