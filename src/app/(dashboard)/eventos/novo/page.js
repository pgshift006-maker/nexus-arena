'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Crown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

function UpgradePrompt() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/eventos" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para eventos
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Crown size={22} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Criar eventos é um recurso administrador</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          Alunos e professores podem participar de eventos e gincanas livremente.
          Para criar e organizar um evento, faça upgrade para o plano administrador.
        </p>
        <button
          disabled
          className="bg-indigo-600 opacity-50 cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg text-sm"
        >
          Fazer upgrade (em breve)
        </button>
      </div>
    </div>
  )
}

export default function NovoEventoPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (profile && profile.role !== 'admin') {
    return <UpgradePrompt />
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .insert({ ...form, created_by: user.id, status: 'aguardando' })
      .select()
      .single()

    if (error) {
      setError('Erro ao criar evento. Tente novamente.')
      setLoading(false)
      return
    }

    router.push(`/eventos/detalhe?id=${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/eventos" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para eventos
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Novo evento</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome do evento</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Gincana do Semestre 2026"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descreva o evento..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data de início</label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data de término</label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-900 rounded-lg px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Criando...' : 'Criar evento'}
          </button>
        </form>
      </div>
    </div>
  )
}
