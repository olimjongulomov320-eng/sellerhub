import { requireOrgContext } from '@/lib/services/organization'
import { listUserOrganizations } from '@/lib/auth/dal'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Topbar } from '@/components/dashboard/topbar'

export default async function OrgLayout(
  props: LayoutProps<'/[org]'>
) {
  const { org } = await props.params
  const context = await requireOrgContext(org)
  const memberships = await listUserOrganizations()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        <div className="flex h-14 items-center border-b border-border px-4 text-lg font-semibold">
          SellerHub
        </div>
        <SidebarNav orgSlug={org} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          currentOrg={org}
          orgOptions={memberships.map((m) => ({
            slug: m.organization.slug,
            name: m.organization.name,
          }))}
          userName={context.user.name}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {props.children}
        </main>
      </div>
    </div>
  )
}
