'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPass, setShow]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      localStorage.setItem('pdf-tool-admin-token',    data.token)
      localStorage.setItem('pdf-tool-admin-username', data.username)
      router.push('/admin')
    } catch {
      setError('Network error — check console')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4"
         style={{ backgroundColor: 'var(--lt-bg-base)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ backgroundColor: 'var(--lt-accent-muted)', border: '1px solid var(--lt-accent)' }}>
            <FileText size={22} style={{ color: 'var(--lt-accent-light)' }} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: 'var(--lt-text-primary)' }}>Admin Login</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--lt-text-subtle)' }}>ArshaNemi PDF Tools</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
              className="flex flex-col gap-4 p-6 rounded-2xl"
              style={{ backgroundColor: 'var(--lt-card)', border: '1px solid var(--lt-divider)' }}>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg text-red-400 bg-red-950/40 border border-red-800/40">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--lt-text-muted)' }}>Username</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--lt-text-subtle)' }} />
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="admin"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--lt-bg-base)',
                  border: '1px solid var(--lt-divider)',
                  color: 'var(--lt-text-primary)',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--lt-text-muted)' }}>Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--lt-text-subtle)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--lt-bg-base)',
                  border: '1px solid var(--lt-divider)',
                  color: 'var(--lt-text-primary)',
                }}
              />
              <button type="button" onClick={() => setShow(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--lt-text-subtle)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--lt-accent)', color: '#fff' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  )
}
