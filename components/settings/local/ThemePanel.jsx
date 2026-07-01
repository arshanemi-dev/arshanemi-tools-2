'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, Moon, Sun, Sparkles, Type, Sliders } from 'lucide-react'
import { FONT_OPTIONS, SCALE_MARKS, DEFAULT_FULL_THEME } from '@/lib/localStore'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

// ── Accent presets ────────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { id: 'indigo',  name: 'Indigo',  dark: { accent: '#4f46e5', accentLight: '#818cf8', accentHover: '#4338ca', accentMuted: '#1e1b4b' }, light: { accent: '#4f46e5', accentLight: '#6366f1', accentHover: '#4338ca', accentMuted: '#e0e7ff' } },
  { id: 'emerald', name: 'Emerald', dark: { accent: '#059669', accentLight: '#34d399', accentHover: '#047857', accentMuted: '#064e3b' }, light: { accent: '#059669', accentLight: '#10b981', accentHover: '#047857', accentMuted: '#d1fae5' } },
  { id: 'rose',    name: 'Rose',    dark: { accent: '#e11d48', accentLight: '#fb7185', accentHover: '#be123c', accentMuted: '#4c0519' }, light: { accent: '#e11d48', accentLight: '#f43f5e', accentHover: '#be123c', accentMuted: '#ffe4e6' } },
  { id: 'amber',   name: 'Amber',   dark: { accent: '#d97706', accentLight: '#fbbf24', accentHover: '#b45309', accentMuted: '#451a03' }, light: { accent: '#d97706', accentLight: '#f59e0b', accentHover: '#b45309', accentMuted: '#fef3c7' } },
  { id: 'cyan',    name: 'Cyan',    dark: { accent: '#0891b2', accentLight: '#22d3ee', accentHover: '#0e7490', accentMuted: '#164e63' }, light: { accent: '#0891b2', accentLight: '#06b6d4', accentHover: '#0e7490', accentMuted: '#cffafe' } },
  { id: 'violet',  name: 'Violet',  dark: { accent: '#7c3aed', accentLight: '#a78bfa', accentHover: '#6d28d9', accentMuted: '#2e1065' }, light: { accent: '#7c3aed', accentLight: '#8b5cf6', accentHover: '#6d28d9', accentMuted: '#ede9fe' } },
]

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-[var(--lt-divider)] pb-2">
        <Icon size={13} className="text-[--lt-accent]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--lt-text-subtle)]">{title}</p>
      </div>
      {children}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function ThemePanel() {
  const { theme, setTheme } = useTheme()
  const [fontOpen, setFontOpen] = useState(false)
  const fontRef = useRef(null)

  const mode       = theme?.mode       || 'dark'
  const fontFamily = theme?.fontFamily || 'Inter'
  const fontScale  = theme?.fontScale  ?? 1.0

  // Close font dropdown on outside click
  function handleFontBlur(e) {
    if (fontRef.current && !fontRef.current.contains(e.relatedTarget)) setFontOpen(false)
  }

  function update(patch) {
    setTheme({ ...(theme || DEFAULT_FULL_THEME), ...patch })
  }

  function setMode(m) {
    update({ mode: m })
  }

  function setFontFamily(f) {
    update({ fontFamily: f })
    setFontOpen(false)
  }

  function setFontScale(v) {
    update({ fontScale: parseFloat(v) })
  }

  function applyAccentPreset(preset) {
    update({
      dark:  { ...(theme?.dark  || {}), ...preset.dark  },
      light: { ...(theme?.light || {}), ...preset.light },
    })
  }

  const accentColor = theme?.[mode]?.accent || DEFAULT_FULL_THEME.dark.accent

  return (
    <div className="flex flex-col gap-7">

      {/* ── Mode ── */}
      <Section icon={Moon} title="Color Mode">
        <div className="flex gap-2">
          {[
            { id: 'dark',  icon: Moon, label: 'Dark'  },
            { id: 'light', icon: Sun,  label: 'Light' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-semibold border transition-all',
                mode === id
                  ? 'border-[--lt-accent] text-[--lt-accent] bg-[--lt-accent-muted]'
                  : 'border-[var(--lt-divider)] text-[var(--lt-text-subtle)] hover:border-[var(--lt-divider-light)] hover:text-[var(--lt-text-muted)]'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Accent colour ── */}
      <Section icon={Sparkles} title="Accent Colour">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ACCENT_PRESETS.map(preset => {
            const active = accentColor === preset.dark.accent
            return (
              <button
                key={preset.id}
                onClick={() => applyAccentPreset(preset)}
                className={cn(
                  'flex flex-col items-center gap-2 p-2.5 rounded-[10px] border transition-all',
                  active
                    ? 'border-[#ffffff20] bg-[var(--lt-card-hover)] scale-[1.04]'
                    : 'border-[var(--lt-divider)] bg-[var(--lt-card)] hover:border-[var(--lt-divider-light)] hover:scale-[1.02]'
                )}
              >
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: preset.dark.accent,
                      boxShadow: active ? `0 0 14px ${preset.dark.accent}70` : 'none',
                    }}
                  />
                  {active && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={13} color="white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={cn('text-[10px] font-semibold', active ? 'text-[var(--lt-text-primary)]' : 'text-[var(--lt-text-subtle)]')}>
                  {preset.name}
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Font family ── */}
      <Section icon={Type} title="Font Family">
        <div ref={fontRef} className="relative" onBlur={handleFontBlur}>
          <button
            onClick={() => setFontOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[10px] border border-[var(--lt-divider)] bg-[var(--lt-card)] hover:border-[var(--lt-divider-light)] text-sm font-medium text-[var(--lt-text-primary)] transition-colors"
            style={{ fontFamily: `'${fontFamily}', sans-serif` }}
          >
            {fontFamily}
            <ChevronDown size={14} className={cn('text-[var(--lt-text-subtle)] transition-transform', fontOpen && 'rotate-180')} />
          </button>

          {fontOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[10px] shadow-xl z-20 py-1 max-h-52 overflow-y-auto">
              {FONT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFontFamily(f.value)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--lt-card-hover)] text-sm text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)] transition-colors"
                  style={{ fontFamily: `'${f.value}', sans-serif` }}
                >
                  <span>{f.label}</span>
                  {fontFamily === f.value && <Check size={13} className="text-[--lt-accent]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font preview strip */}
        <div
          className="p-3 rounded-[10px] bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] space-y-0.5"
          style={{ fontFamily: `'${fontFamily}', sans-serif` }}
        >
          <p className="text-[10px] text-[var(--lt-text-subtle)] uppercase tracking-wider mb-1.5">Preview — {fontFamily}</p>
          <p className="text-xl font-bold text-[var(--lt-text-primary)]">Heading Bold 700</p>
          <p className="text-base font-medium text-[var(--lt-text-muted)]">Semibold 600 — subheading</p>
          <p className="text-sm text-[var(--lt-text-subtle)]">Regular 400 — the quick brown fox jumps over the lazy dog.</p>
        </div>
      </Section>

      {/* ── Font scale ── */}
      <Section icon={Sliders} title="Font Scale">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--lt-text-subtle)]">Scale all text proportionally</p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--lt-accent-muted)', color: 'var(--lt-accent)' }}
            >
              {(fontScale * 100).toFixed(0)}%
            </span>
          </div>

          <input
            type="range"
            min="0.8" max="1.3" step="0.05"
            value={fontScale}
            onChange={e => setFontScale(e.target.value)}
            className="w-full"
            style={{ accentColor: 'var(--lt-accent)' }}
          />

          <div className="flex justify-between mt-1.5">
            {SCALE_MARKS.map(m => (
              <span
                key={m.value}
                className="text-[10px]"
                style={{
                  color: Math.abs(m.value - fontScale) < 0.01 ? 'var(--lt-accent)' : 'var(--lt-text-subtle)',
                  fontWeight: Math.abs(m.value - fontScale) < 0.01 ? 700 : 400,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Scale preview */}
          <div className="mt-3 flex flex-col gap-1 p-3 bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[10px]">
            {[
              { size: `${(12 * fontScale).toFixed(1)}px`, label: 'text-xs' },
              { size: `${(14 * fontScale).toFixed(1)}px`, label: 'text-sm' },
              { size: `${(16 * fontScale).toFixed(1)}px`, label: 'text-base' },
              { size: `${(24 * fontScale).toFixed(1)}px`, label: 'text-2xl' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[var(--lt-text-muted)]" style={{ fontSize: r.size, lineHeight: 1.3 }}>
                  Sample text
                </span>
                <span className="text-[10px] text-[var(--lt-text-subtle)] font-mono">{r.label} · {r.size}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <p className="flex items-start gap-2 text-[10px] text-[var(--lt-text-subtle)] bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[8px] px-3 py-2.5 leading-relaxed">
        <Sparkles size={11} className="text-[var(--lt-text-subtle)] mt-0.5 shrink-0" />
        Theme is saved to localStorage and applied instantly. Font scale affects all{' '}
        <code className="text-[var(--lt-text-subtle)]">rem</code>-based sizes. Font families are loaded from Google Fonts.
      </p>
    </div>
  )
}
