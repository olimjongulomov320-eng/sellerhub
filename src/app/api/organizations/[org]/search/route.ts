import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth/session'
import { globalSearch } from '@/lib/services/search'

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/organizations/[org]/search'>
) {
  const { org } = await ctx.params

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: org },
    select: { id: true },
  })
  if (!organization) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const query = request.nextUrl.searchParams.get('q') ?? ''
  const results = await globalSearch(organization.id, org, query)

  return NextResponse.json({ results })
}
