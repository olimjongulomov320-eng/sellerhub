/**
 * Marketplace abstraction. Every sales channel (OLX today; Uzum, Telegram,
 * Instagram, Website in the future) implements this interface. Core business
 * logic (sync engine, listing UI) only ever talks to this interface — never
 * to a marketplace-specific SDK directly.
 *
 * A method that has no real backing API MUST throw MarketplaceNotSupportedError
 * rather than fabricate a response. Callers surface that as
 * "Not available through the current OLX integration." — never a fake
 * success.
 */

export class MarketplaceNotSupportedError extends Error {
  constructor(action: string) {
    super(`Not available through the current OLX integration: ${action}`)
    this.name = 'MarketplaceNotSupportedError'
  }
}

export class MarketplaceAuthError extends Error {
  constructor(message = 'Marketplace authentication failed or expired.') {
    super(message)
    this.name = 'MarketplaceAuthError'
  }
}

export type MarketplaceAccountInfo = {
  externalAccountId: string
  displayName: string
  connectedAt: Date
}

export type MarketplaceListingInput = {
  title: string
  description: string
  price: number
  category?: string
  images: string[]
}

export type MarketplaceListingResult = {
  externalId: string
  url: string | null
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'ERROR'
}

export type MarketplaceListingStats = {
  externalId: string
  views: number | null
  favorites: number | null
  messagesCount: number | null
}

export type MarketplaceCredentials = {
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
}

/**
 * Every method may throw MarketplaceNotSupportedError if the current
 * integration mode (missing credentials, no official API for that action)
 * cannot fulfill the request. Callers must handle that explicitly.
 */
export interface MarketplaceProvider {
  readonly type: string

  connect(input: { code: string; redirectUri: string }): Promise<MarketplaceCredentials>
  disconnect(credentials: MarketplaceCredentials): Promise<void>
  getAccount(credentials: MarketplaceCredentials): Promise<MarketplaceAccountInfo>

  getListings(credentials: MarketplaceCredentials): Promise<MarketplaceListingResult[]>
  getListing(
    credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingResult>
  createListing(
    credentials: MarketplaceCredentials,
    input: MarketplaceListingInput
  ): Promise<MarketplaceListingResult>
  updateListing(
    credentials: MarketplaceCredentials,
    externalId: string,
    input: Partial<MarketplaceListingInput>
  ): Promise<MarketplaceListingResult>
  deleteListing(credentials: MarketplaceCredentials, externalId: string): Promise<void>
  pauseListing(
    credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingResult>

  getStatistics(
    credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<MarketplaceListingStats>

  getMessages(
    credentials: MarketplaceCredentials,
    externalId: string
  ): Promise<Array<{ id: string; text: string; receivedAt: Date }>>
}
