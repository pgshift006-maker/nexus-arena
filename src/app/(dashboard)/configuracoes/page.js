'use client'

import { useState } from 'react'
import { Mail, Shield, KeyRound, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

const roleLabel = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

export default function ConfiguracoesPage() {
  const { user, profile, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }

    setSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: 'Não foi possível trocar a senha. Tente novamente.' })
      return
    }
    setPassword('')
    setConfirmPassword('')
    setMessage({ type: 'success', text: 'Senha atualizada com sucesso.' })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configurações</h1>

      {/* Tema */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
        <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Tema</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              theme === 'light'
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-800'
            }`}
          >
            <Sun size={16} />
            Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              theme === 'dark'
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-800'
            }`}
          >
            <Moon size={16} />
            Escuro
          </button>
        </div>
      </div>

      {/* Conta */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
        <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Conta</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Mail size={14} />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Shield size={14} />
            <span>{roleLabel[profile?.role] ?? profile?.role}</span>
          </div>
        </div>
      </div>

      {/* Trocar senha */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-gray-900 dark:text-white font-semibold mb-2 flex items-center gap-2">
          <KeyRound size={16} />
          Alterar senha
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {message && (
          <p className={`text-sm rounded-lg px-4 py-2.5 border ${
            message.type === 'error'
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900'
          }`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !password}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          {saving ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
