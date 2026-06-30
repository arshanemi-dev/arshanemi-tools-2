'use client'

// ── Key registry ──────────────────────────────────────────────────────────────

const K = {
  users:      'lt_users',
  activeId:   'lt_active_user_id',
  theme:      'lt_theme',
  themeFull:  'lt_theme_full',
  companies:  'lt_companies',
}

// ── Theme presets (accent-only, legacy) ───────────────────────────────────────

export const THEME_PRESETS = [
  { id: 'indigo',  name: 'Indigo',  accent: '#4f46e5', accentLight: '#818cf8' },
  { id: 'emerald', name: 'Emerald', accent: '#059669', accentLight: '#34d399' },
  { id: 'rose',    name: 'Rose',    accent: '#e11d48', accentLight: '#fb7185' },
  { id: 'amber',   name: 'Amber',   accent: '#d97706', accentLight: '#fbbf24' },
  { id: 'cyan',    name: 'Cyan',    accent: '#0891b2', accentLight: '#22d3ee' },
  { id: 'violet',  name: 'Violet',  accent: '#7c3aed', accentLight: '#a78bfa' },
]

export const DEFAULT_THEME = THEME_PRESETS[0]

// ── Font options ──────────────────────────────────────────────────────────────

export const SYSTEM_FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'

export const FONT_OPTIONS = [
  { value: 'System',            label: 'System (Apple)'    },
  { value: 'Inter',             label: 'Inter'             },
  { value: 'Poppins',           label: 'Poppins'           },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'DM Sans',           label: 'DM Sans'           },
  { value: 'Nunito',            label: 'Nunito'            },
  { value: 'Outfit',            label: 'Outfit'            },
  { value: 'Raleway',           label: 'Raleway'           },
  { value: 'Manrope',           label: 'Manrope'           },
  { value: 'Roboto',            label: 'Roboto'            },
  { value: 'Open Sans',         label: 'Open Sans'         },
]

export const SCALE_MARKS = [
  { value: 0.8,  label: '80%' },
  { value: 0.9,  label: '90%' },
  { value: 1.0,  label: '100%' },
  { value: 1.1,  label: '110%' },
  { value: 1.2,  label: '120%' },
  { value: 1.3,  label: '130%' },
]

// ── Full theme default ────────────────────────────────────────────────────────

export const DEFAULT_FULL_THEME = {
  mode:       'light',
  fontFamily: 'System',
  fontScale:  1.3,
  dark: {
    accent:        '#4f46e5',
    accentLight:   '#818cf8',
    accentHover:   '#4338ca',
    accentMuted:   '#1e1b4b',
  },
  light: {
    accent:        '#4f46e5',
    accentLight:   '#6366f1',
    accentHover:   '#4338ca',
    accentMuted:   '#e0e7ff',
  },
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

function write(key, value) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
}

function genId(prefix = 'usr') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10)
}

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// ── Users CRUD ────────────────────────────────────────────────────────────────

export function getUsers()          { return read(K.users, []) }
export function saveUsers(list)     { write(K.users, list) }

export function addUser({ name, email, role = 'user', companyId = null }) {
  const user = {
    id:        genId('usr'),
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    role,
    companyId,
    createdAt: new Date().toISOString(),
  }
  saveUsers([...getUsers(), user])
  return user
}

export function updateUser(id, { name, email, role, companyId }) {
  const list = getUsers().map(u =>
    u.id === id
      ? { ...u, name: name.trim(), email: email.trim().toLowerCase(), role, companyId: companyId ?? u.companyId }
      : u
  )
  saveUsers(list)
  return list.find(u => u.id === id) ?? null
}

export function deleteUser(id) {
  saveUsers(getUsers().filter(u => u.id !== id))
  if (getActiveUserId() === id) clearActiveUser()
}

// ── Active user ───────────────────────────────────────────────────────────────

export function getActiveUserId()   { return read(K.activeId, null) }
export function setActiveUserId(id) { write(K.activeId, id) }
export function clearActiveUser()   {
  if (typeof window !== 'undefined') localStorage.removeItem(K.activeId)
}
export function getActiveUser() {
  const id = getActiveUserId()
  return id ? (getUsers().find(u => u.id === id) ?? null) : null
}

// ── Theme (legacy accent-only) ────────────────────────────────────────────────

export function getTheme()        { return read(K.theme, DEFAULT_THEME) }
export function saveTheme(preset) { write(K.theme, preset) }

export function applyThemeCssVars(preset) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--lt-accent',       preset.accent)
  root.style.setProperty('--lt-accent-light',  preset.accentLight)
}

// ── Full theme (mode + font + colors) ────────────────────────────────────────

export function getFullTheme()           { return read(K.themeFull, DEFAULT_FULL_THEME) }
export function saveFullTheme(theme)     { write(K.themeFull, theme) }

