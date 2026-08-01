'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import EquipeCard from '@/components/eventos/EquipeCard'

const CORES = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
]

function EquipesContent() {
  const searchParams = useSearchParams()
  const eventoId = searchParams.get('id')
  const { user } = useAuth()
  const [equipes, setEquipes] = useState([])
  const [eventoNome, setEventoNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [novaEquipe, setNovaEquipe] = useState({ name: '', color: CORES[0] })
  const [saving, setSaving] = useState(false)
  const [myTeamId, setMyTeamId] = useState(null)

  async function load() {
    if (!eventoId || !user) return
    const supabase = createClient()

    const [{ data: ev }, { data: tm }] = await Promise.all([
      supabase.from('events').select('name').eq('id', eventoId).single(),
      supabase
        .from('teams')
        .select(`*, members:team_members(profile:profiles(id, name))`)
        .eq('event_id', eventoId)
        .order('created_at'),
    ])

    setEventoNome(ev?.name ?? '')
    setEquipes(tm ?? [])

    // Descobre a equipe do usuário atual
    const minha = tm?.find(t => t.members?.some(m => m.profile?.id === user.id))
    setMyTeamId(minha?.id ?? null)

    setLoading(false)
  }

  useEffect(() => { load() }, [eventoId, user])

  async function handleCriar(e) {
    e.preventDefault()
    if (!novaEquipe.name.trim() || !user) return
    setSaving(true)

    const supabase = createClient()
    await supabase.from('teams').insert({
      event_id: eventoId,
      name: novaEquipe.name.trim(),
      color: novaEquipe.color,
    })

    setNovaEquipe({ name: '', color: CORES[0] })
    setCriando(false)
    setSaving(false)
    load()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href={`/eventos/detalhe?id=${eventoId}`}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {eventoNome || 'Voltar ao evento'}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipes</h1>
          <p className="text-gray-400 text-sm mt-1">Entre em uma equipe para torcer e competir</p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Nova equipe
        </button>
      </div>

      {/* Modal criar equipe */}
      {criando && (
        <div className="bg-gray-900 border border-indigo-700 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Nova equipe</h2>
            <button onClick={() => setCriando(false)} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCriar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome da equipe</label>
              <input
                value={novaEquipe.name}
                onChange={e => setNovaEquipe(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Turma A, Time Vermelho..."
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cor da equipe</label>
              <div className="flex gap-2 flex-wrap">
                {CORES.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setNovaEquipe(p => ({ ...p, color: cor }))}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: cor,
                      outline: novaEquipe.color === cor ? `3px solid white` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors text-sm"
              >
                {saving ? 'Criando...' : 'Criar equipe'}
              </button>
              <button
                type="button"
                onClick={() => setCriando(false)}
                className="px-4 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : equipes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm">Nenhuma equipe criada ainda.</p>
          <button
            onClick={() => setCriando(true)}
            className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block"
          >
            Criar a primeira equipe
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {equipes.map(equipe => (
            <EquipeCard
              key={equipe.id}
              equipe={equipe}
              currentUserId={user?.id}
              myTeamId={myTeamId}
              onUpdate={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EquipesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <EquipesContent />
    </Suspense>
  )
}
