import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const PATH = join(process.cwd(), 'data', 'company.json')

function readStore() {
  try { return JSON.parse(readFileSync(PATH, 'utf8')) }
  catch { return { companies: [] } }
}
function writeStore(data) {
  writeFileSync(PATH, JSON.stringify(data, null, 2))
}

function genId(prefix = 'co') {
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

export async function GET() {
  return NextResponse.json(readStore())
}

export async function POST(request) {
  const body = await request.json()
  const { id, name, email, phone, website, action } = body
  const store = readStore()

  if (action === 'update' && id) {
    const idx = store.companies.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const current = store.companies[idx]
    const normEmail = email ? email.trim().toLowerCase() : current.email
    if (email && store.companies.some(c => c.id !== id && c.email === normEmail)) {
      return NextResponse.json({ error: 'A company with this email already exists' }, { status: 400 })
    }

    let folderId = current.folderId
    let slug = current.slug
    if (name !== undefined && name?.trim() !== current.name) {
      const newSlug = name?.trim() ? toSlug(name.trim()) : null
      if (newSlug && newSlug !== current.slug) {
        const collision = store.companies.some(c => c.id !== id && c.folderId === newSlug)
        folderId = collision ? `${newSlug}_${genId('').slice(0, 4)}` : newSlug
        slug = newSlug
      }
    }

    store.companies[idx] = {
      ...current,
      name: name !== undefined ? (name?.trim() || null) : current.name,
      slug,
      email: normEmail,
      phone: phone !== undefined ? (phone?.trim() || null) : current.phone,
      website: website !== undefined ? (website?.trim() || null) : current.website,
      folderId,
    }
    writeStore(store)
    return NextResponse.json(store)
  }

  // Create
  const normalEmail = email.trim().toLowerCase()
  if (store.companies.some(c => c.email === normalEmail)) {
    return NextResponse.json({ error: 'A company with this email already exists' }, { status: 400 })
  }

  let folderId = name?.trim() ? (toSlug(name.trim()) || genId()) : genId()
  if (store.companies.some(c => c.folderId === folderId)) {
    folderId = `${folderId}_${genId('').slice(0, 4)}`
  }

  const company = {
    id: genId('co'),
    name: name?.trim() || null,
    slug: name?.trim() ? toSlug(name.trim()) : null,
    email: normalEmail,
    phone: phone?.trim() || null,
    website: website?.trim() || null,
    folderId,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  store.companies.push(company)
  writeStore(store)
  return NextResponse.json(store)
}

export async function DELETE(request) {
  const { id } = await request.json()
  const store = readStore()
  store.companies = store.companies.filter(c => c.id !== id)
  writeStore(store)

  // Also update users.json to unlink this company
  try {
    const usersPath = join(process.cwd(), 'data', 'users.json')
    const usersStore = JSON.parse(readFileSync(usersPath, 'utf8'))
    usersStore.users = usersStore.users.map(u =>
      u.companyId === id ? { ...u, companyId: null } : u
    )
    writeFileSync(usersPath, JSON.stringify(usersStore, null, 2))
  } catch { /* users.json may not exist yet */ }

  return NextResponse.json(store)
}
