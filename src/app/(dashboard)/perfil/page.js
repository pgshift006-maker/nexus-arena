'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

const roleLabel = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

export default function PerfilPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ posts: 0, curtidas: 0, comentarios: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    async function loadStats() {
      const supabase = createClient()
      const [{ data: posts }, { count: comentarios }] = await Promise.all([
        supabase.from('posts').select('likes_count').eq('author_id', profile.id),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
      ])
      const curtidas = (posts ?? []).reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
      setStats({ posts: posts?.length ?? 0, curtidas, comentarios: comentarios ?? 0 })
      setStatsLoading(false)
    }
    loadStats()
  }, [profile?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function handleEditClick() {
    setName(profile?.name ?? '')
    setBio(profile?.bio ?? '')
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ name, bio }).eq('id', profile.id)
    setSaving(false)
    setEditing(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="max-w-[470px] mx-auto px-4 py-6">
      {/* Avatar + estatísticas */}
      <div className="flex items-center gap-6 mb-5">
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {getInitials(profile?.name)}
        </div>
        <div className="flex-1 grid grid-cols-3 text-center">
          <div>
            <p className="text-white font-bold text-lg">{statsLoading ? '–' : stats.posts}</p>
            <p className="text-gray-500 text-xs">publicações</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg">{statsLoading ? '–' : stats.curtidas}</p>
            <p className="text-gray-500 text-xs">curtidas</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg">{statsLoading ? '–' : stats.comentarios}</p>
            <p className="text-gray-500 text-xs">comentários</p>
          </div>
        </div>
      </div>

      {/* Nome, categoria e bio */}
      <div className="mb-5">
        <h1 className="text-white font-semibold text-base">{profile?.name}</h1>
        <p className="text-gray-500 text-sm">{roleLabel[profile?.role] ?? profile?.role}</p>
        {profile?.bio && (
          <p className="text-gray-300 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleEditClick}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Editar perfil
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-700 hover:border-red-900 hover:text-red-400 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

      {/* Formulário de edição */}
      {editing && (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Editar perfil</h2>
            <button type="button" onClick={() => setEditing(false)} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Conte algo sobre você..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Save size={15} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      )}
    </div>
  )
}
