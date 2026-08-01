'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Rss, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/feed', icon: Rss, label: 'Feed' },
  { href: '/eventos', icon: Trophy, label: 'Competições' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col py-6 shrink-0">
      <div className="px-5 mb-8 flex items-center gap-2">
        <Trophy className="text-indigo-500" size={22} />
        <span className="text-white font-bold text-lg">Nexus Arena</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-950 text-indigo-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon size={18} />
              {label}
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
