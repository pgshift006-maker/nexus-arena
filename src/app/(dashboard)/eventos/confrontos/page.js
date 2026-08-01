'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import ConfrontoCard from '@/components/eventos/ConfrontoCard'

function ConfrontosContent() {
  const searchParams  = useSearchParams()
  const eventoId      = searchParams.get('id')
  const { user }      = useAuth()

  const [evento,    setEvento]    = useState(null)
  const [matches,   setMatches]   = useState([])
  const [teams,     setTeams]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [criando,   setCriando]   = useState(false)
  const [form,      setForm]      = useState({ team_a_id: '', team_b_id: '', scheduled_at: '' })
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    if (!eventoId || !user) return
    const supabase = createClient()

    const [{ data: ev }, { data: tm }, { data: mt }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventoId).single(),
      supabase.from('teams').select('*').eq('event_id', eventoId).order('name'),
      supabase
        .from('matches')
        .select('*, polls(*, poll_votes(*))')
        .eq('event_id', eventoId)
        .order('created_at'),
    ])

    setEvento(ev)
    setTeams(tm ?? [])
    setMatches(mt ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [eventoId, user])

  useEffect(() => {
    if (!eventoId || !user) return
    const supabase = createClient()

    const channel = supabase
      .channel('confrontos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches',    filter: `event_id=eq.${eventoId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' },      load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventoId, user])

  async function handleCriar(e) {
    e.preventDefault()
    setFormError('')

    if (form.team_a_id === form.team_b_id) {
      setFormError('Selecione equipes diferentes.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    await supabase.from('matches').insert({
      event_id:     eventoId,
      team_a_id:    form.team_a_id,
      team_b_id:    form.team_b_id,
      scheduled_at: form.scheduled_at || null,
      status:       'aguardando',
    })

    setForm({ team_a_id: '', team_b_id: '', scheduled_at: '' })
    setCriando(false)
    setSaving(false)
  }

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const isAdmin = evento?.created_by === user?.id

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href={`/eventos/detalhe?id=${eventoId}`}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {evento?.name || 'Voltar ao evento'}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Confrontos</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin ? 'Gerencie placares e enquetes em tempo real' : 'Placares e enquetes em tempo real'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCriando(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            Novo confronto
          </button>
        )}
      </div>

      {/* Formulário criar confronto */}
      {criando && (
        <div className="bg-gray-900 border border-indigo-700 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Novo confronto</h2>
            <button onClick={() => { setCriando(false); setFormError('') }} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {teams.length < 2 ? (
            <p className="text-yellow-400 text-sm">
              Você precisa de pelo menos 2 equipes para criar um confronto.{' '}
              <Link href={`/eventos/equipes?id=${eventoId}`} className="underline">Criar equipes</Link>
            </p>
          ) : (
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Equipe A</label>
                  <select
                    value={form.team_a_id}
                    onChange={e => setForm(p => ({ ...p, team_a_id: e.target.value }))}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Selecione...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Equipe B</label>
                  <select
                    value={form.team_b_id}
                    onChange={e => setForm(p => ({ ...p, team_b_id: e.target.value }))}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Selecione...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Data e hora (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-sm bg-red-950 border border-red-900 rounded-lg px-4 py-2.5">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {saving ? 'Criando...' : 'Criar confronto'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCriando(false); setFormError('') }}
                  className="px-4 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Lista de confrontos */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse h-40" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          {isAdmin
            ? <><p>Nenhum confronto criado.</p><button onClick={() => setCriando(true)} className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">Criar o primeiro confronto</button></>
            : <p>Nenhum confronto criado ainda.</p>
          }
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map(match => (
            <ConfrontoCard
              key={match.id}
              match={match}
              teamMap={teamMap}
              currentUserId={user?.id}
              isAdmin={isAdmin}
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
