// src/components/BottomNav.jsx
// 置底菜单栏 - 全局导航

import { NavLink } from 'react-router-dom'

function BottomNav() {
  const navItems = [
    {
      path: '/',
      icon: '🏠',
      label: '首页',
      exact: true
    },
    {
      path: '/challenge',
      icon: '🎾',
      label: '挑战'
    },
    {
      path: '/community',
      icon: '🌍',
      label: '社区'
    },
    {
      path: '/profile',
      icon: '👤',
      label: '我的'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center shadow-lg z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.exact}
          className={({ isActive }) =>
            `flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive
                ? 'text-wimbledon-green'
                : 'text-gray-500 hover:text-gray-700'
            }`
          }
        >
          <span className="text-xl mb-1">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default BottomNav