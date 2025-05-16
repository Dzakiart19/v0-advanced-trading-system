import { API_ENDPOINTS, API_KEYS, CACHE_TTL, CURRENCY_PAIRS } from "./m1-otc-config"
import { logger } from "./logger"

// Cache for storing fetched data
const cache: Record<string, { data: any; timestamp: number }> = {}

// Rate limit tracking
const rateLimitTracking: Record<string, { count: number; resetTime: number }> = {
  alphaVantage: { count: 0, resetTime: Date.now() + 60000 }, // 5 requests per minute
  twelveData: { count: 0, resetTime: Date.now() + 60000 }, // 8 requests per minute
}

// Reset rate limit counters
setInterval(() => {
  const now = Date.now()
  if (now >= rateLimitTracking.alphaVantage.resetTime) {
    rateLimitTracking.alphaVantage = { count: 0, resetTime: now + 60000 }
  }
  if (now >= rateLimitTracking.twelveData.resetTime) {
    rateLimitTracking.twelveData = { count: 0, resetTime: now + 60000 }
  }
}, 10000) // Check every 10 seconds

// Check if we're within rate limits
function checkRateLimit(provider: "alphaVantage" | "twelveData"): boolean {
  const limits = {
    alphaVantage: 5, // 5 requests per minute
    twelveData: 8, // 8 requests per minute
  }

  const now = Date.now()
  if (now >= rateLimitTracking[provider].resetTime) {
    rateLimitTracking[provider] = { count: 0, resetTime: now + 60000 }
  }

  return rateLimitTracking[provider].count < limits[provider]
}

// Increment rate limit counter
function incrementRateLimit(provider: "alphaVantage" | "twelveData"): void {
  rateLimitTracking[provider].count++
}

// Get cached data if available and not expired
function getCachedData(cacheKey: string, ttl: number): any | null {
  const cachedItem = cache[cacheKey]
  if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
    logger.debug(`Using cached data for ${cacheKey}`)
    return cachedItem.data
  }
  return null
}

// Store data in cache
function setCachedData(cacheKey: string, data: any): void {
  cache[cacheKey] = { data, timestamp: Date.now() }
  logger.debug(`Cached data for ${cacheKey}`)
}

interface CurrencyPair {
  symbol: string
  apiSymbol: {
    twelveData: string
    alphaVantage: string
    yahooFinance: string
  }
}

// Fetch data with fallback mechanisms
export async function fetchWithFallback(
  symbol: string,
  dataType: "historical" | "indicators" | "sentiment",
  options: any = {},
): Promise<any> {
  const currencyPair = CURRENCY_PAIRS.find((pair) => pair.symbol === symbol)
  if (!currencyPair) {
    throw new Error(`Unknown currency pair: ${symbol}`)
  }

  const cacheKey = `${symbol}_${dataType}_${JSON.stringify(options)}`
  const ttl =
    CACHE_TTL[
      dataType === "historical"
        ? "HISTORICAL_DATA"
        : dataType === "indicators"
          ? "TECHNICAL_INDICATORS"
          : "SENTIMENT_DATA"
    ]

  // Try to get from cache first
  const cachedData = getCachedData(cacheKey, ttl)
  if (cachedData) return cachedData

  // Primary, secondary, and tertiary data sources
  const dataSources: Array<() => Promise<any>> = []

  if (dataType === "historical") {
    // For historical data
    if (checkRateLimit("twelveData")) {
      dataSources.push(() => fetchTwelveDataHistorical(currencyPair, options))
    }
    if (checkRateLimit("alphaVantage")) {
      dataSources.push(() => fetchAlphaVantageHistorical(currencyPair, options))
    }
    dataSources.push(() => fetchYahooFinanceHistorical(currencyPair, options))
  } else if (dataType === "indicators") {
    // For technical indicators
    if (checkRateLimit("twelveData")) {
      dataSources.push(() => fetchTwelveDataIndicators(currencyPair, options))
    }
    if (checkRateLimit("alphaVantage")) {
      dataSources.push(() => fetchAlphaVantageIndicators(currencyPair, options))
    }
    dataSources.push(() => calculateIndicatorsLocally(currencyPair, options))
  } else if (dataType === "sentiment") {
    // For sentiment data
    dataSources.push(() => fetchYahooFinanceSentiment(currencyPair))
    // No fallback for sentiment data as it's only from Yahoo Finance
  }

  // Try each data source until one succeeds
  let lastError: Error | null = null
  for (const fetchFn of dataSources) {
    try {
      const data = await fetchFn()
      setCachedData(cacheKey, data)
      return data
    } catch (error) {
      lastError = error as Error
      logger.warn(`Data source failed: ${error.message}`)
    }
  }

  // If all sources failed, throw the last error
  throw lastError || new Error("All data sources failed")
}

