'use client'

import { useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo, getInitials } from '@/lib/utils'
import CommentSection from './CommentSection'

export default function PostCard({ post }) {
  const { user } = useAuth()
  const { author, content, created_at, likes_count, hashtags, liked_by } = post

  const alreadyLiked = liked_by?.some(l => l.user_id === user?.id) ?? false
  const [liked, setLiked] = useState(alreadyLiked)
  const [count, setCount] = useState(likes_count ?? 0)
  const [toggling, setToggling] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)

  async function handleLike() {
    if (!user || toggling) return
    setToggling(true)
    const supabase = createClient()

    if (liked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: user.id })
      setLiked(false)
      setCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      setLiked(true)
      setCount(c => c + 1)
    }

    setToggling(false)
  }

  return (
    <div className="bg-gray-900 border-b border-gray-800 sm:border sm:rounded-2xl p-4 sm:mb-3">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {getInitials(author?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-white font-medium text-sm">{author?.name ?? 'Usuário'}</span>
            <span className="text-gray-500 text-xs">{timeAgo(created_at)}</span>
          </div>
          <p className="text-gray-300 text-sm mt-1 leading-relaxed whitespace-pre-wrap">{content}</p>
          {hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtags.map(({ tag }) => (
                <span key={tag} className="text-indigo-400 text-xs hover:text-indigo-300 cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ações estilo Instagram: ícones sem texto */}
      <div className="flex items-center gap-5 mt-3">
        <button
          onClick={handleLike}
          disabled={!user || toggling}
          className={`transition-colors ${liked ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
          aria-label="Curtir"
        >
          <Heart size={24} strokeWidth={1.8} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => setShowComments(s => !s)}
          className={`transition-colors ${showComments ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
          aria-label="Comentar"
        >
          <MessageCircle size={24} strokeWidth={1.8} />
        </button>
      </div>

      {count > 0 && (
        <p className="text-white text-sm font-semibold mt-2">
          {count} {count === 1 ? 'curtida' : 'curtidas'}
        </p>
      )}

      {commentsCount > 0 && (
        <button
          onClick={() => setShowComments(s => !s)}
          className="text-gray-500 hover:text-gray-300 text-sm mt-1 transition-colors"
        >
          Ver {commentsCount === 1 ? 'o comentário' : `os ${commentsCount} comentários`}
        </button>
      )}

      {showComments && (
        <CommentSection postId={post.id} onCountChange={setCommentsCount} />
      )}
    </div>
  )
}
