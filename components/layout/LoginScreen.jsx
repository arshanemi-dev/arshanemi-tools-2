'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

function PdfIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.7802 25.9435V19.6158H25.9441M24.8895 22.7797H22.7802M9.07027 25.9435V19.6158M9.07027 19.6158H11.1795C12.0532 19.6158 12.7614 20.3241 12.7614 21.1978C12.7614 22.0715 12.0532 22.7797 11.1795 22.7797H9.07027V19.6158ZM10.5467 9.49154V15.8192M12.656 13.71L10.5467 15.8192L8.4375 13.71M20.0383 15.8192V7.38226M17.5072 25.9435H15.9253V19.6158H17.5072C18.6721 19.6158 19.6164 20.5602 19.6164 21.7251V23.8343C19.6164 24.9992 18.6721 25.9435 17.5072 25.9435Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7101 1.05461H3.16392C1.99904 1.05461 1.05469 1.99897 1.05469 3.16384V23.8343C1.05469 24.9991 1.99904 25.9435 3.16392 25.9435H5.27314M13.7101 1.05461V5.27307C13.7101 6.43794 14.6544 7.38229 15.8193 7.38229H20.0377L13.7101 1.05461Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem('lt_auth_token', data.token)
        if (data.user) {
          localStorage.setItem('lt_auth_user', JSON.stringify(data.user))
        }
        onLogin(data.user ?? null)
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center text-[var(--lt-accent-light)]">
            <PdfIcon size={20} />
          </div>
          <span className="text-xl font-bold text-[var(--lt-text-primary)]">
            ArshaNemi<span className="text-[var(--lt-accent)]"> PDF Tools</span>
          </span>
        </div>

        <div className="bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[16px] p-6">
          <h1 className="text-lg font-bold text-[var(--lt-text-primary)] mb-1">Sign in</h1>
          <p className="text-sm text-[var(--lt-text-subtle)] mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                className="w-full px-3 py-2.5 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] focus:bg-[var(--lt-card)] transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] focus:bg-[var(--lt-card)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-[var(--lt-danger-text)] bg-[var(--lt-danger-bg)] border border-[var(--lt-danger-text)]/30 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="flex items-center justify-center gap-2 py-2.5 bg-[var(--lt-accent)] text-white text-sm font-semibold rounded-[8px] hover:bg-[var(--lt-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-1"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Lock size={13} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
