'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Calendar, ArrowLeft, Zap, Settings, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const statusLabel = {
  ativo: { label: 'Ao vivo', classes: 'bg-green-50 text-green-600 border-green-200' },
  aguardando: { label: 'Em breve', classes: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  encerrado: { label: 'Encerrado', classes: 'bg-gray-100 text-gray-600 border-gray-300' },
}

function EventoDetalheContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { user } = useAuth()
  const [evento, setEvento] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user) return
    const supabase = createClient()

    Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('event_id', id),
    ]).then(([{ data: ev }, { data: tm }]) => {
      if (!ev) { router.replace('/eventos'); return }
      setEvento(ev)
      setTeams(tm ?? [])
      setLoading(false)
    })
  }, [id, user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-40" />
      </div>
    )
  }

  const status = statusLabel[evento.status] ?? statusLabel.aguardando

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/eventos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para eventos
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${status.classes}`}>
              {status.label}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">{evento.name}</h1>
            {evento.description && <p className="text-gray-600 mt-1">{evento.description}</p>}
          </div>
          {evento.created_by === user?.id && (
            <button className="text-gray-500 hover:text-gray-900 transition-colors p-2">
              <Settings size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{teams.length} equipes</span>
          </div>
          {evento.start_date && (
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>{evento.start_date} – {evento.end_date ?? '?'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/eventos/equipes?id=${id}`}
          className="bg-white border border-gray-200 hover:border-red-700 rounded-2xl p-6 transition-colors group"
        >
          <Users className="text-red-600 mb-3" size={24} />
          <h2 className="text-gray-900 font-semibold text-lg">Equipes</h2>
          <p className="text-gray-600 text-sm mt-1">Entre em uma equipe e escolha sua torcida</p>
        </Link>

        <Link
          href={`/eventos/confrontos?id=${id}`}
          className="bg-white border border-gray-200 hover:border-red-700 rounded-2xl p-6 transition-colors group"
        >
          <Trophy className="text-red-600 mb-3" size={24} />
          <h2 className="text-gray-900 font-semibold text-lg">Confrontos</h2>
          <p className="text-gray-600 text-sm mt-1">Acompanhe placares e enquetes ao vivo</p>
        </Link>

        <Link
          href={`/eventos/pontuacao?id=${id}`}
          className="bg-white border border-gray-200 hover:border-red-700 rounded-2xl p-6 transition-colors group"
        >
          <BarChart3 className="text-red-600 mb-3" size={24} />
          <h2 className="text-gray-900 font-semibold text-lg">Classificação</h2>
          <p className="text-gray-600 text-sm mt-1">Tabela de pontos e ranking das equipes</p>
        </Link>

        <Link
          href={`/eventos/comunidade?id=${id}`}
          className="bg-white border border-gray-200 hover:border-red-700 rounded-2xl p-6 transition-colors group"
        >
          <Zap className="text-red-600 mb-3" size={24} />
          <h2 className="text-gray-900 font-semibold text-lg">Comunidade</h2>
          <p className="text-gray-600 text-sm mt-1">Posts, torcida e interação do evento</p>
        </Link>
      </div>
    </div>
  )
}

export default function EventoDetalhePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <EventoDetalheContent />
    </Suspense>
  )
}
