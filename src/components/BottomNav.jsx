// src/components/BottomNav.jsx
// 置底菜单栏 - 全局导航

import { NavLink } from 'react-router-dom'
import { useTranslation } from '../lib/i18n'

function BottomNav() {
  const { t } = useTranslation()
  const navItems = [
    {
      path: '/',
      icon: '🏠',
      labelKey: 'nav.home',
      exact: true
    },
    {
      path: '/challenge',
      icon: '🎾',
      labelKey: 'nav.challenge'
    },
    {
      path: '/community',
      icon: '🌍',
      labelKey: 'nav.community'
    },
    {
      path: '/profile',
      icon: '👤',
      labelKey: 'nav.profile'
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
          <span className="text-xs">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default BottomNav