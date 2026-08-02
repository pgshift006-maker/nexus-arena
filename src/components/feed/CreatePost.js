'use client'

import { useState, useRef } from 'react'
import { Hash, Send, Image as ImageIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'

function extractHashtags(text) {
  return [...text.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase())
}

export default function CreatePost({ eventoId = null }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if ((!content.trim() && !imageFile) || !user) return
    setLoading(true)

    const supabase = createClient()
    let imageUrl = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('posts').upload(path, imageFile)
      if (!uploadErr) {
        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ content: content.trim(), author_id: user.id, event_id: eventoId, image_url: imageUrl })
      .select()
      .single()

    if (!error && post) {
      const tags = extractHashtags(content)
      if (tags.length > 0) {
        await supabase
          .from('post_hashtags')
          .insert(tags.map(tag => ({ post_id: post.id, tag })))
      }
      setContent('')
      clearImage()
    }

    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sm:border sm:rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <Avatar name={profile?.name} url={profile?.avatar_url} size={36} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={eventoId ? 'Torça pela sua equipe... use #hashtags' : 'O que está acontecendo? use #hashtags'}
            rows={3}
            className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 text-sm resize-none focus:outline-none"
          />

          {imagePreview && (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Pré-visualização" className="max-h-56 rounded-xl object-cover" />
              <button
                onClick={clearImage}
                className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-gray-900 dark:text-white rounded-full p-1 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1">
                <Hash size={12} /> use #hashtags no texto
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Adicionar foto"
              >
                <ImageIcon size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageFile) || loading}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              <Send size={14} />
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
