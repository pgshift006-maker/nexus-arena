'use client'

import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setThemeState] = useState('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setThemeState(isDark ? 'dark' : 'light')
  }, [])

  function setTheme(next) {
    setThemeState(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return { theme, setTheme }
}
