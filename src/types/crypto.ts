// ─── types/crypto.ts ──────────────────────────────────────────────────────────

// Shape of one coin returned by CoinGecko's /simple/price endpoint.
export interface CoinPrice {
  id: string
  symbol: string
  name: string
  usd: number
  usd_24h_change: number   // percentage, e.g. 2.34 or -1.07
}

// Raw response from CoinGecko — keyed by coin id.
// e.g. { bitcoin: { usd: 60000, usd_24h_change: 1.5 }, ... }
export type CoinGeckoResponse = Record<string, {
  usd: number
  usd_24h_change: number
}>