'use client'

import { useState, useEffect } from 'react'
import Header from './Header'
import FloatingShortcuts from './FloatingShortcuts'
import LoginScreen from './LoginScreen'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const TOKEN_KEY   = 'lt_auth_token'
const USER_KEY    = 'lt_auth_user'

export default function AppShell({ children }) {
  const [authed,   setAuthed]   = useState(!IS_CONNECT)
  const [authUser, setAuthUser] = useState(null)
  const [checked,  setChecked]  = useState(!IS_CONNECT)

  useEffect(() => {
    if (IS_CONNECT) {
      const token = localStorage.getItem(TOKEN_KEY)
      const user  = (() => {
        try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') }
        catch { return null }
      })()
      setAuthed(!!token)
      setAuthUser(user)
      setChecked(true)
    }
  }, [])

  if (!checked) return null

  if (!authed) {
    return (
      <LoginScreen
        onLogin={(user) => {
          setAuthUser(user)
          setAuthed(true)
        }}
      />
    )
  }

  return (
    <>
      {/* Header: visible only when IS_CONNECT=false */}
      {!IS_CONNECT && <Header authUser={authUser} />}

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
        {children}
      </main>

      {/* Floating shortcuts: visible only when IS_CONNECT=true (no top nav) */}
      {IS_CONNECT && <FloatingShortcuts />}
    </>
  )
}
