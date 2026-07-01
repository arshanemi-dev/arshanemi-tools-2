import { NextResponse } from 'next/server'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || ''

export async function GET(request) {
  const auth = request.headers.get('Authorization') || ''

  if (!ADMIN_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_ADMIN_URL not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${ADMIN_URL}/api/admin/subscription`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Admin API unreachable' }, { status: 503 })
  }
}
