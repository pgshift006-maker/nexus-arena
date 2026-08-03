'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Calendar, ArrowLeft, Zap, Settings, BarChart3, Lock, Globe, UserCog, Clock, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const statusLabel = {
  ativo: { label: 'Ao vivo', classes: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900' },
  aguardando: { label: 'Em breve', classes: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' },
  encerrado: { label: 'Encerrado', classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700' },
}

function EventoDetalheContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { user } = useAuth()
  const [evento, setEvento] = useState(null)
  const [teams, setTeams] = useState([])
  const [participation, setParticipation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  async function load() {
    if (!id || !user) return
    const supabase = createClient()

    const [{ data: ev }, { data: tm }, { data: part }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('event_id', id),
      supabase.from('event_participants').select('*').eq('event_id', id).eq('user_id', user.id).maybeSingle(),
    ])
    if (!ev) { router.replace('/eventos'); return }
    setEvento(ev)
    setTeams(tm ?? [])
    setParticipation(part ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [id, user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 animate-pulse h-40" />
      </div>
    )
  }

  const status = statusLabel[evento.status] ?? statusLabel.aguardando
  const isOwner = evento.created_by === user?.id
  const isApproved = isOwner || participation?.status === 'approved'
  const isPrivate = evento.visibility === 'private'
  const locked = isPrivate && !isApproved

  async function handleRequestJoin() {
    setActing(true)
    const supabase = createClient()
    await supabase.from('event_participants').insert({ event_id: id, user_id: user.id, initiated_by: 'user', status: 'pending' })
    await load()
    setActing(false)
  }

  async function handleRetryRequest() {
    setActing(true)
    const supabase = createClient()
    await supabase.from('event_participants').delete().eq('event_id', id).eq('user_id', user.id)
    await supabase.from('event_participants').insert({ event_id: id, user_id: user.id, initiated_by: 'user', status: 'pending' })
    await load()
    setActing(false)
  }

  async function handleResolveInvite(newStatus) {
    setActing(true)
    const supabase = createClient()
    await supabase.from('event_participants').update({ status: newStatus, resolved_at: new Date().toISOString() }).eq('id', participation.id)
    await load()
    setActing(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/eventos" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para eventos
      </Link>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
        {evento.cover_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={evento.cover_url} alt="" className="w-full h-40 object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${status.classes}`}>
                  {status.label}
                </span>
                <span className="text-xs border px-2 py-0.5 rounded-full font-medium flex items-center gap-1 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700">
                  {isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                  {isPrivate ? 'Privada' : 'Pública'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{evento.name}</h1>
              {evento.description && <p className="text-gray-600 dark:text-gray-400 mt-1">{evento.description}</p>}
            </div>
            {isOwner && (
              <button
                onClick={() => router.push(`/eventos/editar?id=${id}`)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2"
                title="Editar evento"
              >
                <Settings size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-600 dark:text-gray-400">
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
      </div>

      {locked ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center mx-auto mb-4">
            <Lock size={20} />
          </div>

          {!participation && (
            <>
              <h2 className="text-gray-900 dark:text-white font-semibold mb-1">Competição privada</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto mb-5">
                Só participantes aprovados veem equipes, confrontos e a comunidade dessa competição.
              </p>
              <button
                onClick={handleRequestJoin}
                disabled={acting}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                {acting ? 'Enviando...' : 'Solicitar entrada'}
              </button>
            </>
          )}

          {participation?.status === 'pending' && participation.initiated_by === 'user' && (
            <>
              <h2 className="text-gray-900 dark:text-white font-semibold mb-1 flex items-center justify-center gap-2">
                <Clock size={16} />
                Aguardando aprovação
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
                Sua solicitação para entrar foi enviada ao dono da competição.
              </p>
            </>
          )}

          {participation?.status === 'pending' && participation.initiated_by === 'owner' && (
            <>
              <h2 className="text-gray-900 dark:text-white font-semibold mb-1">Você foi convidado</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto mb-5">
                O dono desta competição te convidou para participar.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleResolveInvite('approved')}
                  disabled={acting}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  <Check size={14} />
                  Aceitar
                </button>
                <button
                  onClick={() => handleResolveInvite('declined')}
                  disabled={acting}
                  className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400 text-gray-700 dark:text-gray-300 font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  <X size={14} />
                  Recusar
                </button>
              </div>
            </>
          )}

          {participation?.status === 'declined' && (
            <>
              <h2 className="text-gray-900 dark:text-white font-semibold mb-1">Solicitação recusada</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto mb-5">
                Você pode tentar solicitar entrada novamente.
              </p>
              <button
                onClick={handleRetryRequest}
                disabled={acting}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                {acting ? 'Enviando...' : 'Solicitar novamente'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/eventos/equipes?id=${id}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-700 rounded-2xl p-6 transition-colors group"
          >
            <Users className="text-red-600 dark:text-red-400 mb-3" size={24} />
            <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Equipes</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Entre em uma equipe e escolha sua torcida</p>
          </Link>

          <Link
            href={`/eventos/confrontos?id=${id}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-700 rounded-2xl p-6 transition-colors group"
          >
            <Trophy className="text-red-600 dark:text-red-400 mb-3" size={24} />
            <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Confrontos</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Acompanhe placares e enquetes ao vivo</p>
          </Link>

          <Link
            href={`/eventos/pontuacao?id=${id}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-700 rounded-2xl p-6 transition-colors group"
          >
            <BarChart3 className="text-red-600 dark:text-red-400 mb-3" size={24} />
            <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Classificação</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Tabela de pontos e ranking das equipes</p>
          </Link>

          <Link
            href={`/eventos/comunidade?id=${id}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-700 rounded-2xl p-6 transition-colors group"
          >
            <Zap className="text-red-600 dark:text-red-400 mb-3" size={24} />
            <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Comunidade</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Posts, torcida e interação do evento</p>
          </Link>

          {isOwner && isPrivate && (
            <Link
              href={`/eventos/participantes?id=${id}`}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-700 rounded-2xl p-6 transition-colors group"
            >
              <UserCog className="text-red-600 dark:text-red-400 mb-3" size={24} />
              <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Participantes</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Solicitações, convites e membros</p>
            </Link>
          )}
        </div>
      )}
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
