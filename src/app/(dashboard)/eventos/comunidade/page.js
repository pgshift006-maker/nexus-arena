'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreatePost from '@/components/feed/CreatePost'
import FeedList from '@/components/feed/FeedList'

function ComunidadeContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  return (
    <div className="max-w-[470px] mx-auto px-4 py-4 sm:py-6">
      <Link href={`/eventos/detalhe?id=${id}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar ao evento
      </Link>
      <h1 className="text-2xl font-bold text-white mb-1">Comunidade do Evento</h1>
      <p className="text-gray-400 text-sm mb-6">Poste, comente e torça pela sua equipe</p>
      <CreatePost eventoId={id} />
      <FeedList eventoId={id} />
    </div>
  )
}

export default function ComunidadePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ComunidadeContent />
    </Suspense>
  )
}
