'use client'

import { useState } from 'react'
import { Zap, Plus, Minus, BarChart3, CheckCircle, PlayCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const statusConfig = {
  aguardando: { label: 'Aguardando', icon: Clock, classes: 'text-yellow-600 dark:text-yellow-400' },
  ao_vivo:    { label: 'Ao vivo',    icon: Zap,   classes: 'text-green-600 dark:text-green-400'  },
  encerrado:  { label: 'Encerrado',  icon: CheckCircle, classes: 'text-gray-600 dark:text-gray-400' },
}

const nextStatus = { aguardando: 'ao_vivo', ao_vivo: 'encerrado' }
const nextStatusLabel = { aguardando: 'Iniciar confronto', ao_vivo: 'Encerrar confronto' }

export default function ConfrontoCard({ match, teamMap, currentUserId, isAdmin }) {
  const { id, team_a_id, team_b_id, score_a, score_b, status, polls } = match
  const poll = polls?.[0] ?? null
  const isLive = status === 'ao_vivo'
  const isOver = status === 'encerrado'

  const teamA = teamMap[team_a_id] ?? { name: 'Equipe A' }
  const teamB = teamMap[team_b_id] ?? { name: 'Equipe B' }

  const votes      = poll?.poll_votes ?? []
  const total      = votes.length
  const votesA     = votes.filter(v => v.team_id === team_a_id).length
  const pctA       = total > 0 ? Math.round((votesA / total) * 100) : 50
  const pctB       = 100 - pctA
  const myVote     = votes.find(v => v.user_id === currentUserId)

  const [voting,    setVoting]    = useState(false)
  const [updating,  setUpdating]  = useState(false)
  const [creatingPoll, setCreatingPoll] = useState(false)

  // --- ações admin ---
  async function changeScore(team, delta) {
    if (updating || isOver) return
    setUpdating(true)
    const supabase = createClient()
    const field  = team === 'a' ? 'score_a' : 'score_b'
    const current = team === 'a' ? score_a : score_b
    const next    = Math.max(0, current + delta)
    await supabase.from('matches').update({ [field]: next }).eq('id', id)
    setUpdating(false)
  }

  async function changeStatus() {
    if (!nextStatus[status]) return
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('matches').update({ status: nextStatus[status] }).eq('id', id)
    setUpdating(false)
  }

  async function createPoll() {
    setCreatingPoll(true)
    const supabase = createClient()
    await supabase.from('polls').insert({ match_id: id, question: 'Quem vai ganhar?' })
    setCreatingPoll(false)
  }

  async function togglePoll() {
    const supabase = createClient()
    await supabase.from('polls').update({ is_open: !poll.is_open }).eq('id', poll.id)
  }

  // --- ação aluno ---
  async function handleVote(teamId) {
    if (!poll?.is_open || voting || myVote) return
    setVoting(true)
    const supabase = createClient()
    await supabase.from('poll_votes').insert({ poll_id: poll.id, user_id: currentUserId, team_id: teamId })
    setVoting(false)
  }

  const StatusIcon = statusConfig[status]?.icon ?? Clock

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 transition-colors ${isLive ? 'border-red-700' : 'border-gray-200 dark:border-gray-800'}`}>

      {/* cabeçalho status */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${statusConfig[status]?.classes}`}>
          <StatusIcon size={12} />
          {statusConfig[status]?.label}
        </div>
        {isAdmin && nextStatus[status] && (
          <button
            onClick={changeStatus}
            disabled={updating}
            className="text-xs border border-gray-300 dark:border-gray-700 hover:border-red-600 text-gray-600 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <PlayCircle size={11} className="inline mr-1" />
            {nextStatusLabel[status]}
          </button>
        )}
      </div>

      {/* placar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-gray-900 dark:text-white font-semibold truncate">{teamA.name}</p>
          {isAdmin && !isOver ? (
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => changeScore('a', -1)} disabled={updating} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-center disabled:opacity-40">
                <Minus size={13} />
              </button>
              <span className="text-4xl font-bold text-gray-900 dark:text-white w-10 text-center">{score_a}</span>
              <button onClick={() => changeScore('a', 1)} disabled={updating} className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center disabled:opacity-40">
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{score_a}</p>
          )}
        </div>

        <div className="text-gray-400 dark:text-gray-600 font-bold text-xl">×</div>

        <div className="flex-1 text-center">
          <p className="text-gray-900 dark:text-white font-semibold truncate">{teamB.name}</p>
          {isAdmin && !isOver ? (
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => changeScore('b', -1)} disabled={updating} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-center disabled:opacity-40">
                <Minus size={13} />
              </button>
              <span className="text-4xl font-bold text-gray-900 dark:text-white w-10 text-center">{score_b}</span>
              <button onClick={() => changeScore('b', 1)} disabled={updating} className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center disabled:opacity-40">
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{score_b}</p>
          )}
        </div>
      </div>

      {/* enquete */}
      {poll ? (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 dark:text-gray-400 text-xs">{poll.question} • {total} {total === 1 ? 'voto' : 'votos'}</p>
            {isAdmin && (
              <button onClick={togglePoll} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                {poll.is_open ? 'Encerrar enquete' : 'Reabrir enquete'}
              </button>
            )}
          </div>
          <div className="flex rounded-full overflow-hidden h-3">
            <div className="bg-red-500 transition-all duration-500" style={{ width: `${pctA}%` }} />
            <div className="bg-purple-500 transition-all duration-500" style={{ width: `${pctB}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1.5">
            <span>{teamA.name} {pctA}%</span>
            <span>{pctB}% {teamB.name}</span>
          </div>

          {poll.is_open && !myVote && !isAdmin && (
            <div className="flex gap-3 mt-3">
              <button onClick={() => handleVote(team_a_id)} disabled={voting}
                className="flex-1 border border-red-700 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 text-red-700 dark:text-red-300 text-sm font-medium py-2 rounded-lg transition-colors">
                {teamA.name}
              </button>
              <button onClick={() => handleVote(team_b_id)} disabled={voting}
                className="flex-1 border border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 disabled:opacity-50 text-purple-700 dark:text-purple-300 text-sm font-medium py-2 rounded-lg transition-colors">
                {teamB.name}
              </button>
            </div>
          )}
          {myVote && (
            <p className="text-center text-xs text-gray-500 mt-3">
              Você votou em <span className="text-red-600 dark:text-red-400">{teamMap[myVote.team_id]?.name ?? 'sua equipe'}</span>
            </p>
          )}
          {!poll.is_open && (
            <p className="text-center text-xs text-gray-500 mt-3">Enquete encerrada</p>
          )}
        </div>
      ) : isAdmin ? (
        <button
          onClick={createPoll}
          disabled={creatingPoll}
          className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 hover:border-red-600 text-gray-500 hover:text-red-600 dark:hover:text-red-400 text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <BarChart3 size={15} />
          {creatingPoll ? 'Criando...' : 'Criar enquete ao vivo'}
        </button>
      ) : (
        <p className="text-center text-gray-400 dark:text-gray-600 text-xs mt-4">Sem enquete para este confronto</p>
      )}
    </div>
  )
}
