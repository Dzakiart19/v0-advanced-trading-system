/**
 * ETHEREAL/TRANSCENDENT Signal Generator
 * Generates metaphysical trading signals based on cosmic market energy
 */

import type { EtherealSignal } from "./ethereal-telegram-formatter"

// Supported currency pairs
export const ETHEREAL_CURRENCY_PAIRS = [
  "EUR/USD OTC",
  "GBP/USD OTC",
  "AUD/JPY OTC",
  "NZD/JPY OTC",
  "USD/MXN OTC",
  "USD/SGD OTC",
  "EUR/NZD OTC",
  "GBP/NZD OTC",
  "AUD/CAD OTC",
  "CAD/JPY OTC",
]

// Supported timeframes - now includes both formats for compatibility
export const ETHEREAL_TIMEFRAMES = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "M1",
  "M5",
  "M15",
  "M30",
  "H1",
  "H4",
  "m1",
  "m5",
  "m15",
  "m30",
  "h1",
  "h4",
]

/**
 * Generates an ETHEREAL/TRANSCENDENT signal
 */
export function generateEtherealSignal(pair: string, timeframe: string): EtherealSignal {
  // Normalize timeframe for internal use
  const normalizedTimeframe = normalizeTimeframe(timeframe)

  // Determine signal direction based on cosmic alignment (random for demo)
  const direction = Math.random() > 0.5 ? "BUY" : "SELL"

  // Generate a quantum-level confidence score (15 decimal places)
  const confidence = 0.9 + Math.random() * 0.1

  // Generate cosmic market info
  const quantumVolatility = getRandomElement([
    "Hyper-fluctuating, aligned with cosmic tides",
    "Stable quantum field, harmonic oscillation",
    "Transdimensional flux, converging patterns",
    "Quantum coherence, synchronized waves",
  ])

  const traderEnergyField = direction === "BUY" ? 85 + Math.random() * 10 : 85 + Math.random() * 10

  const marketSentiment = direction === "BUY" ? 0.8 + Math.random() * 0.2 : -0.8 - Math.random() * 0.2

  const astroAlignment = direction === "BUY" ? "Optimal for upward flow" : "Optimal for downward flow"

  const dimensionalFlux =
    direction === "BUY" ? "Stable interdimensional bullish cycle" : "Stable interdimensional bearish cycle"

  // Generate technical indicators
  const rsi = direction === "BUY" ? 20 + Math.random() * 10 : 80 + Math.random() * 10

  const macd = direction === "BUY" ? 0.001 + Math.random() * 0.01 : -0.001 - Math.random() * 0.01

  const emaStatus =
    direction === "BUY"
      ? "EMA3 > EMA8 > EMA21 (Universal upward gradient)"
      : "EMA3 < EMA8 < EMA21 (Universal downward gradient)"

  const bollingerStatus =
    direction === "BUY"
      ? "Lower boundary transcended (reversal imminent)"
      : "Upper boundary transcended (reversal imminent)"

  const adx = 45 + Math.random() * 30

  // Generate AI insights
  const probabilityScore = direction === "BUY" ? 0.99 + Math.random() * 0.01 : 0.99 + Math.random() * 0.01

  const sentimentWaveform =
    direction === "BUY" ? "Deep bullish entanglement detected" : "Deep bearish entanglement detected"

  const causalLoopScore = "Absolute forward-backward harmony"

  const metaConsciousFeedback = getRandomElement([
    "Self-optimized, transcendentally aligned",
    "Quantum consciousness achieved, signal optimized",
    "Interdimensional pattern recognition complete",
    "Cosmic alignment verified, signal optimized",
  ])

  // Generate risk management parameters
  const quantumVaR = 0.001 + Math.random() * 0.005

  const adaptivePositioning = "Fluid between 0.5% - 3% capital, based on cosmic energy cycles"

  const hedgingStatus = getRandomElement([
    "Activated across correlated quantum assets",
    "Multi-dimensional hedging engaged",
    "Cross-asset quantum protection active",
    "Interdimensional risk mitigation active",
  ])

  // Generate signal metadata
  const strengthLevels = ["NORMAL", "STRONG", "VERY STRONG", "ETHEREAL", "TRANSCENDENT"]
  const strengthLevel = getRandomElement(strengthLevels) as EtherealSignal["strengthLevel"]

  const marketCondition =
    direction === "BUY"
      ? "Aligned with universal cosmic cycles, primal bullish flow"
      : "Aligned with universal cosmic cycles, primal bearish flow"

  return {
    pair,
    timeframe: normalizedTimeframe, // Use normalized timeframe for consistency
    direction,
    timestamp: new Date(),
    confidence,

    // Cosmic market info
    quantumVolatility,
    traderEnergyField,
    marketSentiment,
    astroAlignment,
    dimensionalFlux,

    // Technical indicators
    rsi,
    macd,
    emaStatus,
    bollingerStatus,
    adx,

    // AI insights
    probabilityScore,
    sentimentWaveform,
    causalLoopScore,
    metaConsciousFeedback,

    // Risk management
    quantumVaR,
    adaptivePositioning,
    hedgingStatus,

    // Signal metadata
    strengthLevel,
    marketCondition,
  }
}

