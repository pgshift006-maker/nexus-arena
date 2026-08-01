import CreatePost from '@/components/feed/CreatePost'
import FeedList from '@/components/feed/FeedList'

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]
}

export default function ComunidadeEventoPage({ params }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-1">Comunidade do Evento</h1>
      <p className="text-gray-400 text-sm mb-6">Poste, comente e torça pela sua equipe</p>
      <CreatePost eventoId={params.id} />
      <FeedList eventoId={params.id} />
    </div>
  )
}
