import { requireOrgContext } from '@/lib/services/organization'
import { listMembers } from '@/lib/services/settings'
import { prisma } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StoreSettingsForm } from './store-settings-form'
import { InviteMemberForm } from './invite-member-form'
import { RemoveMemberButton } from './remove-member-button'
import { MEMBERSHIP_ROLE_LABEL } from '@/lib/utils/labels'

export default async function SettingsPage(props: PageProps<'/[org]/settings'>) {
  const { org } = await props.params
  const context = await requireOrgContext(org)

  const [organization, members] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: context.organizationId } }),
    listMembers(context.organizationId),
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Магазин</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreSettingsForm
            org={org}
            defaults={{
              name: organization.name,
              country: organization.country,
              currency: organization.currency,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Участники команды</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InviteMemberForm org={org} />
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{member.user.name ?? member.user.email}</p>
                  <p className="text-muted-foreground">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{MEMBERSHIP_ROLE_LABEL[member.role]}</Badge>
                  {member.role !== 'OWNER' && (
                    <RemoveMemberButton org={org} membershipId={member.id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Оплата</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Оплата пока не подключена. SellerHub бесплатен на этапе раннего доступа.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
