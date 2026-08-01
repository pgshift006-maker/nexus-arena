'use client'

import { useState } from 'react'
import { Users, LogIn, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

export default function EquipeCard({ equipe, currentUserId, myTeamId, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const isMine = myTeamId === equipe.id
  const members = equipe.members ?? []

  async function handleJoin() {
    setLoading(true)
    const supabase = createClient()

    // Sai da equipe atual se tiver
    if (myTeamId) {
      await supabase.from('team_members').delete().match({ user_id: currentUserId, team_id: myTeamId })
    }

    await supabase.from('team_members').insert({ team_id: equipe.id, user_id: currentUserId })
    setLoading(false)
    onUpdate()
  }

  async function handleLeave() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('team_members').delete().match({ team_id: equipe.id, user_id: currentUserId })
    setLoading(false)
    onUpdate()
  }

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${isMine ? 'border-indigo-600' : 'border-gray-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: equipe.color + '33', border: `2px solid ${equipe.color}` }}
          >
            <Users size={18} style={{ color: equipe.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">{equipe.name}</h3>
              {isMine && (
                <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded-full">
                  Minha equipe
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{members.length} {members.length === 1 ? 'membro' : 'membros'}</p>
          </div>
        </div>

        {isMine ? (
          <button
            onClick={handleLeave}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-900 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut size={13} />
            Sair
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-indigo-300 border border-indigo-800 hover:bg-indigo-950 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogIn size={13} />
            Entrar
          </button>
        )}
      </div>

      {members.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {members.map(({ profile }) => (
            <div key={profile.id} className="flex items-center gap-1.5 bg-gray-800 rounded-full px-2.5 py-1">
              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(profile.name)}
              </div>
              <span className="text-gray-300 text-xs">{profile.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
