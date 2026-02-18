// src/lib/reportScreenshot.js
// 球探报告长图生成和上传工具

import html2canvas from 'html2canvas';
import { supabase } from './supabase';

/**
 * 生成报告页面的长图截图
 * @param {HTMLElement} element - 要截图的DOM元素（通常是报告容器）
 * @param {Object} options - html2canvas配置选项
 * @returns {Promise<Blob>} 截图Blob对象
 */
export async function generateReportScreenshot(element, options = {}) {
  const defaultOptions = {
    scale: 2, // 提高分辨率
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    ...options
  };

  try {
    console.log('开始生成报告截图...');
    const canvas = await html2canvas(element, defaultOptions);
    console.log('截图生成完成，尺寸:', canvas.width, 'x', canvas.height);
    
    // 将canvas转换为Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas转Blob失败'));
        }
      }, 'image/png', 0.95); // PNG格式，质量95%
    });
  } catch (error) {
    console.error('生成截图失败:', error);
    throw error;
  }
}

/**
 * 上传长图到Supabase Storage
 * @param {Blob} screenshotBlob - 截图Blob
 * @param {string} userId - 用户ID
 * @param {string} reportId - 报告ID
 * @returns {Promise<string>} 上传后的公开URL
 */
export async function uploadScreenshotToStorage(screenshotBlob, userId, reportId) {
  try {
    // 构造存储路径
    const filePath = `reports/${userId}/${reportId}.png`;
    console.log('上传截图到存储路径:', filePath);
    
    // 上传文件
    const { data, error } = await supabase.storage
      .from('tennis-journey')
      .upload(filePath, screenshotBlob, {
        cacheControl: '3600',
        upsert: true // 如果已存在则覆盖
      });
    
    if (error) {
      console.error('上传截图失败:', error);
      throw error;
    }
    
    console.log('截图上传成功:', data);
    
    // 获取公开URL
    const { data: { publicUrl } } = supabase.storage
      .from('tennis-journey')
      .getPublicUrl(filePath);
    
    console.log('截图公开URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('上传截图到存储过程中出错:', error);
    throw error;
  }
}

/**
 * 创建社区帖子（包含长图）
 * @param {string} userId - 用户ID
 * @param {string} reportId - 报告ID
 * @param {string} imageUrl - 长图URL
 * @param {string} language - 用户语言偏好 ('zh', 'en', 'zh_tw')
 * @returns {Promise<Object>} 创建的帖子数据
 */
export async function createCommunityPost(userId, reportId, imageUrl, language = 'zh') {
  try {
    // 根据语言准备帖子内容
    const postContents = {
      zh: {
        content_zh: '我的挑战成功了！快看我的专属球探报告！',
        content_en: 'I completed the challenge! Check out my exclusive scout report!',
        content_zh_tw: '我的挑戰成功了！快看我的專屬球探報告！'
      },
      en: {
        content_zh: '我的挑战成功了！快看我的专属球探报告！',
        content_en: 'I completed the challenge! Check out my exclusive scout report!',
        content_zh_tw: '我的挑戰成功了！快看我的專屬球探報告！'
      },
      zh_tw: {
        content_zh: '我的挑战成功了！快看我的专属球探报告！',
        content_en: 'I completed the challenge! Check out my exclusive scout report!',
        content_zh_tw: '我的挑戰成功了！快看我的專屬球探報告！'
      }
    };
    
    const contents = postContents[language] || postContents.zh;
    
    // 创建帖子数据
    const postData = {
      user_id: userId,
      report_id: reportId,
      ...contents,
      media_urls: imageUrl ? [imageUrl] : [],
      media_type: imageUrl ? 'image' : 'none',
      is_published: true,
      visibility: 'public',
      like_count: 0,
      comment_count: 0,
      repost_count: 0,
      view_count: 0
    };
    
    console.log('创建社区帖子数据:', postData);
    
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();
    
    if (error) {
      console.error('创建帖子失败:', error);
      throw error;
    }
    
    console.log('帖子创建成功:', data);
    return data;
  } catch (error) {
    console.error('创建社区帖子过程中出错:', error);
    throw error;
  }
}

/**
 * 完整的报告长图生成和发帖流程
 * @param {HTMLElement} reportElement - 报告DOM元素
 * @param {string} userId - 用户ID
 * @param {string} reportId - 报告ID
 * @param {string} language - 用户语言偏好
 * @returns {Promise<Object>} 包含截图URL和帖子ID的对象
 */
export async function generateAndPostReportScreenshot(reportElement, userId, reportId, language = 'zh') {
  try {
    // 1. 生成长图
    const screenshotBlob = await generateReportScreenshot(reportElement);
    
    // 2. 上传到存储
    const imageUrl = await uploadScreenshotToStorage(screenshotBlob, userId, reportId);
    
    // 3. 创建社区帖子
    const post = await createCommunityPost(userId, reportId, imageUrl, language);
    
    // 4. 更新报告表的is_published字段（可选）
    const { error: updateError } = await supabase
      .from('scout_reports')
      .update({ 
        is_published: true,
        published_at: new Date().toISOString(),
        post_id: post.id 
      })
      .eq('id', reportId);
    
    if (updateError) {
      console.warn('更新报告发布状态失败:', updateError);
      // 继续流程，不影响主功能
    }
    
    return {
      success: true,
      screenshotUrl: imageUrl,
      postId: post.id,
      post
    };
  } catch (error) {
    console.error('完整的长图生成和发帖流程失败:', error);
    throw error;
  }
}

/**
 * 检查是否已有该报告的帖子
 * @param {string} reportId - 报告ID
 * @returns {Promise<Object|null>} 已有的帖子数据，如果没有则返回null
 */
export async function getExistingPost(reportId) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('report_id', reportId)
      .maybeSingle();
    
    if (error) {
      console.error('查询帖子失败:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('检查已有帖子过程中出错:', error);
    return null;
  }
}