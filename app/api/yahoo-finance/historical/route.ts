import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// Cache for storing fetched data
const cache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_TTL = 60 * 1000 // 1 minute

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol")
    const interval = searchParams.get("interval") || "1m"
    const period = searchParams.get("period") || "1d"

    if (!symbol) {
      return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
    }

    // Create cache key
    const cacheKey = `${symbol}_${interval}_${period}`

    // Check cache
    const cachedData = cache[cacheKey]
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      logger.debug(`Using cached Yahoo Finance data for ${symbol}`)
      return NextResponse.json(cachedData.data)
    }

    // Generate mock data (in a real implementation, this would call the Yahoo Finance API)
    const mockData = generateMockHistoricalData(symbol, interval, period)

    // Store in cache
    cache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
    }

    return NextResponse.json(mockData)
  } catch (error) {
    logger.error("Error fetching Yahoo Finance historical data:", error)
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}

// Generate mock historical data
function generateMockHistoricalData(symbol: string, interval: string, period: string) {
  const now = Date.now()
  const data = []

  // Determine number of data points based on interval and period
  const dataPoints = 100
  let intervalMs = 60000 // 1 minute in milliseconds

  if (interval === "5m") intervalMs = 5 * 60000
  else if (interval === "15m") intervalMs = 15 * 60000
  else if (interval === "1h") intervalMs = 60 * 60000

  // Generate data points
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - i * intervalMs

    // Base price depends on the symbol
    const basePrice = getBasePrice(symbol)

    // Add some randomness
    const randomFactor = 0.001 // 0.1% variation
    const open = basePrice * (1 + (Math.random() - 0.5) * randomFactor)
    const close = basePrice * (1 + (Math.random() - 0.5) * randomFactor)
    const high = Math.max(open, close) * (1 + Math.random() * randomFactor * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * randomFactor * 0.5)
    const volume = Math.floor(Math.random() * 10000) + 1000

    data.push({
      date: Math.floor(timestamp / 1000), // Unix timestamp in seconds
      open,
      high,
      low,
      close,
      volume,
    })
  }

  return {
    success: true,
    symbol,
    interval,
    period,
    data,
  }
}

// Get base price for a symbol
function getBasePrice(symbol: string): number {
  // Extract base symbol without =X suffix if present
  const baseSymbol = symbol.replace("=X", "")

  // Common forex pairs
  const prices: Record<string, number> = {
    EURUSD: 1.1,
    GBPUSD: 1.3,
    USDJPY: 110,
    AUDUSD: 0.75,
    USDCAD: 1.25,
    USDCHF: 0.9,
    NZDUSD: 0.7,
    EURGBP: 0.85,
    EURJPY: 130,
    GBPJPY: 150,
  }

  return prices[baseSymbol] || 1.0
}
