'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Rss, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import Avatar from '@/components/ui/Avatar'

const navItems = [
  { href: '/feed',         icon: Rss    },
  { href: '/eventos',      icon: Trophy },
  { href: '/notificacoes', icon: Bell   },
  { href: '/perfil',       icon: null   },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const { unread } = useNotifications()

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-full shadow-lg shadow-black/40 flex items-center gap-1 px-2 py-2">
      {navItems.map(({ href, icon: Icon }) => {
        const active = pathname.startsWith(href)
        const isBell = href === '/notificacoes'
        const isProfile = href === '/perfil'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex items-center justify-center w-11 h-11 rounded-full transition-colors',
              active ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {isProfile ? (
              <Avatar
                name={profile?.name}
                url={profile?.avatar_url}
                size={26}
                className={active ? 'ring-2 ring-red-500' : ''}
              />
            ) : (
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            )}
            {isBell && unread > 0 && (
              <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
