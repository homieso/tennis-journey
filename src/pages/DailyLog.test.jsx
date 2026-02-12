import React from 'react'

function DailyLog() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F5F5F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '600px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#0B4F37',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          每日打卡页面 - 测试成功 ✅
        </h1>
        <p style={{ color: '#4B5563' }}>
          当前URL: /challenge/daily/1
        </p>
        <p style={{ color: '#4B5563', marginTop: '0.5rem' }}>
          如果看到这个页面，说明组件已正常加载
        </p>
      </div>
    </div>
  )
}

export default DailyLog