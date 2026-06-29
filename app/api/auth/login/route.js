import { NextResponse } from 'next/server'

export async function POST(request) {
  const { username, password } = await request.json()

  const validUser = process.env.ADMIN_USER || 'admin'
  const validPass = process.env.ADMIN_PASS || 'admin123'

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = Buffer.from(`${username}:${password}`).toString('base64')
  return NextResponse.json({ token, username })
}
