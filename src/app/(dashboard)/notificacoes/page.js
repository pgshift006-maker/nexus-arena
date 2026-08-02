'use client'

import { useRouter } from 'next/navigation'
import { Bell, Check, Zap, Heart, Trophy } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { timeAgo } from '@/lib/utils'

const typeIcon = {
  like:       { icon: Heart,   color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950'    },
  ao_vivo:    { icon: Zap,     color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950'  },
  encerrado:  { icon: Trophy,  color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
  new_match:  { icon: Trophy,  color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950' },
}

export default function NotificacoesPage() {
  const router = useRouter()
  const { notifications, unread, markAllRead, markRead } = useNotifications()

  function handleClick(n) {
    markRead(n.id)
    if (n.link) router.push(n.link)
  }

  const cfg = (type) => typeIcon[type] ?? { icon: Bell, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 px-4 py-2 rounded-lg transition-colors"
          >
            <Check size={15} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="text-gray-700 mx-auto mb-3" size={36} />
          <p className="text-gray-500 text-sm">Nenhuma notificação ainda.</p>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Participe de eventos e interaja para receber notificações.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {notifications.map((n, i) => {
            const { icon: Icon, color, bg } = cfg(n.type)
            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleClick(n)}
                onKeyDown={e => { if (e.key === 'Enter') handleClick(n) }}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${!n.read ? 'bg-red-50/20 dark:bg-red-950/20' : ''}`}
              >
                {/* ícone */}
                <div className={`${bg} w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={16} className={color} />
                </div>

                {/* conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.read ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(n.id) }}
                        title="Marcar como lida"
                        className="group shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                      >
                        <span className="w-2 h-2 bg-red-400 rounded-full group-hover:hidden" />
                        <Check size={12} className="hidden group-hover:block text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                  {n.body && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
