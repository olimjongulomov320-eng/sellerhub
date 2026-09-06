import * as z from 'zod'

export const SignUpSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать не менее 2 символов.').trim(),
  email: z.email('Введите корректный email.').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Пароль должен содержать не менее 8 символов.')
    .regex(/[a-zA-Z]/, 'Пароль должен содержать хотя бы одну букву.')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру.'),
})

export const SignInSchema = z.object({
  email: z.email('Введите корректный email.').trim().toLowerCase(),
  password: z.string().min(1, 'Введите пароль.'),
})

export const ForgotPasswordSchema = z.object({
  email: z.email('Введите корректный email.').trim().toLowerCase(),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, 'Пароль должен содержать не менее 8 символов.')
      .regex(/[a-zA-Z]/, 'Пароль должен содержать хотя бы одну букву.')
      .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают.',
    path: ['confirmPassword'],
  })
