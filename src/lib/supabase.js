// src/lib/supabase.js
// Supabase 客户端配置
// 这是连接前端到后端数据库的桥梁

import { createClient } from '@supabase/supabase-js'

// 这些值会从 .env 文件中自动读取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建 Supabase 客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 导出默认客户端
export default supabase