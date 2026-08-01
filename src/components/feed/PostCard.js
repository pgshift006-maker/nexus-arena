'use client'

import { useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo, getInitials } from '@/lib/utils'

export default function PostCard({ post }) {
  const { user } = useAuth()
  const { author, content, created_at, likes_count, hashtags, liked_by } = post

  const alreadyLiked = liked_by?.some(l => l.user_id === user?.id) ?? false
  const [liked, setLiked] = useState(alreadyLiked)
  const [count, setCount] = useState(likes_count ?? 0)
  const [toggling, setToggling] = useState(false)

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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-3">
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

      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800 ml-12">
        <button
          onClick={handleLike}
          disabled={!user || toggling}
          className={`flex items-center gap-1.5 transition-colors text-xs ${
            liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          {count}
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors text-xs">
          <MessageCircle size={15} />
          {post.comments_count ?? 0}
        </button>
      </div>
    </div>
  )
}
