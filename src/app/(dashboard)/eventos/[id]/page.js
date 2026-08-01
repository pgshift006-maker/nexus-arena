import Link from 'next/link'
import { Trophy, Users, Calendar, ArrowLeft } from 'lucide-react'

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]
}

export default function EventoDetalhe({ params }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/eventos"
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para eventos
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs bg-green-950 text-green-400 border border-green-900 px-2 py-1 rounded-full font-medium">
              Ativo
            </span>
            <h1 className="text-2xl font-bold text-white mt-3">Gincana do Semestre 2026</h1>
            <p className="text-gray-400 mt-1">A maior gincana da história da escola!</p>
          </div>
        </div>

        <div className="flex gap-6 mt-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>4 equipes</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={14} />
            <span>6 confrontos</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>01/08 – 31/08/2026</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/eventos/${params.id}/confrontos`}
          className="bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-2xl p-6 transition-colors group"
        >
          <Trophy className="text-indigo-400 mb-3" size={24} />
          <h2 className="text-white font-semibold text-lg">Confrontos</h2>
          <p className="text-gray-400 text-sm mt-1">Acompanhe placares e enquetes ao vivo</p>
        </Link>

        <Link
          href={`/eventos/${params.id}/comunidade`}
          className="bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-2xl p-6 transition-colors group"
        >
          <Users className="text-indigo-400 mb-3" size={24} />
          <h2 className="text-white font-semibold text-lg">Comunidade</h2>
          <p className="text-gray-400 text-sm mt-1">Posts, torcida e interação do evento</p>
        </Link>
      </div>
    </div>
  )
}