/**
 * Helper function to get a random element from an array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Helper function to normalize timeframe format
 * Converts any timeframe format to a standardized format (e.g., "M1", "m1", "1m" all become "1m")
 */
function normalizeTimeframe(timeframe: string): string {
  // Convert to lowercase for easier handling
  const tf = timeframe.toLowerCase()

  // Handle formats like "m1", "m5", etc.
  if (tf.startsWith("m") || tf.startsWith("h")) {
    const number = tf.substring(1)
    const unit = tf.startsWith("m") ? "m" : "h"
    return `${number}${unit}`
  }

  // Handle formats like "1m", "5m", etc.
  if (/^\d+[mh]$/.test(tf)) {
    return tf
  }

  // Handle formats like "M1", "M5", etc.
  if (tf.startsWith("m") || tf.startsWith("h")) {
    const number = tf.substring(1)
    const unit = tf.startsWith("m") ? "m" : "h"
    return `${number}${unit}`
  }

  // Default fallback - return as is
  return timeframe
}

// Calculate Stochastic Oscillator
function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
  smoothK = 3,
  smoothD = 3,
): { k: number; d: number } {
  if (highs.length < period || lows.length < period || closes.length < period) {
    return { k: 50, d: 50 }
  }

  // Get the last 'period' prices
  const highsSlice = highs.slice(-period)
  const lowsSlice = lows.slice(-period)
  const lastClose = closes[closes.length - 1]

  // Find the highest high and lowest low in the period
  const highestHigh = Math.max(...highsSlice)
  const lowestLow = Math.min(...lowsSlice)

  // Calculate %K
  let k = ((lastClose - lowestLow) / (highestHigh - lowestLow)) * 100

  // Ensure k is between 0 and 100
  k = Math.max(0, Math.min(100, k))

  // For simplicity, we'll use k as d (normally d would be a moving average of k)
  const d = k

  return { k, d }
}

// Calculate ADX (Average Directional Index)
function calculateADX(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
    return 25 // Default moderate value
  }

  // This is a simplified ADX calculation
  // In a real implementation, you would calculate +DI, -DI, and then ADX

  // For demonstration, we'll return a value between 0 and 100
  // based on recent price movement volatility
  let sumTR = 0
  for (let i = 1; i <= period; i++) {
    const high = highs[highs.length - i]
    const low = lows[lows.length - i]
    const prevClose = closes[closes.length - i - 1]

    // True Range calculation
    const tr1 = high - low
    const tr2 = Math.abs(high - prevClose)
    const tr3 = Math.abs(low - prevClose)
    const tr = Math.max(tr1, tr2, tr3)

    sumTR += tr
  }

  // Calculate average true range
  const atr = sumTR / period

  // Calculate a simplified ADX based on ATR relative to price
  const lastPrice = closes[closes.length - 1]
  const adx = Math.min(100, Math.max(0, (atr / lastPrice) * 10000))

  return adx
}

