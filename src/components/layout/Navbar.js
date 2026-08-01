'use client'

import { useRouter } from 'next/navigation'
import { Bell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

export default function Navbar() {
  const { profile } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(profile?.name ?? '?')}
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">
            {profile?.name ?? '...'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
