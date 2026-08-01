'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ConfrontoCard({ match, teamMap, currentUserId }) {
  const { id, team_a_id, team_b_id, score_a, score_b, status, polls } = match
  const poll = polls?.[0] ?? null
  const isLive = status === 'ao_vivo'

  const teamA = teamMap[team_a_id] ?? { name: 'Equipe A' }
  const teamB = teamMap[team_b_id] ?? { name: 'Equipe B' }

  const votes = poll?.poll_votes ?? []
  const total = votes.length
  const votesA = votes.filter(v => v.team_id === team_a_id).length
  const votesB = votes.filter(v => v.team_id === team_b_id).length
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50
  const pctB = 100 - pctA

  const myVote = votes.find(v => v.user_id === currentUserId)
  const [voting, setVoting] = useState(false)

  async function handleVote(teamId) {
    if (!poll || voting || myVote) return
    setVoting(true)
    const supabase = createClient()
    await supabase.from('poll_votes').insert({ poll_id: poll.id, user_id: currentUserId, team_id: teamId })
    setVoting(false)
  }

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${isLive ? 'border-indigo-700' : 'border-gray-800'}`}>
      {isLive && (
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-4">
          <Zap size={12} />
          AO VIVO
        </div>
      )}

      {/* Placar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-white font-semibold">{teamA.name}</p>
          <p className="text-4xl font-bold text-white mt-1">{score_a}</p>
        </div>
        <div className="text-gray-500 font-bold text-xl">×</div>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold">{teamB.name}</p>
          <p className="text-4xl font-bold text-white mt-1">{score_b}</p>
        </div>
      </div>

      {/* Enquete */}
      {poll && (
        <div className="mt-5">
          <p className="text-gray-400 text-xs mb-2 text-center">
            Quem vai ganhar? • {total} {total === 1 ? 'voto' : 'votos'}
          </p>
          <div className="flex rounded-full overflow-hidden h-3">
            <div className="bg-indigo-500 transition-all duration-500" style={{ width: `${pctA}%` }} />
            <div className="bg-purple-500 transition-all duration-500" style={{ width: `${pctB}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>{teamA.name} {pctA}%</span>
            <span>{pctB}% {teamB.name}</span>
          </div>

          {!myVote ? (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleVote(team_a_id)}
                disabled={voting}
                className="flex-1 border border-indigo-700 hover:bg-indigo-950 disabled:opacity-50 text-indigo-300 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Votar em {teamA.name}
              </button>
              <button
                onClick={() => handleVote(team_b_id)}
                disabled={voting}
                className="flex-1 border border-purple-700 hover:bg-purple-950 disabled:opacity-50 text-purple-300 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Votar em {teamB.name}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-gray-500 mt-3">
              Você votou em <span className="text-indigo-400">{teamMap[myVote.team_id]?.name ?? 'sua equipe'}</span>
            </p>
          )}
        </div>
      )}

      {!poll && status === 'aguardando' && (
        <p className="text-center text-gray-500 text-sm mt-4">Confronto ainda não iniciado</p>
      )}
    </div>
  )
}
