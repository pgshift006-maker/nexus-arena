'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import EventoCard from '@/components/eventos/EventoCard'

export default function EventosPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('events')
      .select('*, teams(count)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEventos(data ?? [])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competições</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie e acompanhe todos os eventos</p>
        </div>
        <Link
          href="/eventos/novo"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Novo evento
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm">Nenhum evento criado ainda.</p>
          <Link href="/eventos/novo" className="text-red-600 hover:text-red-700 text-sm mt-2 inline-block">
            Criar o primeiro evento
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {eventos.map(evento => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}
    </div>
  )
}
