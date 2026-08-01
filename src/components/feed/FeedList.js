'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from './PostCard'

async function fetchPosts(supabase, eventoId) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles(name),
      hashtags:post_hashtags(tag),
      liked_by:post_likes(user_id)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (eventoId) query = query.eq('event_id', eventoId)
  else query = query.is('event_id', null)

  const { data } = await query
  return data ?? []
}

export default function FeedList({ eventoId = null }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    fetchPosts(supabase, eventoId).then(data => {
      setPosts(data)
      setLoading(false)
    })

    // Realtime: atualiza feed quando novo post é inserido
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchPosts(supabase, eventoId).then(setPosts)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventoId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-32" />
                <div className="h-3 bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Nenhum post ainda. Seja o primeiro!</p>
      </div>
    )
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
