'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getFullTheme, saveFullTheme, applyFullTheme, DEFAULT_FULL_THEME } from '@/lib/localStore'

const IS_CONNECT  = process.env.NEXT_PUBLIC_IS_CONNECT?.toLowerCase() === 'true'
const ADMIN_API   = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
const CACHE_KEY   = 'lt-theme-cache'
const CACHE_TTL   = 10 * 60 * 1000 // 10 min

const ThemeContext = createContext({ theme: DEFAULT_FULL_THEME, setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_FULL_THEME)

  useEffect(() => {
    if (IS_CONNECT) {
      // Try cache first to avoid flash
      try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (raw) {
          const { data, ts } = JSON.parse(raw)
          if (Date.now() - ts < CACHE_TTL && data?.fontFamily) {
            setThemeState(data)
            applyRemoteTheme(data)
            return
          }
        }
      } catch {}

      fetch(`${ADMIN_API}/api/admin/theme`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          const normalized = normalizeAdminTheme(data)
          setThemeState(normalized)
          applyRemoteTheme(normalized)
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: normalized, ts: Date.now() }))
          } catch {}
        })
        .catch(() => {
          // Network down — fall through to CSS defaults
        })
    } else {
      const saved = getFullTheme()
      setThemeState(saved)
      applyFullTheme(saved)
    }
  }, [])

  function setTheme(next) {
    setThemeState(next)
    if (!IS_CONNECT) {
      saveFullTheme(next)
      applyFullTheme(next)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isConnected: IS_CONNECT }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// Map admin-panel theme shape → tools full theme shape
function normalizeAdminTheme(adminTheme) {
  return {
    mode:       adminTheme.mode       || 'dark',
    fontFamily: adminTheme.typography?.fontFamily || 'Inter',
    fontScale:  adminTheme.typography?.scale      ?? 1.0,
    dark: {
      accent:      adminTheme.dark?.accent       || DEFAULT_FULL_THEME.dark.accent,
      accentLight: adminTheme.dark?.['accent-light'] || DEFAULT_FULL_THEME.dark.accentLight,
      accentHover: adminTheme.dark?.['accent-hover'] || DEFAULT_FULL_THEME.dark.accentHover,
      accentMuted: adminTheme.dark?.['accent-muted'] || DEFAULT_FULL_THEME.dark.accentMuted,
    },
    light: {
      accent:      adminTheme.light?.accent       || DEFAULT_FULL_THEME.light.accent,
      accentLight: adminTheme.light?.['accent-light'] || DEFAULT_FULL_THEME.light.accentLight,
      accentHover: adminTheme.light?.['accent-hover'] || DEFAULT_FULL_THEME.light.accentHover,
      accentMuted: adminTheme.light?.['accent-muted'] || DEFAULT_FULL_THEME.light.accentMuted,
    },
  }
}

// Apply remote (admin-panel) theme to the tools UI
function applyRemoteTheme(theme) {
  if (typeof document === 'undefined') return
  const root   = document.documentElement
  const mode   = theme.mode || 'dark'
  const colors = theme[mode] || theme.dark || {}

  root.setAttribute('data-theme', mode)
  root.style.setProperty('--lt-accent',       colors.accent      || DEFAULT_FULL_THEME.dark.accent)
  root.style.setProperty('--lt-accent-light',  colors.accentLight || DEFAULT_FULL_THEME.dark.accentLight)
  root.style.setProperty('--lt-accent-hover',  colors.accentHover || DEFAULT_FULL_THEME.dark.accentHover)
  root.style.setProperty('--lt-accent-muted',  colors.accentMuted || DEFAULT_FULL_THEME.dark.accentMuted)
  root.style.setProperty('--si-font-scale',    String(theme.fontScale ?? 1.0))

  const fontFamily = theme.fontFamily || 'Inter'
  root.style.setProperty('--font-sans', `'${fontFamily}', ui-sans-serif, system-ui, sans-serif`)

  if (fontFamily !== 'Inter') {
    const id = `gf-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id   = id
      link.rel  = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`
      document.head.appendChild(link)
    }
  }
}
