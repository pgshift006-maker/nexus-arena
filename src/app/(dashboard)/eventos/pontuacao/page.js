'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

function calcularClassificacao(teams, matches) {
  const tabela = Object.fromEntries(
    teams.map(t => [t.id, { team: t, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, PTS: 0 }])
  )

  for (const m of matches) {
    if (m.status !== 'encerrado') continue
    const a = tabela[m.team_a_id]
    const b = tabela[m.team_b_id]
    if (!a || !b) continue

    a.J++; b.J++
    a.GP += m.score_a; a.GC += m.score_b
    b.GP += m.score_b; b.GC += m.score_a

    if (m.score_a > m.score_b)      { a.V++; a.PTS += 3; b.D++ }
    else if (m.score_b > m.score_a) { b.V++; b.PTS += 3; a.D++ }
    else                             { a.E++; a.PTS++; b.E++; b.PTS++ }
  }

  return Object.values(tabela).sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS
    const sgB = b.GP - b.GC, sgA = a.GP - a.GC
    if (sgB !== sgA) return sgB - sgA
    return b.GP - a.GP
  })
}

const posIcon = (pos) => {
  if (pos === 1) return <Trophy size={15} className="text-yellow-600 dark:text-yellow-400" />
  if (pos === 2) return <Medal  size={15} className="text-gray-700 dark:text-gray-300" />
  if (pos === 3) return <Medal  size={15} className="text-amber-600" />
  return <span className="text-gray-500 text-sm font-medium w-4 text-center">{pos}</span>
}

function PontuacaoContent() {
  const searchParams = useSearchParams()
  const eventoId     = searchParams.get('id')
  const { user }     = useAuth()

  const [evento,  setEvento]  = useState(null)
  const [tabela,  setTabela]  = useState([])
  const [myTeamId, setMyTeamId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [jogados, setJogados] = useState(0)
  const [aoVivo,  setAoVivo]  = useState(0)

  async function load() {
    if (!eventoId || !user) return
    const supabase = createClient()

    const [{ data: ev }, { data: tm }, { data: mt }, { data: memb }] = await Promise.all([
      supabase.from('events').select('name').eq('id', eventoId).single(),
      supabase.from('teams').select('*').eq('event_id', eventoId),
      supabase.from('matches').select('*').eq('event_id', eventoId),
      supabase.from('team_members').select('team_id').eq('user_id', user.id),
    ])

    setEvento(ev)
    setTabela(calcularClassificacao(tm ?? [], mt ?? []))
    setMyTeamId(memb?.[0]?.team_id ?? null)
    setJogados((mt ?? []).filter(m => m.status === 'encerrado').length)
    setAoVivo((mt ?? []).filter(m => m.status === 'ao_vivo').length)
    setLoading(false)
  }

  useEffect(() => { load() }, [eventoId, user])

  useEffect(() => {
    if (!eventoId || !user) return
    const supabase = createClient()
    const channel = supabase
      .channel('pontuacao-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `event_id=eq.${eventoId}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [eventoId, user])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href={`/eventos/detalhe?id=${eventoId}`}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {evento?.name || 'Voltar ao evento'}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classificação</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {jogados} confronto{jogados !== 1 ? 's' : ''} encerrado{jogados !== 1 ? 's' : ''}
            {aoVivo > 0 && <span className="text-green-600 dark:text-green-400 ml-2">• {aoVivo} ao vivo</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      ) : tabela.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          <p>Nenhuma equipe criada ainda.</p>
          <Link href={`/eventos/equipes?id=${eventoId}`} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-2 inline-block">
            Criar equipes
          </Link>
        </div>
      ) : (
        <>
          {/* Tabela */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_repeat(7,auto)] items-center gap-x-4 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 font-medium">
              <span className="w-6 text-center">#</span>
              <span>Equipe</span>
              <span className="w-6 text-center" title="Jogos">J</span>
              <span className="w-6 text-center" title="Vitórias">V</span>
              <span className="w-6 text-center" title="Empates">E</span>
              <span className="w-6 text-center" title="Derrotas">D</span>
              <span className="w-7 text-center" title="Saldo de Gols">SG</span>
              <span className="w-7 text-center" title="Gols Pró">GP</span>
              <span className="w-8 text-center font-bold text-gray-600 dark:text-gray-400" title="Pontos">PTS</span>
            </div>

            {tabela.map((row, idx) => {
              const pos      = idx + 1
              const isMe     = row.team.id === myTeamId
              const sg       = row.GP - row.GC

              return (
                <div
                  key={row.team.id}
                  className={`grid grid-cols-[auto_1fr_repeat(7,auto)] items-center gap-x-4 px-4 py-3 border-b border-gray-200 last:border-0 transition-colors ${
                    isMe ? 'bg-red-50/40 dark:bg-red-950/40' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {/* Posição */}
                  <div className="w-6 flex items-center justify-center">{posIcon(pos)}</div>

                  {/* Equipe */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: row.team.color }}
                    />
                    <span className={`text-sm truncate ${isMe ? 'text-red-700 dark:text-red-300 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                      {row.team.name}
                    </span>
                    {isMe && (
                      <span className="text-xs text-red-500 shrink-0">(você)</span>
                    )}
                  </div>

                  {/* Stats */}
                  <span className="w-6 text-center text-sm text-gray-600 dark:text-gray-400">{row.J}</span>
                  <span className="w-6 text-center text-sm text-green-600 dark:text-green-400">{row.V}</span>
                  <span className="w-6 text-center text-sm text-yellow-600 dark:text-yellow-400">{row.E}</span>
                  <span className="w-6 text-center text-sm text-red-600 dark:text-red-400">{row.D}</span>
                  <span className={`w-7 text-center text-sm ${sg > 0 ? 'text-green-600 dark:text-green-400' : sg < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {sg > 0 ? `+${sg}` : sg}
                  </span>
                  <span className="w-7 text-center text-sm text-gray-600 dark:text-gray-400">{row.GP}</span>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{row.PTS}</span>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 dark:text-gray-600">
            {[['J','Jogos'],['V','Vitórias'],['E','Empates'],['D','Derrotas'],['SG','Saldo de gols'],['GP','Gols pró'],['PTS','Pontos']].map(([k, v]) => (
              <span key={k}><span className="text-gray-600 dark:text-gray-400 font-medium">{k}</span> = {v}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function PontuacaoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PontuacaoContent />
    </Suspense>
  )
}
