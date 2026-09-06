'use server'

import { prisma } from '@/lib/db/client'

export type VerifyEmailResult = { success: true } | { success: false; message: string }

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verification || verification.expires < new Date()) {
    return { success: false, message: 'Ссылка для подтверждения недействительна или устарела.' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: verification.id } }),
  ])

  return { success: true }
}
