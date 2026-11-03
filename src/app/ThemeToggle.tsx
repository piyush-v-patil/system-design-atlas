import { useState } from 'react'

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

export function ThemeToggle() {
  const [dark, setDark] = useState(isDark)
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('atlas-theme', next ? 'dark' : 'light')
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
    setDark(next)
  }
  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-ink"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      {dark ? (
        <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
          <path d="M10 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 11a4 4 0 100-8 4 4 0 000 8zm6-4a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm8 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm5.66-11.66a1 1 0 010 1.41l-.7.71a1 1 0 11-1.42-1.42l.71-.7a1 1 0 011.41 0zM6.46 13.54a1 1 0 010 1.42l-.71.7a1 1 0 11-1.41-1.41l.7-.71a1 1 0 011.42 0zm9.2 2.12a1 1 0 01-1.41 0l-.71-.7a1 1 0 111.42-1.42l.7.71a1 1 0 010 1.41zM6.46 6.46a1 1 0 01-1.42 0l-.7-.71a1 1 0 011.41-1.41l.71.7a1 1 0 010 1.42z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
          <path d="M17.29 13.29A8 8 0 016.71 2.71a8 8 0 1010.58 10.58z" />
        </svg>
      )}
    </button>
  )
}
