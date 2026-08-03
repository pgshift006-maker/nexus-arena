'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Check, X, UserPlus, UserCheck, Trash2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'

function ParticipantesContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { user } = useAuth()

  const [evento, setEvento] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function load() {
    if (!id || !user) return
    const supabase = createClient()
    const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
    if (!ev || ev.created_by !== user.id) {
      router.replace(`/eventos/detalhe?id=${id}`)
      return
    }
    setEvento(ev)

    const { data: parts } = await supabase
      .from('event_participants')
      .select('*, profile:profiles!event_participants_user_id_fkey(id, name, avatar_url)')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
    setParticipants(parts ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id, user])

  useEffect(() => {
    if (!id || !user) return
    const supabase = createClient()
    const channel = supabase
      .channel(`event-participants-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants', filter: `event_id=eq.${id}` }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, user])

  const requests = participants.filter(p => p.status === 'pending' && p.initiated_by === 'user')
  const invites = participants.filter(p => p.status === 'pending' && p.initiated_by === 'owner')
  const approved = participants.filter(p => p.status === 'approved')
  const knownUserIds = participants.map(p => p.user_id)

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
    setResults((data ?? []).filter(p => p.id !== user.id && !knownUserIds.includes(p.id)))
    setSearching(false)
  }

  async function handleInvite(userId) {
    setBusyId(userId)
    const supabase = createClient()
    await supabase.from('event_participants').insert({ event_id: id, user_id: userId, initiated_by: 'owner', status: 'pending' })
    setSearch('')
    setResults([])
    await load()
    setBusyId(null)
  }

  async function handleAddDirectly(userId) {
    setBusyId(userId)
    const supabase = createClient()
    await supabase.from('event_participants').insert({ event_id: id, user_id: userId, initiated_by: 'owner', status: 'approved' })
    setSearch('')
    setResults([])
    await load()
    setBusyId(null)
  }

  async function handleResolveRequest(participantId, status) {
    setBusyId(participantId)
    const supabase = createClient()
    await supabase.from('event_participants').update({ status, resolved_at: new Date().toISOString() }).eq('id', participantId)
    await load()
    setBusyId(null)
  }

  async function handleCancelInvite(participantId) {
    setBusyId(participantId)
    const supabase = createClient()
    await supabase.from('event_participants').delete().eq('id', participantId)
    await load()
    setBusyId(null)
  }

  async function handleRemove(participantId) {
    setBusyId(participantId)
    const supabase = createClient()
    await supabase.from('event_participants').delete().eq('id', participantId)
    await load()
    setBusyId(null)
  }

  if (loading || !evento) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href={`/eventos/detalhe?id=${id}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para o evento
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Participantes</h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{evento.name}</p>

      {/* Buscar e convidar/adicionar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar pessoa pelo nome para convidar ou adicionar..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none"
          />
        </div>

        {search.trim() && (
          <div className="mt-2 space-y-1">
            {searching ? (
              <p className="text-gray-500 text-xs px-1 py-2">Buscando...</p>
            ) : results.length === 0 ? (
              <p className="text-gray-500 text-xs px-1 py-2">Nenhuma pessoa encontrada.</p>
            ) : (
              results.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Avatar name={p.name} url={p.avatar_url} size={24} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm flex-1">{p.name}</span>
                  <button
                    onClick={() => handleInvite(p.id)}
                    disabled={busyId === p.id}
                    className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-700 hover:border-red-700 text-gray-600 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-300 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={12} />
                    Convidar
                  </button>
                  <button
                    onClick={() => handleAddDirectly(p.id)}
                    disabled={busyId === p.id}
                    className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserCheck size={12} />
                    Adicionar
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Solicitações pendentes */}
      <Section title={`Solicitações pendentes (${requests.length})`}>
        {requests.length === 0 ? (
          <EmptyRow text="Nenhuma solicitação pendente." />
        ) : requests.map(p => (
          <Row key={p.id} profile={p.profile}>
            <button
              onClick={() => handleResolveRequest(p.id, 'approved')}
              disabled={busyId === p.id}
              className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check size={12} />
              Aprovar
            </button>
            <button
              onClick={() => handleResolveRequest(p.id, 'declined')}
              disabled={busyId === p.id}
              className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={12} />
              Recusar
            </button>
          </Row>
        ))}
      </Section>

      {/* Convites enviados */}
      <Section title={`Convites enviados (${invites.length})`}>
        {invites.length === 0 ? (
          <EmptyRow text="Nenhum convite pendente." />
        ) : invites.map(p => (
          <Row key={p.id} profile={p.profile}>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              Aguardando resposta
            </span>
            <button
              onClick={() => handleCancelInvite(p.id)}
              disabled={busyId === p.id}
              className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={12} />
              Cancelar
            </button>
          </Row>
        ))}
      </Section>

      {/* Participantes aprovados */}
      <Section title={`Participantes (${approved.length})`}>
        {approved.length === 0 ? (
          <EmptyRow text="Ninguém foi aprovado ainda." />
        ) : approved.map(p => (
          <Row key={p.id} profile={p.profile}>
            <button
              onClick={() => handleRemove(p.id)}
              disabled={busyId === p.id}
              className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} />
              Remover
            </button>
          </Row>
        ))}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function Row({ profile, children }) {
  if (!profile) return null
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <Avatar name={profile.name} url={profile.avatar_url} size={28} />
      <span className="text-gray-900 dark:text-white text-sm flex-1 truncate">{profile.name}</span>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  )
}

function EmptyRow({ text }) {
  return <p className="text-gray-500 text-xs px-4 py-4">{text}</p>
}

export default function ParticipantesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ParticipantesContent />
    </Suspense>
  )
}