export function applyFullTheme(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const t = theme ?? DEFAULT_FULL_THEME
  const mode = t.mode || 'dark'
  const colors = t[mode] || t.dark || {}

  root.setAttribute('data-theme', mode)
  root.style.setProperty('--lt-accent',        colors.accent      || DEFAULT_FULL_THEME.dark.accent)
  root.style.setProperty('--lt-accent-light',  colors.accentLight || DEFAULT_FULL_THEME.dark.accentLight)
  root.style.setProperty('--lt-accent-hover',  colors.accentHover || DEFAULT_FULL_THEME.dark.accentHover)
  root.style.setProperty('--lt-accent-muted',  colors.accentMuted || DEFAULT_FULL_THEME.dark.accentMuted)

  const scale = t.fontScale ?? 1.0
  root.style.setProperty('--si-font-scale', String(scale))

  const fontFamily = t.fontFamily || 'System'
  if (fontFamily === 'System') {
    root.style.setProperty('--font-sans', SYSTEM_FONT_STACK)
  } else {
    root.style.setProperty('--font-sans', `'${fontFamily}', ui-sans-serif, system-ui, sans-serif`)
    loadGoogleFont(fontFamily)
  }
}

function loadGoogleFont(fontFamily) {
  if (typeof document === 'undefined' || fontFamily === 'Inter' || fontFamily === 'System') return
  const id = `gf-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id  = id
  link.rel  = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`
  document.head.appendChild(link)
}

// ── Companies (localStorage) ──────────────────────────────────────────────────

export function getCompanies()          { return read(K.companies, []) }
export function saveCompanies(list)     { write(K.companies, list) }

export function getCompanyById(id) {
  return getCompanies().find(c => c.id === id) ?? null
}

export function getUsersForCompany(companyId) {
  return getUsers().filter(u => u.companyId === companyId)
}

// Creates a new company. folder_id = slug if name given, else 'co_<random>'
export function addCompany({ name, email, phone, website }) {
  const companies = getCompanies()

  // Unique email guard (case-insensitive)
  const normalEmail = email.trim().toLowerCase()
  if (companies.some(c => c.email === normalEmail)) {
    throw new Error('A company with this email already exists')
  }

  let folderId
  if (name?.trim()) {
    folderId = toSlug(name.trim()) || `co_${genId('').slice(0, 8)}`
  } else {
    folderId = `co_${genId('').slice(0, 8)}`
  }

  // Unique folder guard
  if (companies.some(c => c.folderId === folderId)) {
    folderId = `${folderId}_${genId('').slice(0, 4)}`
  }

  const company = {
    id:        genId('co'),
    name:      name?.trim() || null,
    slug:      name?.trim() ? toSlug(name.trim()) : null,
    email:     normalEmail,
    phone:     phone?.trim() || null,
    website:   website?.trim() || null,
    folderId,
    isActive:  true,
    createdAt: new Date().toISOString(),
  }
  saveCompanies([...companies, company])
  return company
}

export function updateCompany(id, { name, email, phone, website, isActive }) {
  const companies = getCompanies()
  const idx = companies.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Company not found')

  const current = companies[idx]

  // Unique email guard
  if (email) {
    const norm = email.trim().toLowerCase()
    if (companies.some(c => c.id !== id && c.email === norm)) {
      throw new Error('A company with this email already exists')
    }
  }

  // Recompute folderId when name changes
  let folderId = current.folderId
  let slug = current.slug
  if (name !== undefined && name?.trim() !== current.name) {
    const newSlug = name?.trim() ? toSlug(name.trim()) : null
    if (newSlug && newSlug !== current.slug) {
      // Guard collision
      const collision = companies.some(c => c.id !== id && c.folderId === newSlug)
      folderId = collision ? `${newSlug}_${genId('').slice(0, 4)}` : newSlug
      slug = newSlug
    }
  }

  const updated = {
    ...current,
    name:     name !== undefined ? (name?.trim() || null) : current.name,
    slug,
    email:    email ? email.trim().toLowerCase() : current.email,
    phone:    phone !== undefined ? (phone?.trim() || null) : current.phone,
    website:  website !== undefined ? (website?.trim() || null) : current.website,
    isActive: isActive !== undefined ? isActive : current.isActive,
    folderId,
  }
  companies[idx] = updated
  saveCompanies(companies)
  return { company: updated, folderChanged: folderId !== current.folderId, oldFolderId: current.folderId }
}

export function deleteCompany(id) {
  saveCompanies(getCompanies().filter(c => c.id !== id))
  // Unlink users
  const users = getUsers().map(u => u.companyId === id ? { ...u, companyId: null } : u)
  saveUsers(users)
}

// ── Local subscription (dummy Pro, 1-year) ────────────────────────────────────

export function getLocalSubscription() {
  const end = new Date()
  end.setFullYear(end.getFullYear() + 1)
  return {
    status:             'active',
    plan:               'Pro',
    planId:             'plan_pro_local',
    currentPeriodEnd:   end.toISOString(),
    cancelAtPeriodEnd:  false,
    isLocal:            true,
  }
}
