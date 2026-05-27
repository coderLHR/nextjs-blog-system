import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const secretKey = process.env.SESSION_SECRET || 'your-secret-key-min-32-characters-long'
const encodedKey = new TextEncoder().encode(secretKey)

export interface SessionUser {
  id: number
  email: string
  name: string | null
  role: string
}

export async function encrypt(payload: SessionUser & { expiresAt: Date }) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(String(payload.id))
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      clockTolerance: 60,
    })
    return payload as unknown as SessionUser & { expiresAt: string }
  } catch {
    return null
  }
}

export async function createSession(user: SessionUser) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ ...user, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const payload = await decrypt(cookie)
  if (!payload) return null
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  }
}

export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
