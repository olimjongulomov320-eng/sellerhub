import 'server-only'

import type {
  MarketplaceProvider,
  MarketplaceCredentials,
  MarketplaceAccountInfo,
  MarketplaceListingResult,
  MarketplaceListingStats,
} from '@/lib/marketplaces/provider'

/**
 * The "Manual" channel represents orders/listings that aren't tied to any
 * external marketplace — entered by the seller directly. There is nothing
 * to sync since nothing lives outside SellerHub, so every method resolves
 * locally instead of calling out anywhere.
 */
export class ManualProvider implements MarketplaceProvider {
  readonly type = 'MANUAL'

  async connect(): Promise<MarketplaceCredentials> {
    return { accessToken: 'manual' }
  }

  async disconnect(): Promise<void> {
    // Nothing external to disconnect.
  }

  async getAccount(): Promise<MarketplaceAccountInfo> {
    return {
      externalAccountId: 'manual',
      displayName: 'Manual entries',
      connectedAt: new Date(),
    }
  }

  async getListings(): Promise<MarketplaceListingResult[]> {
    return []
  }

  async getListing(
    _credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingResult> {
    return { externalId, url: null, status: 'ACTIVE' }
  }

  async createListing(): Promise<MarketplaceListingResult> {
    return {
      externalId: `manual-${Date.now()}`,
      url: null,
      status: 'ACTIVE',
    }
  }

  async updateListing(
    _credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingResult> {
    return { externalId, url: null, status: 'ACTIVE' }
  }

  async deleteListing(): Promise<void> {
    // No-op: manual listings are deleted directly in SellerHub's database.
  }

  async pauseListing(
    _credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingResult> {
    return { externalId, url: null, status: 'PAUSED' }
  }

  async getStatistics(
    _credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingStats> {
    return { externalId, views: null, favorites: null, messagesCount: null }
  }

  async getMessages() {
    return []
  }
}
