'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import ConfrontoCard from '@/components/eventos/ConfrontoCard'

function ConfrontosContent() {
  const searchParams  = useSearchParams()
  const eventoId      = searchParams.get('id')
  const { user } = useAuth()

  const [evento,      setEvento]      = useState(null)
  const [matches,     setMatches]     = useState([])
  const [teams,       setTeams]       = useState([])
  const [modalidades, setModalidades] = useState([])
  const [modalidadeAtiva, setModalidadeAtiva] = useState('todas')
  const [novaModalidade, setNovaModalidade] = useState('')
  const [criandoModalidade, setCriandoModalidade] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [criando,   setCriando]   = useState(false)
  const [form,      setForm]      = useState({ team_a_id: '', team_b_id: '', modalidade_id: '', scheduled_at: '' })
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    if (!eventoId || !user) return
    const supabase = createClient()

    const [{ data: ev }, { data: tm }, { data: mt }, { data: mo }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventoId).single(),
      supabase.from('teams').select('*').eq('event_id', eventoId).order('name'),
      supabase
        .from('matches')
        .select('*, polls(*, poll_votes(*))')
        .eq('event_id', eventoId)
        .order('created_at'),
      supabase.from('modalidades').select('*').eq('event_id', eventoId).order('created_at'),
    ])

    setEvento(ev)
    setTeams(tm ?? [])
    setMatches(mt ?? [])
    setModalidades(mo ?? [])
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modalidades', filter: `event_id=eq.${eventoId}` }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventoId, user])

  async function handleCriarModalidade(e) {
    e.preventDefault()
    if (!novaModalidade.trim()) return
    setCriandoModalidade(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('modalidades')
      .insert({ event_id: eventoId, name: novaModalidade.trim() })
      .select()
      .single()
    setNovaModalidade('')
    setCriandoModalidade(false)
    if (data) {
      setModalidades(prev => [...prev, data])
      setForm(p => ({ ...p, modalidade_id: data.id }))
    }
  }

  async function handleCriar(e) {
    e.preventDefault()
    setFormError('')

    if (form.team_a_id === form.team_b_id) {
      setFormError('Selecione equipes diferentes.')
      return
    }
    if (!form.modalidade_id) {
      setFormError('Selecione a modalidade.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    await supabase.from('matches').insert({
      event_id:      eventoId,
      team_a_id:     form.team_a_id,
      team_b_id:     form.team_b_id,
      modalidade_id: form.modalidade_id,
      scheduled_at:  form.scheduled_at || null,
      status:        'aguardando',
    })

    setForm({ team_a_id: '', team_b_id: '', modalidade_id: '', scheduled_at: '' })
    setCriando(false)
    setSaving(false)
  }

  const isAdmin = evento?.created_by === user?.id
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const modalidadeMap = Object.fromEntries(modalidades.map(m => [m.id, m]))
  const matchesFiltrados = modalidadeAtiva === 'todas'
    ? matches
    : matches.filter(m => m.modalidade_id === modalidadeAtiva)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href={`/eventos/detalhe?id=${eventoId}`}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {evento?.name || 'Voltar ao evento'}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confrontos</h1>
          <p className="text-gray-600 text-sm mt-1">
            {isAdmin ? 'Gerencie placares e enquetes em tempo real' : 'Placares e enquetes em tempo real'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCriando(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            Novo confronto
          </button>
        )}
      </div>

      {/* Modalidades (esportes da gincana) */}
      {(modalidades.length > 0 || isAdmin) && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setModalidadeAtiva('todas')}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              modalidadeAtiva === 'todas'
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-gray-300 text-gray-600 hover:text-gray-900'
            }`}
          >
            Todas
          </button>
          {modalidades.map(m => (
            <button
              key={m.id}
              onClick={() => setModalidadeAtiva(m.id)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                modalidadeAtiva === m.id
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              {m.name}
            </button>
          ))}
          {isAdmin && (
            <form onSubmit={handleCriarModalidade} className="flex items-center gap-1.5 shrink-0">
              <input
                value={novaModalidade}
                onChange={e => setNovaModalidade(e.target.value)}
                placeholder="Nova modalidade"
                className="w-32 bg-gray-100 border border-dashed border-gray-300 rounded-full px-3 py-1.5 text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="submit"
                disabled={criandoModalidade || !novaModalidade.trim()}
                className="text-red-600 hover:text-red-700 disabled:opacity-40 shrink-0"
              >
                <Sparkles size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Formulário criar confronto */}
      {criando && (
        <div className="bg-white border border-red-700 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-semibold">Novo confronto</h2>
            <button onClick={() => { setCriando(false); setFormError('') }} className="text-gray-500 hover:text-gray-900 transition-colors">
              <X size={18} />
            </button>
          </div>

          {teams.length < 2 ? (
            <p className="text-yellow-600 text-sm">
              Você precisa de pelo menos 2 equipes para criar um confronto.{' '}
              <Link href={`/eventos/equipes?id=${eventoId}`} className="underline">Criar equipes</Link>
            </p>
          ) : modalidades.length === 0 ? (
            <p className="text-yellow-600 text-sm">
              Crie pelo menos uma modalidade (ex: Futebol, Vôlei) acima antes de criar o confronto.
            </p>
          ) : (
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Modalidade</label>
                <select
                  value={form.modalidade_id}
                  onChange={e => setForm(p => ({ ...p, modalidade_id: e.target.value }))}
                  required
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Selecione...</option>
                  {modalidades.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipe A</label>
                  <select
                    value={form.team_a_id}
                    onChange={e => setForm(p => ({ ...p, team_a_id: e.target.value }))}
                    required
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="">Selecione...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipe B</label>
                  <select
                    value={form.team_b_id}
                    onChange={e => setForm(p => ({ ...p, team_b_id: e.target.value }))}
                    required
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="">Selecione...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data e hora (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {formError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {saving ? 'Criando...' : 'Criar confronto'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCriando(false); setFormError('') }}
                  className="px-4 border border-gray-300 text-gray-600 hover:text-gray-900 rounded-lg text-sm transition-colors"
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
          {[1, 2].map(i => <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse h-40" />)}
        </div>
      ) : matchesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          {isAdmin
            ? <><p>Nenhum confronto criado.</p><button onClick={() => setCriando(true)} className="text-red-600 hover:text-red-700 mt-2 inline-block">Criar o primeiro confronto</button></>
            : <p>Nenhum confronto criado ainda.</p>
          }
        </div>
      ) : (
        <div className="grid gap-4">
          {matchesFiltrados.map(match => (
            <div key={match.id}>
              {modalidadeAtiva === 'todas' && modalidadeMap[match.modalidade_id] && (
                <p className="text-red-600 text-xs font-medium mb-1.5 ml-1">
                  {modalidadeMap[match.modalidade_id].name}
                </p>
              )}
              <ConfrontoCard
                match={match}
                teamMap={teamMap}
                currentUserId={user?.id}
                isAdmin={isAdmin}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ConfrontosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ConfrontosContent />
    </Suspense>
  )
}
