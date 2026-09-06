import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { getCurrentUser, type AuthenticatedUser } from '@/lib/auth/session'
import type { MembershipRole } from '@prisma/client'

/**
 * Verifies the request has a valid session, redirecting to sign-in otherwise.
 * Memoized per-request so multiple calls don't hit the database repeatedly.
 */
export const verifySession = cache(async (): Promise<AuthenticatedUser> => {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }
  return user
})

/**
 * Same as verifySession but returns null instead of redirecting.
 * Use in places (e.g. marketing pages) that render differently either way.
 */
export const getOptionalUser = cache(async (): Promise<AuthenticatedUser | null> => {
  return getCurrentUser()
})

export type MembershipContext = {
  user: AuthenticatedUser
  organizationId: string
  role: MembershipRole
}

const ROLE_RANK: Record<MembershipRole, number> = {
  VIEWER: 0,
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
}

/**
 * Verifies the current user is authenticated AND has a membership in the
 * given organization. This is the only sanctioned way to scope a query to
 * an organizationId — never trust an organizationId from the client without
 * running it through here first.
 */
export const verifyMembership = cache(
  async (organizationId: string): Promise<MembershipContext> => {
    const user = await verifySession()

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    })

    if (!membership) {
      redirect('/')
    }

    return { user, organizationId, role: membership.role }
  }
)

export function requireRole(
  context: MembershipContext,
  minimumRole: MembershipRole
) {
  if (ROLE_RANK[context.role] < ROLE_RANK[minimumRole]) {
    throw new Error('FORBIDDEN')
  }
}

export const listUserOrganizations = cache(async () => {
  const user = await verifySession()

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  return memberships.map((m) => ({
    role: m.role,
    organization: m.organization,
  }))
})
