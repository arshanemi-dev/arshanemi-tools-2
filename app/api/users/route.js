import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const PATH = join(process.cwd(), 'data', 'users.json')

function readStore() {
  try { return JSON.parse(readFileSync(PATH, 'utf8')) }
  catch { return { users: [] } }
}
function writeStore(data) {
  writeFileSync(PATH, JSON.stringify(data, null, 2))
}

function genId(prefix = 'usr') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10)
}

export async function GET() {
  return NextResponse.json(readStore())
}

export async function POST(request) {
  const body = await request.json()
  const { id, name, email, role = 'user', companyId = null, action } = body
  const store = readStore()

  if (action === 'update' && id) {
    store.users = store.users.map(u =>
      u.id === id
        ? { ...u, name: name.trim(), email: email.trim().toLowerCase(), role, companyId: companyId ?? u.companyId }
        : u
    )
    writeStore(store)
    return NextResponse.json(store)
  }

  const user = {
    id: genId('usr'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    companyId,
    createdAt: new Date().toISOString(),
  }
  store.users.push(user)
  writeStore(store)
  return NextResponse.json(store)
}

export async function DELETE(request) {
  const { id } = await request.json()
  const store = readStore()
  store.users = store.users.filter(u => u.id !== id)
  writeStore(store)
  return NextResponse.json(store)
}
