import 'server-only'

import {
  MarketplaceNotSupportedError,
  type MarketplaceProvider,
} from '@/lib/marketplaces/provider'

/**
 * Real OLX API integration.
 *
 * IMPORTANT: This is intentionally unimplemented. SellerHub has no official
 * OLX API documentation, no registered OAuth client, and no credentials.
 * Building this against guessed endpoints would mean fabricating behavior
 * that could silently corrupt seller data or violate OLX's terms of
 * service (no scraping, no credential automation, no invented OAuth URLs).
 *
 * Every method throws MarketplaceNotSupportedError so the UI can show
 * "Not available through the current OLX integration." instead of a fake
 * success. Once official OLX API docs and credentials are available,
 * implement each method against the real API here — the MarketplaceProvider
 * interface and all calling code (sync engine, listings UI) already expect
 * this shape and will not need to change.
 */
export class OLXProvider implements MarketplaceProvider {
  readonly type = 'OLX'

  async connect(): Promise<never> {
    throw new MarketplaceNotSupportedError('connect')
  }

  async disconnect(): Promise<never> {
    throw new MarketplaceNotSupportedError('disconnect')
  }

  async getAccount(): Promise<never> {
    throw new MarketplaceNotSupportedError('getAccount')
  }

  async getListings(): Promise<never> {
    throw new MarketplaceNotSupportedError('getListings')
  }

  async getListing(): Promise<never> {
    throw new MarketplaceNotSupportedError('getListing')
  }

  async createListing(): Promise<never> {
    throw new MarketplaceNotSupportedError('createListing')
  }

  async updateListing(): Promise<never> {
    throw new MarketplaceNotSupportedError('updateListing')
  }

  async deleteListing(): Promise<never> {
    throw new MarketplaceNotSupportedError('deleteListing')
  }

  async pauseListing(): Promise<never> {
    throw new MarketplaceNotSupportedError('pauseListing')
  }

  async getStatistics(): Promise<never> {
    throw new MarketplaceNotSupportedError('getStatistics')
  }

  async getMessages(): Promise<never> {
    throw new MarketplaceNotSupportedError('getMessages')
  }
}