// Fetch historical data from Twelve Data
async function fetchTwelveDataHistorical(currencyPair: CurrencyPair, options: any): Promise<any> {
  const { interval = "1min", outputsize = 100 } = options

  const url = new URL(`${API_ENDPOINTS.TWELVE_DATA}/time_series`)
  url.searchParams.append("symbol", currencyPair.apiSymbol.twelveData)
  url.searchParams.append("interval", interval)
  url.searchParams.append("outputsize", outputsize.toString())
  url.searchParams.append("apikey", API_KEYS.TWELVE_DATA)

  logger.debug(`Fetching Twelve Data historical for ${currencyPair.symbol}`)
  incrementRateLimit("twelveData")

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Twelve Data API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Fetch historical data from Alpha Vantage
async function fetchAlphaVantageHistorical(currencyPair: CurrencyPair, options: any): Promise<any> {
  const { interval = "1min" } = options

  const url = new URL(API_ENDPOINTS.ALPHA_VANTAGE)
  url.searchParams.append("function", "FX_INTRADAY")
  url.searchParams.append("from_symbol", currencyPair.symbol.substring(0, 3))
  url.searchParams.append("to_symbol", currencyPair.symbol.substring(3, 6))
  url.searchParams.append("interval", interval)
  url.searchParams.append("apikey", API_KEYS.ALPHA_VANTAGE)

  logger.debug(`Fetching Alpha Vantage historical for ${currencyPair.symbol}`)
  incrementRateLimit("alphaVantage")

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Fetch historical data from Yahoo Finance (via our proxy)
async function fetchYahooFinanceHistorical(currencyPair: CurrencyPair, options: any): Promise<any> {
  const { interval = "1m", period = "1d" } = options

  const url = `${API_ENDPOINTS.YAHOO_FINANCE_PROXY}/historical?symbol=${currencyPair.apiSymbol.yahooFinance}&interval=${interval}&period=${period}`

  logger.debug(`Fetching Yahoo Finance historical for ${currencyPair.symbol}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Fetch technical indicators from Twelve Data
async function fetchTwelveDataIndicators(currencyPair: CurrencyPair, options: any): Promise<any> {
  const { indicator, params = {} } = options

  const url = new URL(`${API_ENDPOINTS.TWELVE_DATA}/${indicator}`)
  url.searchParams.append("symbol", currencyPair.apiSymbol.twelveData)
  url.searchParams.append("apikey", API_KEYS.TWELVE_DATA)

  // Add all parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString())
  })

  logger.debug(`Fetching Twelve Data ${indicator} for ${currencyPair.symbol}`)
  incrementRateLimit("twelveData")

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Twelve Data API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Fetch technical indicators from Alpha Vantage
async function fetchAlphaVantageIndicators(currencyPair: CurrencyPair, options: any): Promise<any> {
  const { indicator } = options

  const indicatorMap: Record<string, string> = {
    rsi: "RSI",
    macd: "MACD",
    ema: "EMA",
    sma: "SMA",
    bbands: "BBANDS",
  }

  const url = new URL(API_ENDPOINTS.ALPHA_VANTAGE)
  url.searchParams.append("function", indicatorMap[indicator] || indicator.toUpperCase())
  url.searchParams.append("symbol", currencyPair.apiSymbol.alphaVantage)
  url.searchParams.append("interval", "1min")
  url.searchParams.append("apikey", API_KEYS.ALPHA_VANTAGE)

  // Add specific parameters for each indicator
  if (indicator === "rsi") {
    url.searchParams.append("time_period", "14")
  } else if (indicator === "macd") {
    url.searchParams.append("fastperiod", "12")
    url.searchParams.append("slowperiod", "26")
    url.searchParams.append("signalperiod", "9")
  } else if (indicator === "ema" || indicator === "sma") {
    url.searchParams.append("time_period", "20")
  }

  logger.debug(`Fetching Alpha Vantage ${indicator} for ${currencyPair.symbol}`)
  incrementRateLimit("alphaVantage")

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Calculate indicators locally as a fallback
async function calculateIndicatorsLocally(currencyPair: CurrencyPair, options: any): Promise<any> {
  const { indicator } = options

  // First get historical data
  const historicalData = await fetchWithFallback(currencyPair.symbol, "historical", {
    interval: "1min",
    outputsize: 100,
  })

  // Calculate the requested indicator
  switch (indicator.toLowerCase()) {
    case "rsi":
      return calculateRSI(historicalData, 14)
    case "macd":
      return calculateMACD(historicalData, 12, 26, 9)
    case "ema":
      return calculateEMA(historicalData, 20)
    case "bbands":
      return calculateBollingerBands(historicalData, 20, 2)
    default:
      throw new Error(`Unsupported indicator for local calculation: ${indicator}`)
  }
}

// Fetch sentiment data from Yahoo Finance (via our proxy)
async function fetchYahooFinanceSentiment(currencyPair: CurrencyPair): Promise<any> {
  const url = `${API_ENDPOINTS.YAHOO_FINANCE_PROXY}/sentiment?symbol=${currencyPair.apiSymbol.yahooFinance}`

  logger.debug(`Fetching Yahoo Finance sentiment for ${currencyPair.symbol}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Simple implementation of RSI calculation
function calculateRSI(data: any, period: number): any {
  // Implementation would go here
  // This is a placeholder for the actual calculation
  return { values: [{ rsi: 50 }] }
}

// Simple implementation of MACD calculation
function calculateMACD(data: any, fastPeriod: number, slowPeriod: number, signalPeriod: number): any {
  // Implementation would go here
  // This is a placeholder for the actual calculation
  return {
    values: [
      {
        macd: 0.001,
        macd_signal: 0,
        macd_hist: 0.001,
      },
    ],
  }
}

// Simple implementation of EMA calculation
function calculateEMA(data: any, period: number): any {
  // Implementation would go here
  // This is a placeholder for the actual calculation
  return { values: [{ ema: 1.2345 }] }
}

// Simple implementation of Bollinger Bands calculation
function calculateBollingerBands(data: any, period: number, stdDev: number): any {
  // Implementation would go here
  // This is a placeholder for the actual calculation
  return {
    values: [
      {
        upper_band: 1.24,
        middle_band: 1.235,
        lower_band: 1.23,
      },
    ],
  }
}
