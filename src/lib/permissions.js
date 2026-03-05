// src/lib/permissions.js
// 统一的用户权限检查工具

import { supabase } from './supabase'

// 管理员ID
const ADMIN_USER_ID = 'dcee2e34-45f0-4506-9bac-4bdf0956273c'

/**
 * 检查用户是否有互动权限（管理员或已认证用户）
 * @param {Object} user - Supabase auth用户对象
 * @param {Object} profile - 用户资料对象（可选）
 * @returns {Promise<boolean>} 是否有权限
 */
export const canUserInteract = async (user, profile = null) => {
  // 用户必须登录
  if (!user?.id) {
    return false
  }

  // 管理员有完全权限
  if (user.id === ADMIN_USER_ID) {
    return true
  }

  // 如果提供了profile对象，直接检查is_approved
  if (profile?.is_approved === true) {
    return true
  }

  // 如果没有提供profile，尝试从数据库获取
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('获取用户资料失败:', error)
      return false
    }

    return data?.is_approved === true
  } catch (error) {
    console.error('检查用户权限失败:', error)
    return false
  }
}

/**
 * 检查用户是否是管理员
 * @param {Object} user - Supabase auth用户对象
 * @returns {boolean} 是否是管理员
 */
export const isAdmin = (user) => {
  return user?.id === ADMIN_USER_ID
}

/**
 * 获取用户资料（包含is_approved字段）
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 用户资料对象
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, location, playing_years, self_rated_ntrp, is_approved')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('获取用户资料失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取用户资料异常:', error)
    return null
  }
}

/**
 * 检查用户是否有权限删除内容（管理员或内容所有者）
 * @param {Object} user - 当前用户
 * @param {string} contentOwnerId - 内容所有者的用户ID
 * @returns {boolean} 是否有删除权限
 */
export const canDeleteContent = (user, contentOwnerId) => {
  if (!user?.id) return false
  return user.id === ADMIN_USER_ID || user.id === contentOwnerId
}

/**
 * 检查用户是否有权限编辑内容（管理员或内容所有者）
 * @param {Object} user - 当前用户
 * @param {string} contentOwnerId - 内容所有者的用户ID
 * @returns {boolean} 是否有编辑权限
 */
export const canEditContent = (user, contentOwnerId) => {
  if (!user?.id) return false
  return user.id === ADMIN_USER_ID || user.id === contentOwnerId
}