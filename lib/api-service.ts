import { API_CONFIG, CACHE_CONFIG, LOGGING_CONFIG } from "./otc-auto-signal-config"
import { Logger } from "./logger"

// Market data interface
export interface MarketData {
  symbol: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Technical indicators interface
export interface TechnicalIndicators {
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  ema9: number
  ema21: number
  sma50: number
}

// Sentiment data interface
export interface SentimentData {
  score: number // -1 to 1
  volume: number // Number of sentiment data points analyzed
  sources: string[] // Sources of sentiment data
  keywords: string[] // Key terms driving sentiment
  lastUpdated: string // Timestamp of last update
}

// Volume data interface
export interface VolumeData {
  current: number
  average: number
  ratio: number // current / average
  trend: "increasing" | "decreasing" | "stable"
  anomaly: boolean // True if volume is significantly different from average
  anomalyScore: number // 0-1 score of how anomalous the volume is
}

// Enhanced cache with priority and TTL per item
class EnhancedDataCache {
  private cache: Map<string, { data: any; timestamp: number; priority: number }> = new Map()
  private logger: Logger

  constructor() {
    this.logger = new Logger("EnhancedDataCache", LOGGING_CONFIG)
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) {
      this.logger.debug(`Cache miss for key: ${key}`)
      return null
    }

    // Check if item is expired
    if (Date.now() - item.timestamp > CACHE_CONFIG.ttl * 1000) {
      this.logger.debug(`Cache expired for key: ${key}`)
      this.cache.delete(key)
      return null
    }

    this.logger.debug(`Cache hit for key: ${key}`)
    return item.data
  }

  set(key: string, data: any, priority = 1): void {
    // Ensure cache doesn't exceed max size
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      this.evictLowPriorityItems()
    }

