'use client'

import { useState } from 'react'
import { Hash, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

function extractHashtags(text) {
  return [...text.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase())
}

export default function CreatePost({ eventoId = null }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || !user) return
    setLoading(true)

    const supabase = createClient()

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ content: content.trim(), author_id: user.id, event_id: eventoId })
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
    }

    setLoading(false)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {getInitials(profile?.name ?? '?')}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={eventoId ? 'Torça pela sua equipe... use #hashtags' : 'O que está acontecendo? use #hashtags'}
            rows={3}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Hash size={12} /> use #hashtags no texto
            </span>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
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
