import 'server-only'

import type { MarketplaceProvider } from '@/lib/marketplaces/provider'
import { OLXProvider } from '@/lib/marketplaces/olx/olx-provider'
import { ManualProvider } from '@/lib/marketplaces/manual/manual-provider'
import type { MarketplaceType } from '@prisma/client'

const providers: Partial<Record<MarketplaceType, MarketplaceProvider>> = {
  OLX: new OLXProvider(),
  MANUAL: new ManualProvider(),
}

export function getMarketplaceProvider(type: MarketplaceType): MarketplaceProvider {
  const provider = providers[type]
  if (!provider) {
    throw new Error(`No provider registered for marketplace type "${type}".`)
  }
  return provider
}
