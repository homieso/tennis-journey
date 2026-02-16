// src/components/ShareReport.jsx
// 球探报告分享组件

import { useState } from 'react'
import { supabase } from '../lib/supabase'

function ShareReport({ reportId, structuredData }) {
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    try {
      // 这里可以集成实际的分享功能
      // 例如：生成分享链接、创建分享图片等
      
      // 模拟分享URL
      const mockShareUrl = `https://tennis-journey.app/report/share/${reportId}`
      setShareUrl(mockShareUrl)
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(mockShareUrl)
      setCopied(true)
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000)
      
    } catch (error) {
      console.error('分享失败:', error)
      alert('分享失败，请重试')
    } finally {
      setSharing(false)
    }
  }

  const handleDownloadImage = () => {
    // 这里可以集成生成分享图片的功能
    alert('图片下载功能即将上线！')
  }

  const handleShareToWechat = () => {
    // 这里可以集成微信分享功能
    alert('微信分享功能即将上线！')
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4">分享我的球探报告</h3>
      
      <div className="space-y-4">
        {/* 分享链接 */}
        {shareUrl && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">分享链接</p>
            <div className="flex items-center">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 truncate"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="ml-2 text-wimbledon-green hover:text-wimbledon-grass text-sm"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}

        {/* 分享按钮组 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleDownloadImage}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all"
          >
            <span className="text-2xl mb-1">📸</span>
            <span className="text-xs text-gray-700">保存图片</span>
          </button>
          
          <button
            onClick={handleShareToWechat}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all"
          >
            <span className="text-2xl mb-1">💬</span>
            <span className="text-xs text-gray-700">微信分享</span>
          </button>
          
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all"
          >
            <span className="text-2xl mb-1">🔗</span>
            <span className="text-xs text-gray-700">复制链接</span>
          </button>
        </div>

        {/* 分享提示 */}
        <div className="bg-gradient-to-r from-wimbledon-green/5 to-wimbledon-grass/5 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            分享你的7天网球挑战成果，激励更多网球爱好者！
          </p>
        </div>

        {/* 主要分享按钮 */}
        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full bg-gradient-to-r from-wimbledon-green to-wimbledon-grass text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sharing ? '生成分享链接中...' : '立即分享'}
        </button>
      </div>
    </div>
  )
}

export default ShareReport