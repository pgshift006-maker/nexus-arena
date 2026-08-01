'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Rss, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'

const navItems = [
  { href: '/feed',         icon: Rss,    label: 'Feed'    },
  { href: '/eventos',      icon: Trophy, label: 'Eventos' },
  { href: '/notificacoes', icon: Bell,   label: 'Avisos'  },
  { href: '/perfil',       icon: User,   label: 'Perfil'  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { unread } = useNotifications()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex items-stretch h-14">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        const isBell = href === '/notificacoes'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
              active ? 'text-indigo-400' : 'text-gray-500'
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              {isBell && unread > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
