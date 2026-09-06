import 'server-only'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/db/client'

const SESSION_COOKIE = 'sellerhub_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function getSecretKey() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

type SessionTokenPayload = {
  sessionId: string
}

async function encryptSessionId(sessionId: string) {
  return new SignJWT({ sessionId } satisfies SessionTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey())
}

async function decryptSessionToken(
  token: string | undefined
): Promise<SessionTokenPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    if (typeof payload.sessionId !== 'string') return null
    return { sessionId: payload.sessionId }
  } catch {
    return null
  }
}

export async function createUserSession(userId: string) {
  const expires = new Date(Date.now() + SESSION_DURATION_MS)

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: crypto.randomUUID(),
      expires,
    },
  })

  const token = await encryptSessionId(session.id)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  })
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const decrypted = await decryptSessionToken(token)

  if (decrypted) {
    await prisma.session.deleteMany({ where: { id: decrypted.sessionId } })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export type AuthenticatedUser = {
  id: string
  email: string
  name: string | null
}

/**
 * Reads the session cookie, validates it against the database, and returns
 * the current user. Expired/invalid/missing sessions all resolve to null —
 * callers decide whether to redirect.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const decrypted = await decryptSessionToken(token)
  if (!decrypted) return null

  const session = await prisma.session.findUnique({
    where: { id: decrypted.sessionId },
    include: { user: { select: { id: true, email: true, name: true } } },
  })

  if (!session || session.expires < new Date()) {
    return null
  }

  return session.user
}
