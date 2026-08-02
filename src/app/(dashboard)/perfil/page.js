'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Save, X, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'
import PostCard from '@/components/feed/PostCard'

const roleLabel = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

export default function PerfilPage() {
  const { profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)

  async function loadPosts() {
    if (!profile?.id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(name, avatar_url),
        hashtags:post_hashtags(tag),
        liked_by:post_likes(user_id)
      `)
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setPostsLoading(false)
  }

  useEffect(() => { loadPosts() }, [profile?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
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
    await refreshProfile()
    setSaving(false)
    setEditing(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return

    setUploadError('')
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setUploadError('Não foi possível enviar a foto. Tente novamente.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
    await refreshProfile()
    setUploading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const totalCurtidas = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const totalComentarios = posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0)

  return (
    <div className="max-w-[470px] mx-auto sm:px-4 py-6">
      <div className="px-4 sm:px-0">
        {/* Avatar + estatísticas */}
        <div className="flex items-center gap-6 mb-5">
          <div className="relative shrink-0">
            <Avatar name={profile?.name} url={profile?.avatar_url} size={80} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 border-2 border-gray-50 flex items-center justify-center text-white transition-colors disabled:opacity-50"
              title="Alterar foto de perfil"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 grid grid-cols-3 text-center">
            <div>
              <p className="text-gray-900 font-bold text-lg">{postsLoading ? '–' : posts.length}</p>
              <p className="text-gray-500 text-xs">publicações</p>
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{postsLoading ? '–' : totalCurtidas}</p>
              <p className="text-gray-500 text-xs">curtidas</p>
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{postsLoading ? '–' : totalComentarios}</p>
              <p className="text-gray-500 text-xs">comentários</p>
            </div>
          </div>
        </div>

        {uploadError && (
          <p className="text-red-600 text-xs mb-3">{uploadError}</p>
        )}
        {uploading && (
          <p className="text-gray-500 text-xs mb-3">Enviando foto...</p>
        )}

        {/* Nome, categoria e bio */}
        <div className="mb-5">
          <h1 className="text-gray-900 font-semibold text-base">{profile?.name}</h1>
          <p className="text-gray-500 text-sm">{roleLabel[profile?.role] ?? profile?.role}</p>
          {profile?.bio && (
            <p className="text-gray-700 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleEditClick}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Editar perfil
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 hover:border-red-200 hover:text-red-600 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        {/* Formulário de edição */}
        {editing && (
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-semibold">Editar perfil</h2>
              <button type="button" onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-900 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Conte algo sobre você..."
                rows={3}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Save size={15} />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        )}

        <div className="border-t border-gray-200 pt-4 mb-1">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Publicações</p>
        </div>
      </div>

      {/* Posts do usuário */}
      {postsLoading ? (
        <div className="px-4 sm:px-0 space-y-3 mt-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">Nenhuma publicação ainda.</p>
      ) : (
        <div className="mt-3">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
