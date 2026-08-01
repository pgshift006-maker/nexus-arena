import Link from 'next/link'
import { Users, Calendar, ChevronRight } from 'lucide-react'

const statusLabel = {
  ativo: { label: 'Ao vivo', classes: 'bg-green-950 text-green-400 border-green-900' },
  aguardando: { label: 'Em breve', classes: 'bg-yellow-950 text-yellow-400 border-yellow-900' },
  encerrado: { label: 'Encerrado', classes: 'bg-gray-800 text-gray-400 border-gray-700' },
}

export default function EventoCard({ evento }) {
  const status = statusLabel[evento.status] ?? statusLabel.aguardando
  const teamCount = evento.teams?.[0]?.count ?? 0

  return (
    <Link
      href={`/eventos/detalhe?id=${evento.id}`}
      className="bg-gray-900 border border-gray-800 hover:border-red-700 rounded-2xl p-5 flex items-center justify-between transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${status.classes}`}>
            {status.label}
          </span>
        </div>
        <h2 className="text-white font-semibold text-base truncate">{evento.name}</h2>
        {evento.description && (
          <p className="text-gray-400 text-sm mt-0.5 truncate">{evento.description}</p>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            {teamCount} equipes
          </div>
          {evento.start_date && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              {evento.start_date}
            </div>
          )}
        </div>
      </div>
      <ChevronRight className="text-gray-600 group-hover:text-red-400 transition-colors ml-4 shrink-0" size={20} />
    </Link>
  )
}
