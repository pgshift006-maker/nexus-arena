import Link from 'next/link'
import { Trophy, Users, Zap, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Trophy,
    title: 'Competições & Gincanas',
    desc: 'Crie e gerencie eventos completos com chaveamento automático e placar ao vivo.',
  },
  {
    icon: Users,
    title: 'Comunidades por Evento',
    desc: 'Feed social com posts, hashtags e torcida organizada para cada competição.',
  },
  {
    icon: Zap,
    title: 'Tempo Real',
    desc: 'Acompanhe confrontos e enquetes atualizando em tempo real sem recarregar a página.',
  },
  {
    icon: BarChart3,
    title: 'Enquetes ao Vivo',
    desc: 'Vote no seu favorito durante o confronto e veja o resultado instantaneamente.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-red-500" size={24} />
          <span className="text-xl font-bold text-gray-900">Nexus Arena</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Começar grátis
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 text-sm text-red-700 mb-6">
          <Zap size={14} />
          Competições escolares em tempo real
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Sua escola no centro da{' '}
          <span className="text-red-600">arena</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Crie gincanas, organize competições e engaje toda a comunidade escolar
          com feed social, enquetes ao vivo e acompanhamento em tempo real.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            Criar conta da escola
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 hover:border-gray-500 text-gray-700 font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-red-200 transition-colors"
            >
              <div className="bg-red-50 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="text-red-600" size={20} />
              </div>
              <h3 className="text-gray-900 font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 px-6 py-8 text-center text-gray-400 text-sm">
        © 2026 Nexus Arena. Todos os direitos reservados.
      </footer>
    </div>
  )
}
