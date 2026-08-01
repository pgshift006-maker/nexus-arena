'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, LogOut, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { getInitials, timeAgo } from '@/lib/utils'

export default function Navbar() {
  const { profile } = useAuth()
  const router = useRouter()
  const { notifications, unread, markAllRead, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function handleNotifClick(notif) {
    markRead(notif.id)
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-2">
        {/* Sino de notificações */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
              {/* header dropdown */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-white font-semibold text-sm">Notificações</span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Check size={12} />
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* lista */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Nenhuma notificação</p>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition-colors flex gap-3 ${!n.read ? 'bg-indigo-950/30' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-indigo-400' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>}
                        <p className="text-xs text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* rodapé */}
              <div className="border-t border-gray-800 px-4 py-2.5">
                <Link
                  href="/notificacoes"
                  onClick={() => setOpen(false)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ver todas as notificações →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + nome */}
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(profile?.name ?? '?')}
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">{profile?.name ?? '...'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
