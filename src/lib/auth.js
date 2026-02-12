// src/lib/auth.js
// 认证相关的所有 Supabase 操作

import { supabase } from './supabase'

/**
 * 邮箱密码注册
 */
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('注册错误:', error.message)
    return { data: null, error }
  }
}

/**
 * 邮箱密码登录
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('登录错误:', error.message)
    return { data: null, error }
  }
}

/**
 * 退出登录
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('退出错误:', error.message)
    return { error }
  }
}

/**
 * 获取当前登录用户
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('获取用户错误:', error.message)
    return { user: null, error }
  }
}

/**
 * 创建用户档案（注册后调用）
 */
export const createProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: profileData.email,
          gender: profileData.gender,
          playing_years: profileData.playingYears,
          self_rated_ntrp: profileData.selfRatedNtrp,
          idol: profileData.idol,
          tennis_style: profileData.tennisStyle,
          challenge_status: 'not_started',
        }
      ])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('创建档案错误:', error.message)
    return { data: null, error }
  }
}
/**
 * 检查用户是否已填写档案
 */
export const checkProfileExists = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return { exists: !!data, error: null }
  } catch (error) {
    console.error('检查档案错误:', error.message)
    return { exists: false, error }
  }
}

/**
 * 更新用户档案（注册后填写）
 */
export const updateProfile = async (userId, profileData) => {
  try {
    // 先获取当前用户的 email
    const { data: { user } } = await supabase.auth.getUser()
    
    // 先检查档案是否存在
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    let result
    if (existingProfile) {
      // 更新现有档案
      result = await supabase
        .from('profiles')
        .update({
          gender: profileData.gender,
          playing_years: parseInt(profileData.playingYears) || 0,
          self_rated_ntrp: parseFloat(profileData.selfRatedNtrp) || 3.0,
          idol: profileData.idol || '',
          tennis_style: profileData.tennisStyle || '',
          updated_at: new Date(),
        })
        .eq('id', userId)
        .select()
        .single()
    } else {
      // 创建新档案，必须包含 email
      result = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: user?.email || '',  // 从当前用户获取 email
            gender: profileData.gender,
            playing_years: parseInt(profileData.playingYears) || 0,
            self_rated_ntrp: parseFloat(profileData.selfRatedNtrp) || 3.0,
            idol: profileData.idol || '',
            tennis_style: profileData.tennisStyle || '',
            challenge_status: 'not_started',
            created_at: new Date(),
            updated_at: new Date(),
          }
        ])
        .select()
        .single()
    }
    
    if (result.error) throw result.error
    return { data: result.data, error: null }
  } catch (error) {
    console.error('更新档案错误:', error.message)
    return { data: null, error }
  }
}