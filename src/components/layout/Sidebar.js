'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Rss, User, Settings, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'

const navItems = [
  { href: '/feed',         icon: Rss,    label: 'Feed'         },
  { href: '/eventos',      icon: Trophy, label: 'Competições'  },
  { href: '/notificacoes', icon: Bell,   label: 'Notificações' },
  { href: '/perfil',       icon: User,   label: 'Perfil'       },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { unread } = useNotifications()

  return (
    <aside className="hidden md:flex w-60 bg-gray-900 border-r border-gray-800 flex-col py-6 shrink-0">
      <div className="px-5 mb-8 flex items-center gap-2">
        <Trophy className="text-red-500" size={22} />
        <span className="text-white font-bold text-lg">Nexus Arena</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          const isBell = href === '/notificacoes'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-red-950 text-red-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <div className="relative">
                <Icon size={18} />
                {isBell && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
                    {unread > 9 ? '9' : unread}
                  </span>
                )}
              </div>
              {label}
              {isBell && unread > 0 && (
                <span className="ml-auto bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pt-4 border-t border-gray-800 mt-4">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Settings size={18} />
          Configurações
        </Link>
      </div>
    </aside>
  )
}
