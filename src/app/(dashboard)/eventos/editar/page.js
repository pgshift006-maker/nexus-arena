'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Lock, ImageIcon, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

function EditarEventoContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  useEffect(() => {
    if (!id || !user) return
    const supabase = createClient()
    supabase.from('events').select('*').eq('id', id).single().then(({ data: ev }) => {
      if (!ev || ev.created_by !== user.id) {
        router.replace(`/eventos/detalhe?id=${id}`)
        return
      }
      setForm({
        name: ev.name,
        description: ev.description ?? '',
        start_date: ev.start_date ?? '',
        end_date: ev.end_date ?? '',
        visibility: ev.visibility,
        cover_url: ev.cover_url,
      })
      setLoading(false)
    })
  }, [id, user])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCoverSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function clearCover() {
    setCoverFile(null)
    setCoverPreview(null)
    setForm(prev => ({ ...prev, cover_url: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    let coverUrl = form.cover_url

    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('event-covers').upload(path, coverFile)
      if (!uploadErr) {
        const { data } = supabase.storage.from('event-covers').getPublicUrl(path)
        coverUrl = data.publicUrl
      }
    }

    const { name, description, start_date, end_date, visibility } = form
    const { error } = await supabase
      .from('events')
      .update({ name, description, start_date: start_date || null, end_date: end_date || null, visibility, cover_url: coverUrl })
      .eq('id', id)

    if (error) {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
      return
    }

    router.push(`/eventos/detalhe?id=${id}`)
  }

  if (loading || !form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 animate-pulse h-64" />
      </div>
    )
  }

  const cover = coverPreview ?? form.cover_url

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href={`/eventos/detalhe?id=${id}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para o evento
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Editar evento</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Capa</label>
            {cover ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="Capa do evento" className="h-32 w-full max-w-sm rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={clearCover}
                  className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 hover:border-red-700 text-gray-600 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-300 rounded-xl px-4 py-3 text-sm transition-colors"
              >
                <ImageIcon size={16} />
                Adicionar capa
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Visibilidade</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, visibility: 'public' }))}
                className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm transition-colors ${form.visibility === 'public' ? 'border-red-600 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
              >
                <Globe size={15} />
                Pública
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, visibility: 'private' }))}
                className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm transition-colors ${form.visibility === 'private' ? 'border-red-600 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
              >
                <Lock size={15} />
                Privada
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1.5">
              {form.visibility === 'public'
                ? 'Aparece no feed geral e qualquer um pode ver o conteúdo.'
                : 'Continua listada nas competições, mas só participantes aprovados veem o conteúdo e as publicações não entram no feed geral.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome do evento</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de início</label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de término</label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function EditarEventoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <EditarEventoContent />
    </Suspense>
  )
}
