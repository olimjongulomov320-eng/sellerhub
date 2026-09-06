import 'server-only'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { verifyMembership, type MembershipContext } from '@/lib/auth/dal'

/**
 * Resolves an org slug from the URL to a verified membership context.
 * This is the single entry point every [org]/* route should use before
 * touching organization-scoped data — it guarantees the current user
 * actually belongs to the organization behind the slug.
 */
export async function requireOrgContext(slug: string): Promise<
  MembershipContext & { organizationName: string }
> {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true },
  })

  if (!organization) {
    notFound()
  }

  const context = await verifyMembership(organization.id)

  return { ...context, organizationName: organization.name }
}
