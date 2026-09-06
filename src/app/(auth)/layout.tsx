import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-semibold tracking-tight">
        SellerHub
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
