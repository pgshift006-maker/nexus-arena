'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import ConfrontoCard from '@/components/eventos/ConfrontoCard'

function ConfrontosContent() {
  const searchParams = useSearchParams()
  const eventoId = searchParams.get('id')
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventoNome, setEventoNome] = useState('')

  useEffect(() => {
    if (!eventoId || !user) return
    const supabase = createClient()

    async function load() {
      const [{ data: ev }, { data: tm }, { data: mt }] = await Promise.all([
        supabase.from('events').select('name').eq('id', eventoId).single(),
        supabase.from('teams').select('*').eq('event_id', eventoId),
        supabase.from('matches').select(`*, polls(*, poll_votes(*))`).eq('event_id', eventoId).order('created_at'),
      ])
      setEventoNome(ev?.name ?? '')
      setTeams(tm ?? [])
      setMatches(mt ?? [])
      setLoading(false)
    }

    load()

    // Realtime: placar e votos ao vivo
    const channel = supabase
      .channel('confrontos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `event_id=eq.${eventoId}` },
        () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' },
        () => load())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventoId, user])

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href={`/eventos/detalhe?id=${eventoId}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        {eventoNome || 'Voltar'}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Confrontos</h1>
          <p className="text-gray-400 text-sm mt-1">Placares e enquetes em tempo real</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse h-36" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          Nenhum confronto criado ainda.
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map(match => (
            <ConfrontoCard
              key={match.id}
              match={match}
              teamMap={teamMap}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ConfrontosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ConfrontosContent />
    </Suspense>
  )
}
