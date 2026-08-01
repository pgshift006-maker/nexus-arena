import ConfrontoCard from '@/components/eventos/ConfrontoCard'

const mockConfrontos = [
  {
    id: '1',
    equipe_a: { nome: 'Turma A', placar: 3 },
    equipe_b: { nome: 'Turma B', placar: 2 },
    status: 'ao_vivo',
    enquete: { total: 120, votos_a: 72, votos_b: 48 },
  },
  {
    id: '2',
    equipe_a: { nome: 'Turma C', placar: 0 },
    equipe_b: { nome: 'Turma D', placar: 0 },
    status: 'aguardando',
    enquete: null,
  },
]

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]
}

export default function ConfrontosPage({ params }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Confrontos</h1>
      <p className="text-gray-400 text-sm mb-6">Placares e enquetes em tempo real</p>

      <div className="grid gap-4">
        {mockConfrontos.map(confronto => (
          <ConfrontoCard key={confronto.id} confronto={confronto} />
        ))}
      </div>
    </div>
  )
}
