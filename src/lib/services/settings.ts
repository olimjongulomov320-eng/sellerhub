import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import type { MembershipRole } from '@prisma/client'

export async function updateStoreSettings(
  context: MembershipContext,
  values: { name: string; country: string; currency: string }
) {
  requireRole(context, 'ADMIN')

  return prisma.organization.update({
    where: { id: context.organizationId },
    data: values,
  })
}

export async function listMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Adds an existing SellerHub user to this organization by email. There is
 * no email-invitation flow yet (no email provider configured), so if no
 * account exists for that address this fails explicitly instead of
 * silently doing nothing or fabricating an invite.
 */
export async function inviteMemberByEmail(
  context: MembershipContext,
  email: string,
  role: MembershipRole
) {
  requireRole(context, 'ADMIN')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error(
      'Аккаунт SellerHub с таким email пока не существует. Сначала этому пользователю нужно зарегистрироваться.'
    )
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: context.organizationId } },
  })
  if (existing) {
    throw new Error('Этот пользователь уже является участником вашего магазина.')
  }

  return prisma.membership.create({
    data: { userId: user.id, organizationId: context.organizationId, role },
  })
}

export async function removeMember(context: MembershipContext, membershipId: string) {
  requireRole(context, 'ADMIN')

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: context.organizationId },
  })
  if (!membership) throw new Error('Участник не найден.')
  if (membership.role === 'OWNER') {
    throw new Error('Владельца магазина нельзя удалить.')
  }

  await prisma.membership.delete({ where: { id: membershipId } })
}
