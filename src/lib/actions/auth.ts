'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import {
  createUserSession,
  destroyCurrentSession,
} from '@/lib/auth/session'
import {
  SignUpSchema,
  SignInSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@/lib/validation/auth'

export type AuthFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export async function signUp(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = SignUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, email, password } = validated.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return {
      errors: { email: ['Аккаунт с таким email уже существует.'] },
    }
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  await createUserSession(user.id)
  redirect('/onboarding')
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { message: 'Неверный email или пароль.' }
  }

  const passwordValid = await verifyPassword(password, user.passwordHash)
  if (!passwordValid) {
    return { message: 'Неверный email или пароль.' }
  }

  await createUserSession(user.id)

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    include: { organization: true },
  })

  if (!membership) {
    redirect('/onboarding')
  }

  redirect(`/${membership.organization.slug}/dashboard`)
}

export async function signOut() {
  await destroyCurrentSession()
  redirect('/sign-in')
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = ForgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email } = validated.data
  const user = await prisma.user.findUnique({ where: { email } })

  // Always respond the same way whether or not the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  if (user) {
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expires },
    })

    // TODO: send the reset email once an email provider is wired up.
    // The link would be: /reset-password?token=${token}
  }

  return {
    message:
      'Если аккаунт с таким email существует, на него отправлена ссылка для сброса пароля.',
  }
}

export async function resetPassword(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = ResetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { token, password } = validated.data

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expires < new Date()
  ) {
    return { message: 'Ссылка для сброса пароля недействительна или устарела.' }
  }

  const passwordHash = await hashPassword(password)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ])

  redirect('/sign-in')
}
