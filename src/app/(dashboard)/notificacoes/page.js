'use client'

import { useRouter } from 'next/navigation'
import { Bell, Check, Zap, Heart, Trophy } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { timeAgo } from '@/lib/utils'

const typeIcon = {
  like:       { icon: Heart,   color: 'text-red-600',    bg: 'bg-red-50'    },
  ao_vivo:    { icon: Zap,     color: 'text-green-600',  bg: 'bg-green-50'  },
  encerrado:  { icon: Trophy,  color: 'text-red-600', bg: 'bg-red-50' },
  new_match:  { icon: Trophy,  color: 'text-yellow-600', bg: 'bg-yellow-50' },
}

export default function NotificacoesPage() {
  const router = useRouter()
  const { notifications, unread, markAllRead, markRead } = useNotifications()

  function handleClick(n) {
    markRead(n.id)
    if (n.link) router.push(n.link)
  }

  const cfg = (type) => typeIcon[type] ?? { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600 text-sm mt-1">
            {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
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
          <p className="text-gray-400 text-xs mt-1">Participe de eventos e interaja para receber notificações.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {notifications.map((n, i) => {
            const { icon: Icon, color, bg } = cfg(n.type)
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 border-b border-gray-200 last:border-0 hover:bg-gray-100 transition-colors ${!n.read ? 'bg-red-50/20' : ''}`}
              >
                {/* ícone */}
                <div className={`${bg} w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={16} className={color} />
                </div>

                {/* conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.read ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    {!n.read && <div className="w-2 h-2 bg-red-400 rounded-full shrink-0 mt-1" />}
                  </div>
                  {n.body && <p className="text-xs text-gray-600 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
