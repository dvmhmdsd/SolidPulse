// ─── services/api/cryptoApi.ts ────────────────────────────────────────────────
// Pure async function — no Solid imports.
// createResource (in the widget) will call this as its fetcher.

import type { CoinGeckoResponse, CoinPrice } from '@/types/crypto'

const COINS = ['bitcoin', 'ethereum', 'solana', 'cardano']

const COIN_META: Record<string, { symbol: string; name: string }> = {
  bitcoin:  { symbol: 'BTC', name: 'Bitcoin'  },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  solana:   { symbol: 'SOL', name: 'Solana'   },
  cardano:  { symbol: 'ADA', name: 'Cardano'  },
}

export async function fetchCryptoPrices(): Promise<CoinPrice[]> {
  const params = new URLSearchParams({
    ids: COINS.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  })

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?${params}`
  )

  if (!res.ok) {
    // Throwing here surfaces the error in the ErrorBoundary wrapping the widget.
    throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`)
  }

  const raw: CoinGeckoResponse = await res.json() as CoinGeckoResponse

  // Normalize the raw response into a flat array of CoinPrice.
  return COINS.map(id => ({
    id,
    symbol: COIN_META[id].symbol,
    name:   COIN_META[id].name,
    usd:             raw[id]?.usd            ?? 0,
    usd_24h_change:  raw[id]?.usd_24h_change ?? 0,
  }))
}