    this.cache.set(key, { data, timestamp: Date.now(), priority })
    this.logger.debug(`Cache set for key: ${key} with priority ${priority}`)
  }

  private evictLowPriorityItems(): void {
    // Convert to array for sorting
    const entries = Array.from(this.cache.entries())

    // Sort by priority (lowest first) and then by age (oldest first)
    entries.sort((a, b) => {
      if (a[1].priority !== b[1].priority) {
        return a[1].priority - b[1].priority
      }
      return a[1].timestamp - b[1].timestamp
    })

    // Remove 10% of the lowest priority/oldest items
    const itemsToRemove = Math.max(1, Math.floor(this.cache.size * 0.1))
    for (let i = 0; i < itemsToRemove; i++) {
      if (entries[i]) {
        this.cache.delete(entries[i][0])
        this.logger.debug(`Evicted cache key: ${entries[i][0]}`)
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.logger.debug("Cache cleared")
  }

  // Get cache stats
  getStats(): { size: number; oldestTimestamp: number; newestTimestamp: number } {
    let oldestTimestamp = Date.now()
    let newestTimestamp = 0

    this.cache.forEach((item) => {
      if (item.timestamp < oldestTimestamp) oldestTimestamp = item.timestamp
      if (item.timestamp > newestTimestamp) newestTimestamp = item.timestamp
    })

    return {
      size: this.cache.size,
      oldestTimestamp,
      newestTimestamp,
    }
  }
}

// Rate limiter for API calls
class RateLimiter {
  private lastCallTime: Map<string, number> = new Map()
  private callCounts: Map<string, number> = new Map()
  private logger: Logger

  constructor() {
    this.logger = new Logger("RateLimiter", LOGGING_CONFIG)

    // Reset call counts every minute
    setInterval(() => {
      this.callCounts.clear()
      this.logger.debug("Rate limiter counters reset")
    }, 60000)
  }

  async throttle(apiName: string, rateLimit: number): Promise<void> {
    const now = Date.now()
    const lastCall = this.lastCallTime.get(apiName) || 0
    const callCount = this.callCounts.get(apiName) || 0

    // Update call count
    this.callCounts.set(apiName, callCount + 1)

    // If we've reached the rate limit, calculate delay
    if (callCount >= rateLimit) {
      const timePassedSinceLastCall = now - lastCall
      const minTimeBetweenCalls = 60000 / rateLimit // milliseconds between calls

      if (timePassedSinceLastCall < minTimeBetweenCalls) {
        const delayNeeded = minTimeBetweenCalls - timePassedSinceLastCall
        this.logger.debug(`Rate limiting ${apiName}, delaying for ${delayNeeded}ms`)

        // Wait for the required delay
        await new Promise((resolve) => setTimeout(resolve, delayNeeded))
      }
    }

    // Update last call time
    this.lastCallTime.set(apiName, Date.now())
  }
}

// Singleton instances
const cache = new EnhancedDataCache()
const rateLimiter = new RateLimiter()
const logger = new Logger("ApiService", LOGGING_CONFIG)

export class ApiService {
  private static logger = logger

  // Alpha Vantage API with retry logic
  static async fetchAlphaVantageData(symbol: string): Promise<MarketData[]> {
    // Skip Alpha Vantage for OTC pairs - it doesn't support them well
    if (symbol.includes("OTC")) {
      this.logger.info(`Skipping Alpha Vantage API for OTC pair ${symbol}, using synthetic data instead`)
      return []
    }

    const cacheKey = `alphavantage_${symbol}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) return cachedData

    const { baseUrl, apiKey, endpoints, rateLimit, retryDelay, maxRetries } = API_CONFIG.alphaVantage

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Apply rate limiting
        await rateLimiter.throttle("alphaVantage", rateLimit)

        // Format the symbol for Alpha Vantage (handle forex pairs)
        let fromCurrency, toCurrency

        if (symbol.includes("/")) {
          ;[fromCurrency, toCurrency] = symbol.split("/")
        } else if (symbol.length === 6) {
          // For 6-character symbols like "EURUSD", split into 3-char parts
          fromCurrency = symbol.substring(0, 3)
          toCurrency = symbol.substring(3, 6)
        } else {
          // For other symbols, use USD as the to_currency
          fromCurrency = symbol
          toCurrency = "USD"
        }

        this.logger.debug(`Formatted symbol for Alpha Vantage: ${symbol} -> ${fromCurrency}/${toCurrency}`)

        const url = `${baseUrl}?function=${endpoints.intraday}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&interval=1min&apikey=${apiKey}&outputsize=compact`

        this.logger.debug(`Fetching Alpha Vantage data for ${symbol}, attempt ${attempt}`)
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data["Error Message"]) {
          throw new Error(`Alpha Vantage API error: ${data["Error Message"]}`)
        }

        if (data["Note"] && data["Note"].includes("API call frequency")) {
          this.logger.warn(`Alpha Vantage rate limit reached: ${data["Note"]}`)
          throw new Error(`Rate limit: ${data["Note"]}`)
        }

        // Check if we have valid time series data
        const timeSeries = data["Time Series FX (1min)"]
        if (!timeSeries || Object.keys(timeSeries).length === 0) {
          throw new Error("No time series data returned from Alpha Vantage")
        }

        const marketData: MarketData[] = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
          symbol,
          timestamp,
          open: Number.parseFloat(values["1. open"]),
          high: Number.parseFloat(values["2. high"]),
          low: Number.parseFloat(values["3. low"]),
          close: Number.parseFloat(values["4. close"]),
          volume: Number.parseInt(values["5. volume"] || "0"),
        }))

        // Sort by timestamp (newest first)
        marketData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Cache with high priority
        cache.set(cacheKey, marketData, 3)
        return marketData
      } catch (error) {
        this.logger.error(`Error fetching Alpha Vantage data for ${symbol}, attempt ${attempt}:`, error)

        if (attempt < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        } else {
          this.logger.warn(
            `All retry attempts failed for Alpha Vantage data for ${symbol}, falling back to alternative data source`,
          )
          // Return empty array, will trigger fallback to another API
          return []
        }
      }
    }

    return [] // All retries failed
  }

  // Twelve Data API with retry logic
  static async fetchTwelveData(symbol: string): Promise<MarketData[]> {
    const cacheKey = `twelvedata_${symbol}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) return cachedData

    const { baseUrl, apiKey, endpoints, rateLimit, retryDelay, maxRetries } = API_CONFIG.twelveData

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Apply rate limiting
        await rateLimiter.throttle("twelveData", rateLimit)

        // Format the symbol for Twelve Data (remove OTC suffix)
        const formattedSymbol = symbol.replace(" OTC", "")

        const url = `${baseUrl}/${endpoints.timeSeries}?symbol=${encodeURIComponent(formattedSymbol)}&interval=1min&apikey=${apiKey}&outputsize=30`

        this.logger.debug(`Fetching Twelve Data for ${symbol} (${formattedSymbol}), attempt ${attempt}`)
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.status === "error") {
          throw new Error(`Twelve Data API error: ${data.message}`)
        }

        // Check if we have values in the response
        if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
          throw new Error(`No data values returned from Twelve Data for ${formattedSymbol}`)
        }

        const marketData: MarketData[] = data.values.map((item: any) => ({
          symbol,
          timestamp: item.datetime,
          open: Number.parseFloat(item.open),
          high: Number.parseFloat(item.high),
          low: Number.parseFloat(item.low),
          close: Number.parseFloat(item.close),
          volume: Number.parseInt(item.volume || "0"),
        }))

        // Cache with high priority
        cache.set(cacheKey, marketData, 3)
        return marketData
      } catch (error) {
        this.logger.error(`Error fetching Twelve Data for ${symbol}, attempt ${attempt}:`, error)

        if (attempt < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        } else {
          this.logger.warn(
            `All retry attempts failed for Twelve Data for ${symbol}, falling back to alternative data source`,
          )
          // Return empty array, will trigger fallback to another API
          return []
        }
      }
    }

    return [] // All retries failed
  }

  // Yahoo Finance API (via proxy) with retry logic
  static async fetchYahooFinanceData(symbol: string): Promise<MarketData[]> {
    // Skip Yahoo Finance API call for OTC pairs - it's not reliable for these
    if (symbol.includes("OTC")) {
      this.logger.info(`Skipping Yahoo Finance API for OTC pair ${symbol}, using synthetic data instead`)
      return []
    }

    const cacheKey = `yahoofinance_${symbol}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) return cachedData

    const { baseUrl, endpoints, retryDelay, maxRetries } = API_CONFIG.yahooFinance

    // Format symbol for Yahoo Finance
    // Convert "GBP/JPY" to "GBPJPY=X" format that Yahoo Finance understands
    let formattedSymbol = symbol.replace(" OTC", "")
    if (formattedSymbol.includes("/")) {
      formattedSymbol = formattedSymbol.replace("/", "") + "=X"
    }

    this.logger.debug(`Formatted symbol for Yahoo Finance: ${symbol} -> ${formattedSymbol}`)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${baseUrl}/${endpoints.historical}?symbol=${encodeURIComponent(formattedSymbol)}&interval=1m`

        this.logger.debug(`Fetching Yahoo Finance data for ${symbol} (${formattedSymbol}), attempt ${attempt}`)
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(`Yahoo Finance API error: ${data.error || "Unknown error"}`)
        }

        // Check if we actually got data
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error(`No data returned for symbol ${formattedSymbol}`)
        }

        const marketData: MarketData[] = data.data.map((item: any) => ({
          symbol,
          timestamp: new Date(item.date * 1000).toISOString(),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume || 0, // Handle missing volume data
        }))

        // Cache with medium priority
        cache.set(cacheKey, marketData, 2)
        return marketData
      } catch (error) {
        this.logger.error(`Error fetching Yahoo Finance data for ${symbol}, attempt ${attempt}:`, error)

        if (attempt < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        } else {
          this.logger.warn(`All retry attempts failed for Yahoo Finance data for ${symbol}`)
          // Return empty array
          return []
        }
      }
    }

    return [] // All retries failed
  }

  // Fetch sentiment data with retry logic
  static async fetchSentimentData(symbol: string): Promise<SentimentData> {
    // Skip Yahoo Finance API call for OTC pairs - it's not reliable for these
    if (symbol.includes("OTC")) {
      this.logger.info(`Skipping Yahoo Finance sentiment API for OTC pair ${symbol}, using default sentiment`)
      return {
        score: 0,
        volume: 0,
        sources: [],
        keywords: [],
        lastUpdated: new Date().toISOString(),
      }
    }

    const cacheKey = `sentiment_${symbol}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) return cachedData

    const { baseUrl, endpoints, retryDelay, maxRetries } = API_CONFIG.yahooFinance

    // Format symbol for Yahoo Finance
    // Convert "GBP/JPY" to "GBPJPY=X" format that Yahoo Finance understands
    let formattedSymbol = symbol.replace(" OTC", "")
    if (formattedSymbol.includes("/")) {
      formattedSymbol = formattedSymbol.replace("/", "") + "=X"
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${baseUrl}/${endpoints.sentiment}?symbol=${encodeURIComponent(formattedSymbol)}`

        this.logger.debug(`Fetching sentiment data for ${symbol} (${formattedSymbol}), attempt ${attempt}`)
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(`Sentiment API error: ${data.error || "Unknown error"}`)
        }

        const sentimentData: SentimentData = {
          score: data.score || 0,
          volume: data.volume || 0,
          sources: data.sources || [],
          keywords: data.keywords || [],
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        }

        // Cache with medium priority
        cache.set(cacheKey, sentimentData, 2)
        return sentimentData
      } catch (error) {
        this.logger.error(`Error fetching sentiment data for ${symbol}, attempt ${attempt}:`, error)

        if (attempt < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        } else {
          this.logger.warn(
            `All retry attempts failed for sentiment data for ${symbol}, using default neutral sentiment`,
          )
          // Return default neutral sentiment
          return {
            score: 0,
            volume: 0,
            sources: [],
            keywords: [],
            lastUpdated: new Date().toISOString(),
          }
        }
      }
    }

    // Default neutral sentiment if all retries failed
    return {
      score: 0,
      volume: 0,
      sources: [],
      keywords: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  // Enhanced volume analysis
  static async analyzeVolumeData(symbol: string, marketData: MarketData[]): Promise<VolumeData> {
    if (marketData.length === 0) {
      return {
        current: 0,
        average: 0,
        ratio: 1,
        trend: "stable",
        anomaly: false,
        anomalyScore: 0,
      }
    }

    // Get current volume from the most recent data point
    const currentVolume = marketData[0].volume

    // Calculate average volume from the last 20 data points (or less if not available)
    const volumeDataPoints = marketData.slice(0, Math.min(20, marketData.length))
    const averageVolume = volumeDataPoints.reduce((sum, item) => sum + item.volume, 0) / volumeDataPoints.length

    // Calculate volume ratio
    const volumeRatio = currentVolume / (averageVolume || 1) // Avoid division by zero

    // Determine volume trend
    let trend: "increasing" | "decreasing" | "stable"
    if (volumeRatio > 1.2) {
      trend = "increasing"
    } else if (volumeRatio < 0.8) {
      trend = "decreasing"
    } else {
      trend = "stable"
    }

    // Calculate standard deviation of volume
    const volumeValues = volumeDataPoints.map((item) => item.volume)
    const volumeStdDev = this.calculateStandardDeviation(volumeValues)

    // Determine if current volume is anomalous (more than 2 standard deviations from mean)
    const zScore = Math.abs((currentVolume - averageVolume) / (volumeStdDev || 1))
    const anomaly = zScore > 2

    // Calculate anomaly score (0-1)
    const anomalyScore = Math.min(1, zScore / 4)

    return {
      current: currentVolume,
      average: averageVolume,
      ratio: volumeRatio,
      trend,
      anomaly,
      anomalyScore,
    }
  }

  // Calculate standard deviation helper
  private static calculateStandardDeviation(values: number[]): number {
    const n = values.length
    if (n === 0) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / n
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    return Math.sqrt(variance)
  }

  // Enhanced technical indicators calculation
  static async calculateTechnicalIndicators(marketData: MarketData[]): Promise<TechnicalIndicators> {
    if (marketData.length < 50) {
      this.logger.warn(
        `Insufficient data to calculate technical indicators, only ${marketData.length} data points available`,
      )

      // Return default values if not enough data
      return {
        rsi: 50,
        macd: {
          macd: 0,
          signal: 0,
          histogram: 0,
        },
        ema9: marketData.length > 0 ? marketData[0].close : 0,
        ema21: marketData.length > 0 ? marketData[0].close : 0,
        sma50: marketData.length > 0 ? marketData[0].close : 0,
      }
    }

    // Extract close prices
    const closePrices = marketData.map((data) => data.close).reverse() // Oldest first for calculations

    // Calculate RSI
    const rsi = this.calculateRSI(closePrices, 14)

    // Calculate MACD
    const macd = this.calculateMACD(closePrices)

    // Calculate EMAs
    const ema9 = this.calculateEMA(closePrices, 9)
    const ema21 = this.calculateEMA(closePrices, 21)

    // Calculate SMA
    const sma50 = this.calculateSMA(closePrices, 50)

    return {
      rsi,
      macd,
      ema9,
      ema21,
      sma50,
    }
  }

  // Calculate RSI with improved algorithm
  private static calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) {
      return 50 // Default value if not enough data
    }

    let gains = 0
    let losses = 0

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1]
      if (difference >= 0) {
        gains += difference
      } else {
        losses -= difference
      }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // Calculate RSI using Wilder's smoothing method
    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1]

      if (difference >= 0) {
        avgGain = (avgGain * (period - 1) + difference) / period
        avgLoss = (avgLoss * (period - 1)) / period
      } else {
        avgGain = (avgGain * (period - 1)) / period
        avgLoss = (avgLoss * (period - 1) - difference) / period
      }
    }

    if (avgLoss === 0) {
      return 100
    }

    const rs = avgGain / avgLoss
    return 100 - 100 / (1 + rs)
  }

  // Calculate MACD with improved algorithm
  private static calculateMACD(
    prices: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
  ): { macd: number; signal: number; histogram: number } {
    if (prices.length < slowPeriod + signalPeriod) {
      return { macd: 0, signal: 0, histogram: 0 }
    }

    // Calculate fast EMA
    const fastEMA = this.calculateEMA(prices, fastPeriod)

    // Calculate slow EMA
    const slowEMA = this.calculateEMA(prices, slowPeriod)

    // Calculate MACD line
    const macdLine = fastEMA - slowEMA

    // For a proper signal line calculation, we would need historical MACD values
    // This is a simplified approach for demonstration
    const macdValues = []
    for (let i = prices.length - slowPeriod; i >= 0; i--) {
      const slice = prices.slice(i, prices.length)
      const fastEMA = this.calculateEMA(slice, fastPeriod)
      const slowEMA = this.calculateEMA(slice, slowPeriod)
      macdValues.push(fastEMA - slowEMA)
    }

    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMA(macdValues.slice(0, signalPeriod), signalPeriod)

    // Calculate histogram
    const histogram = macdLine - signalLine

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
    }
  }

  // Calculate EMA with improved algorithm
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1] || 0 // Return last price if not enough data
    }

    // Start with SMA for the first EMA value
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period

    // Multiplier: (2 / (period + 1))
    const multiplier = 2 / (period + 1)

    // Calculate EMA: {Close - EMA(previous day)} x multiplier + EMA(previous day)
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema
    }

    return ema
  }

  // Calculate SMA
  private static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1] || 0 // Return last price if not enough data
    }

    return prices.slice(prices.length - period).reduce((sum, price) => sum + price, 0) / period
  }

  // Enhanced support and resistance calculation
  static calculateSupportResistance(marketData: MarketData[]): { support: number; resistance: number } {
    if (marketData.length < 20) {
      const lastPrice = marketData[0]?.close || 0
      return {
        support: lastPrice * 0.995, // Default 0.5% below current price
        resistance: lastPrice * 1.005, // Default 0.5% above current price
      }
    }

    // Get recent price data (last 20 candles)
    const recentData = marketData.slice(0, 20)

    // Find local minima and maxima
    const lows = recentData.map((data) => data.low)
    const highs = recentData.map((data) => data.high)

    // Cluster analysis for support levels
    const supportClusters = this.findPriceClusters(lows)

    // Cluster analysis for resistance levels
    const resistanceClusters = this.findPriceClusters(highs)

    // Get the strongest support and resistance levels
    const support = supportClusters.length > 0 ? supportClusters[0].value : Math.min(...lows)
    const resistance = resistanceClusters.length > 0 ? resistanceClusters[0].value : Math.max(...highs)

    return { support, resistance }
  }

  // Find price clusters for support/resistance
  private static findPriceClusters(prices: number[]): Array<{ value: number; strength: number }> {
    const clusters: Array<{ value: number; strength: number }> = []
    const tolerance = 0.0005 // 0.05% tolerance for clustering

    // Sort prices
    const sortedPrices = [...prices].sort((a, b) => a - b)

    for (const price of sortedPrices) {
      // Check if price fits in an existing cluster
      let addedToCluster = false
      for (const cluster of clusters) {
        if (Math.abs(price - cluster.value) / cluster.value < tolerance) {
          // Update cluster value to average and increase strength
          cluster.value = (cluster.value * cluster.strength + price) / (cluster.strength + 1)
          cluster.strength += 1
          addedToCluster = true
          break
        }
      }

      // If not added to any cluster, create a new one
      if (!addedToCluster) {
        clusters.push({ value: price, strength: 1 })
      }
    }

    // Sort clusters by strength (descending)
    return clusters.sort((a, b) => b.strength - a.strength)
  }

  // Enhanced volatility calculation
  static calculateVolatility(marketData: MarketData[]): { value: number; description: string; atr: number } {
    if (marketData.length < 20) {
      return {
        value: 0,
        description: "Unknown (insufficient data)",
        atr: 0,
      }
    }

    // Calculate average true range (ATR) as a measure of volatility
    let sumTR = 0
    for (let i = 1; i < 20; i++) {
      const high = marketData[i].high
      const low = marketData[i].low
      const prevClose = marketData[i - 1].close

      // True Range is the greatest of:
      // 1. Current High - Current Low
      // 2. |Current High - Previous Close|
      // 3. |Current Low - Previous Close|
      const tr1 = high - low
      const tr2 = Math.abs(high - prevClose)
      const tr3 = Math.abs(low - prevClose)

      sumTR += Math.max(tr1, tr2, tr3)
    }

    const atr = sumTR / 19 // 19 periods for 20 data points

    // Normalize ATR as percentage of price
    const currentPrice = marketData[0].close
    const normalizedATR = (atr / currentPrice) * 100

    // Determine volatility description
    let description
    if (normalizedATR < 0.2) {
      description = "Very low"
    } else if (normalizedATR < 0.5) {
      description = "Low"
    } else if (normalizedATR < 0.8) {
      description = "Below average"
    } else if (normalizedATR < 1.2) {
      description = "Average"
    } else if (normalizedATR < 1.8) {
      description = "Above average"
    } else if (normalizedATR < 2.5) {
      description = "High"
    } else {
      description = "Very high"
    }

    return { value: normalizedATR, description, atr }
  }

  // Generate synthetic data for testing when all APIs fail
  private static generateSyntheticData(symbol: string): MarketData[] {
    this.logger.warn(`Generating synthetic data for ${symbol} as fallback`)

    const data: MarketData[] = []
    const now = new Date()

    // Extract base price from symbol if possible (for realism)
    let basePrice = 1.0
    if (symbol.includes("USD")) {
      // Most currency pairs with USD are between 0.5 and 2.0
      basePrice = 0.5 + Math.random() * 1.5
    } else if (symbol.includes("JPY")) {
      // JPY pairs are typically larger numbers
      basePrice = 100 + Math.random() * 50
    } else if (symbol.includes("BTC")) {
      // Bitcoin price range
      basePrice = 30000 + Math.random() * 10000
    } else {
      // Default random base price
      basePrice = 1.0 + Math.random() * 100
    }

    // Generate 30 minutes of synthetic data
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now.getTime() - i * 60000) // 1 minute intervals

      // Create some random price movement
      const volatility = 0.001 // 0.1% volatility
      const change = (Math.random() - 0.5) * 2 * volatility * basePrice
      const close = basePrice + change * (30 - i) // More recent prices have more deviation

      // Add some random intrabar movement
      const high = close * (1 + Math.random() * volatility)
      const low = close * (1 - Math.random() * volatility)
      const open = low + Math.random() * (high - low)

      // Random volume
      const volume = Math.floor(Math.random() * 1000) + 100

      data.push({
        symbol,
        timestamp: timestamp.toISOString(),
        open,
        high,
        low,
        close,
        volume,
      })
    }

    return data
  }

  // Fetch and merge data from all sources with fallback mechanisms
  static async fetchAllData(symbol: string): Promise<{
    marketData: MarketData[]
    technicalIndicators: TechnicalIndicators
    sentimentData: SentimentData
    volumeData: VolumeData
    supportResistance: { support: number; resistance: number }
    volatility: { value: number; description: string; atr: number }
  }> {
    try {
      this.logger.info(`Starting comprehensive data fetch for ${symbol}`)
      const startTime = Date.now()

      let mergedData: MarketData[] = []

      // For OTC pairs, skip external APIs and use synthetic data directly
      if (symbol.includes("OTC")) {
        this.logger.info(`Using synthetic data for OTC pair: ${symbol}`)
        mergedData = this.generateSyntheticData(symbol)
      } else {
        // Fetch data from all sources in parallel for non-OTC pairs
        const [alphaVantageData, twelveData, yahooFinanceData] = await Promise.all([
          this.fetchAlphaVantageData(symbol).catch((err) => {
            this.logger.error(`Alpha Vantage data fetch failed: ${err.message}`)
            return []
          }),
          this.fetchTwelveData(symbol).catch((err) => {
            this.logger.error(`Twelve Data fetch failed: ${err.message}`)
            return []
          }),
          this.fetchYahooFinanceData(symbol).catch((err) => {
            this.logger.error(`Yahoo Finance data fetch failed: ${err.message}`)
            return []
          }),
        ])

        // Merge data, prioritizing Twelve Data (real-time), then Alpha Vantage, then Yahoo Finance
        if (twelveData.length > 0) {
          this.logger.info(`Using Twelve Data as primary source for ${symbol} (${twelveData.length} data points)`)
          mergedData = twelveData
        } else if (alphaVantageData.length > 0) {
          this.logger.info(
            `Using Alpha Vantage as fallback source for ${symbol} (${alphaVantageData.length} data points)`,
          )
          mergedData = alphaVantageData
        } else if (yahooFinanceData.length > 0) {
          this.logger.info(
            `Using Yahoo Finance as secondary fallback source for ${symbol} (${yahooFinanceData.length} data points)`,
          )
          mergedData = yahooFinanceData
        } else {
          // If all APIs failed, generate synthetic data for testing
          this.logger.warn(`No market data available for ${symbol} from any source, generating synthetic data`)
          mergedData = this.generateSyntheticData(symbol)
        }
      }

      // Fetch sentiment data (will use default values for OTC pairs)
      const sentimentData = await this.fetchSentimentData(symbol).catch((err) => {
        this.logger.error(`Sentiment data fetch failed: ${err.message}`)
        return {
          score: 0,
          volume: 0,
          sources: [],
          keywords: [],
          lastUpdated: new Date().toISOString(),
        }
      })

      // Calculate technical indicators
      const technicalIndicators = await this.calculateTechnicalIndicators(mergedData)

      // Calculate volume data
      const volumeData = await this.analyzeVolumeData(symbol, mergedData)

      // Calculate support and resistance levels
      const supportResistance = this.calculateSupportResistance(mergedData)

      // Calculate volatility
      const volatility = this.calculateVolatility(mergedData)

      const endTime = Date.now()
      this.logger.info(`Completed data fetch and analysis for ${symbol} in ${endTime - startTime}ms`)

      return {
        marketData: mergedData,
        technicalIndicators,
        sentimentData,
        volumeData,
        supportResistance,
        volatility,
      }
    } catch (error) {
      this.logger.error(`Error in comprehensive data fetch for ${symbol}:`, error)

      // Even if there's an error, return synthetic data as a last resort
      const syntheticData = this.generateSyntheticData(symbol)

      return {
        marketData: syntheticData,
        technicalIndicators: await this.calculateTechnicalIndicators(syntheticData),
        sentimentData: {
          score: 0,
          volume: 0,
          sources: [],
          keywords: [],
          lastUpdated: new Date().toISOString(),
        },
        volumeData: await this.analyzeVolumeData(symbol, syntheticData),
        supportResistance: this.calculateSupportResistance(syntheticData),
        volatility: this.calculateVolatility(syntheticData),
      }
    }
  }
}
