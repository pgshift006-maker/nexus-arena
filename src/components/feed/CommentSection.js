'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'

function CommentItem({ comment, currentUserId, onDelete }) {
  const isOwn = comment.author?.id === currentUserId

  return (
    <div className="flex gap-2.5 group">
      <Avatar name={comment.author?.name} url={comment.author?.avatar_url} size={28} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-800 rounded-xl rounded-tl-none px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-white text-xs font-semibold">{comment.author?.name ?? 'Usuário'}</span>
            {isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
        </div>
        <p className="text-gray-600 text-xs mt-1 ml-1">{timeAgo(comment.created_at)}</p>
      </div>
    </div>
  )
}

export default function CommentSection({ postId, onCountChange }) {
  const { user, profile } = useAuth()
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const bottomRef                 = useRef(null)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(id, name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()

    const supabase = createClient()
    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [postId])

  // scroll para o fim quando novos comentários chegam
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [comments.length, loading])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || !user) return
    setSending(true)

    const supabase = createClient()
    await supabase.from('comments').insert({
      post_id:   postId,
      author_id: user.id,
      content:   text.trim(),
    })

    setText('')
    setSending(false)
    onCountChange?.(c => c + 1)
  }

  async function handleDelete(id) {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', id)
    onCountChange?.(c => Math.max(0, c - 1))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      {/* Lista */}
      {loading ? (
        <div className="space-y-2 mb-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-800 shrink-0" />
              <div className="flex-1 bg-gray-800 rounded-xl h-12" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-600 text-xs mb-3 text-center">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-1">
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id}
              onDelete={handleDelete}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Avatar name={profile?.name} url={profile?.avatar_url} size={28} />
        <div className="flex-1 flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-indigo-500 transition-colors">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva um comentário... (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none max-h-24"
            style={{ minHeight: '20px' }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 pb-px"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  )
}