// Calculate Ichimoku Cloud
function calculateIchimoku(
  highs: number[],
  lows: number[],
  closes: number[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouSpanBPeriod = 52,
  displacement = 26,
): {
  tenkanSen: number
  kijunSen: number
  senkouSpanA: number
  senkouSpanB: number
  chikouSpan: number
} {
  if (
    highs.length < Math.max(tenkanPeriod, kijunPeriod, senkouSpanBPeriod) ||
    lows.length < Math.max(tenkanPeriod, kijunPeriod, senkouSpanBPeriod) ||
    closes.length < Math.max(tenkanPeriod, kijunPeriod, senkouSpanBPeriod, displacement)
  ) {
    return {
      tenkanSen: closes[closes.length - 1],
      kijunSen: closes[closes.length - 1],
      senkouSpanA: closes[closes.length - 1],
      senkouSpanB: closes[closes.length - 1],
      chikouSpan: closes[closes.length - 1],
    }
  }

  // Calculate Tenkan-sen (Conversion Line)
  const tenkanHighs = highs.slice(-tenkanPeriod)
  const tenkanLows = lows.slice(-tenkanPeriod)
  const tenkanSen = (Math.max(...tenkanHighs) + Math.min(...tenkanLows)) / 2

  // Calculate Kijun-sen (Base Line)
  const kijunHighs = highs.slice(-kijunPeriod)
  const kijunLows = lows.slice(-kijunPeriod)
  const kijunSen = (Math.max(...kijunHighs) + Math.min(...kijunLows)) / 2

  // Calculate Senkou Span A (Leading Span A)
  const senkouSpanA = (tenkanSen + kijunSen) / 2

  // Calculate Senkou Span B (Leading Span B)
  const senkouHighs = highs.slice(-senkouSpanBPeriod)
  const senkouLows = lows.slice(-senkouSpanBPeriod)
  const senkouSpanB = (Math.max(...senkouHighs) + Math.min(...senkouLows)) / 2

  // Calculate Chikou Span (Lagging Span)
  const chikouSpan = closes[closes.length - displacement]

  return {
    tenkanSen,
    kijunSen,
    senkouSpanA,
    senkouSpanB,
    chikouSpan,
  }
}

// Generate enhanced mock market data for testing
export function generateEnhancedMockMarketData(symbol: string, market = "OTC", timeframe = "M1"): EtherealMarketData {
  // Generate random price data
  const basePrice =
    symbol === "EUR/USD"
      ? 1.1
      : symbol === "GBP/USD"
        ? 1.3
        : symbol === "USD/JPY"
          ? 110
          : symbol === "AUD/USD"
            ? 0.7
            : symbol === "USD/CAD"
              ? 1.25
              : symbol === "EUR/JPY"
                ? 130
                : symbol === "AUD/JPY"
                  ? 85
                  : symbol === "NZD/JPY"
                    ? 80
                    : symbol === "USD/MXN"
                      ? 17
                      : symbol === "USD/SGD"
                        ? 1.35
                        : symbol === "EUR/NZD"
                          ? 1.7
                          : symbol === "GBP/NZD"
                            ? 1.9
                            : symbol === "AUD/CAD"
                              ? 0.9
                              : symbol === "CAD/JPY"
                                ? 90
                                : 0.8

  const prices = []
  const highs = []
  const lows = []
  const volumes = []
  const openTime = []
  const now = Date.now()

  for (let i = 0; i < 100; i++) {
    const randomChange = (Math.random() - 0.5) * 0.01
    const price = i === 0 ? basePrice : prices[i - 1] * (1 + randomChange)
    prices.push(price)

    // Generate high, low, and volume
    const high = price * (1 + Math.random() * 0.005)
    const low = price * (1 - Math.random() * 0.005)
    const volume = Math.floor(Math.random() * 1000) + 500

    highs.push(high)
    lows.push(low)
    volumes.push(volume)

    // Generate timestamp (going back in time)
    openTime.push(now - (100 - i) * 60000) // 1-minute intervals
  }

  return {
    symbol,
    prices,
    highs,
    lows,
    volumes,
    market,
    timeframe,
    openTime,
  }
}

// Define the EtherealMarketData type
export type EtherealMarketData = {
  symbol: string
  prices: number[]
  highs: number[]
  lows: number[]
  volumes: number[]
  market: string
  timeframe: string
  openTime: number[] // Timestamp for each candle
}
