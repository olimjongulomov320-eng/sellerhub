import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'sellerhub_session'

const PUBLIC_ROUTES = new Set([
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
])

/**
 * Optimistic check only: confirms a session cookie is present. It does not
 * verify the cookie's signature or query the database — that happens in the
 * DAL (see lib/auth/dal.ts), which is the actual security boundary.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  const isPublicRoute = PUBLIC_ROUTES.has(pathname)

  if (!isPublicRoute && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (
    hasSessionCookie &&
    (pathname === '/sign-in' || pathname === '/sign-up')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
