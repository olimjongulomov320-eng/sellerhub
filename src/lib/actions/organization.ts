'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { verifySession } from '@/lib/auth/dal'
import { CreateOrganizationSchema } from '@/lib/validation/organization'
import { generateUniqueOrgSlug } from '@/lib/utils/slug'
import type { AuthFormState } from '@/lib/actions/auth'

export async function createOrganization(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const user = await verifySession()

  const validated = CreateOrganizationSchema.safeParse({
    name: formData.get('name'),
    country: formData.get('country'),
    currency: formData.get('currency'),
    businessType: formData.get('businessType'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, country, currency, businessType } = validated.data

  const slug = await generateUniqueOrgSlug(name, async (candidate) => {
    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
    })
    return existing !== null
  })

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      country,
      currency,
      businessType,
      memberships: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      action: 'organization.created',
      entityType: 'Organization',
      entityId: organization.id,
      newValue: { name, country, currency, businessType },
    },
  })

  redirect(`/onboarding?org=${organization.slug}`)
}
