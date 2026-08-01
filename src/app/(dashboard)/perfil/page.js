'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Shield, LogOut, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

const roleLabel = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

export default function PerfilPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = name || profile?.name || ''
  const displayBio = bio || profile?.bio || ''

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ name: displayName, bio: displayBio })
      .eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Meu perfil</h1>

      {/* Avatar + info básica */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {getInitials(profile?.name)}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{profile?.name}</p>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Shield size={13} />
              {roleLabel[profile?.role] ?? profile?.role}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={13} />
              {profile?.id ? '••••' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Formulário de edição */}
      <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4 space-y-4">
        <h2 className="text-white font-semibold mb-2">Editar informações</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            <User size={13} className="inline mr-1.5" />
            Nome
          </label>
          <input
            type="text"
            value={name || profile?.name || ''}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
          <textarea
            value={bio || profile?.bio || ''}
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
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      {/* Logout */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1">Sessão</h2>
        <p className="text-gray-400 text-sm mb-4">Sair da sua conta neste dispositivo.</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 border border-red-900 hover:bg-red-950 text-red-400 font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
