'use client'

import { useState } from 'react'
import { Users, LogOut, UserPlus, X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'

export default function EquipeCard({ equipe, currentUserId, myTeamId, isAdmin, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const isMine = myTeamId === equipe.id
  const members = (equipe.members ?? []).filter(m => m.profile)
  const memberIds = members.map(m => m.profile.id)

  async function handleLeave() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('team_members').delete().match({ team_id: equipe.id, user_id: currentUserId })
    setLoading(false)
    onUpdate()
  }

  async function handleSearch(value) {
    setSearch(value)
    if (!value.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .ilike('name', `%${value.trim()}%`)
      .limit(6)
    setResults((data ?? []).filter(p => !memberIds.includes(p.id)))
    setSearching(false)
  }

  async function handleAddPlayer(userId) {
    setLoading(true)
    const supabase = createClient()

    // Remove de qualquer outra equipe do mesmo evento antes de adicionar nesta
    const { data: teamsInEvent } = await supabase.from('teams').select('id').eq('event_id', equipe.event_id)
    const teamIds = (teamsInEvent ?? []).map(t => t.id)
    if (teamIds.length > 0) {
      await supabase.from('team_members').delete().eq('user_id', userId).in('team_id', teamIds)
    }

    await supabase.from('team_members').insert({ team_id: equipe.id, user_id: userId })
    setLoading(false)
    setSearch('')
    setResults([])
    setAdding(false)
    onUpdate()
  }

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${isMine ? 'border-red-600' : 'border-gray-800'}`}>
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
                <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
                  Minha equipe
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{members.length} {members.length === 1 ? 'membro' : 'membros'}</p>
          </div>
        </div>

        {isMine && (
          <button
            onClick={handleLeave}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-900 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut size={13} />
            Sair
          </button>
        )}
      </div>

      {(members.length > 0 || isAdmin) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {members.map(({ profile }) => (
            <div key={profile.id} className="flex items-center gap-1.5 bg-gray-800 rounded-full px-2.5 py-1">
              <Avatar name={profile.name} url={profile.avatar_url} size={20} />
              <span className="text-gray-300 text-xs">{profile.name}</span>
            </div>
          ))}

          {isAdmin && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 border border-dashed border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-300 rounded-full px-2.5 py-1 text-xs transition-colors"
            >
              <UserPlus size={13} />
              Adicionar jogador
            </button>
          )}
        </div>
      )}

      {isAdmin && adding && (
        <div className="mt-4 bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-500" />
              <input
                autoFocus
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar jogador pelo nome..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setAdding(false); setSearch(''); setResults([]) }}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {search.trim() && (
            <div className="mt-2 space-y-1">
              {searching ? (
                <p className="text-gray-500 text-xs px-1 py-2">Buscando...</p>
              ) : results.length === 0 ? (
                <p className="text-gray-500 text-xs px-1 py-2">Nenhum jogador encontrado.</p>
              ) : (
                results.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddPlayer(p.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar name={p.name} url={p.avatar_url} size={24} />
                    <span className="text-gray-200 text-sm flex-1">{p.name}</span>
                    <UserPlus size={14} className="text-red-400" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
