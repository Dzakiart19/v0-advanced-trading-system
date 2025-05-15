// Technical indicators calculation functions
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) {
    return 50 // Default value if not enough data
  }

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const difference = prices[prices.length - i] - prices[prices.length - i - 1]
    if (difference >= 0) {
      gains += difference
    } else {
      losses -= difference
    }
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) {
    return 100
  }

  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 }
  }

  // Calculate 12-day EMA
  let ema12 = prices.slice(0, 12).reduce((sum, price) => sum + price, 0) / 12
  const multiplier12 = 2 / (12 + 1)

  for (let i = 12; i < prices.length; i++) {
    ema12 = (prices[i] - ema12) * multiplier12 + ema12
  }

  // Calculate 26-day EMA
  let ema26 = prices.slice(0, 26).reduce((sum, price) => sum + price, 0) / 26
  const multiplier26 = 2 / (26 + 1)

  for (let i = 26; i < prices.length; i++) {
    ema26 = (prices[i] - ema26) * multiplier26 + ema26
  }

  // MACD Line = 12-day EMA - 26-day EMA
  const macd = ema12 - ema26

  // Signal Line = 9-day EMA of MACD Line
  // For simplicity, we'll just use a simple approximation
  const signal = macd * 0.9 // Simplified calculation

  // Histogram = MACD Line - Signal Line
  const histogram = macd - signal

  return { macd, signal, histogram }
}

export function calculateEMA(prices: number[], period = 50): number {
  if (prices.length < period) {
    return prices[prices.length - 1] // Return last price if not enough data
  }

  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period
  const multiplier = 2 / (period + 1)

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema
  }

  return ema
}

export function calculateBollingerBands(
  prices: number[],
  period = 20,
  stdDev = 2,
): {
  upper: number
  middle: number
  lower: number
} {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1]
    return { upper: lastPrice * 1.02, middle: lastPrice, lower: lastPrice * 0.98 }
  }

  // Calculate SMA
  const sma = prices.slice(prices.length - period).reduce((sum, price) => sum + price, 0) / period

  // Calculate Standard Deviation
  const squaredDifferences = prices.slice(prices.length - period).map((price) => Math.pow(price - sma, 2))
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / period
  const standardDeviation = Math.sqrt(variance)

  // Calculate Upper and Lower Bands
  const upperBand = sma + stdDev * standardDeviation
  const lowerBand = sma - stdDev * standardDeviation

  return { upper: upperBand, middle: sma, lower: lowerBand }
}

// Calculate volume analysis
export function calculateVolumeAnalysis(
  volumes: number[],
  prices: number[],
  period = 14,
): {
  volumeStrength: number
  priceVolumeCorrelation: number
} {
  if (volumes.length < period || prices.length < period) {
    return { volumeStrength: 50, priceVolumeCorrelation: 0 }
  }

  // Calculate average volume
  const avgVolume = volumes.slice(volumes.length - period).reduce((sum, vol) => sum + vol, 0) / period

  // Calculate volume strength (0-100)
  const latestVolume = volumes[volumes.length - 1]
  const volumeStrength = Math.min(100, Math.max(0, (latestVolume / avgVolume) * 50))

  // Calculate price-volume correlation
  let correlation = 0
  for (let i = 1; i < period; i++) {
    const priceChange = prices[prices.length - i] - prices[prices.length - i - 1]
    const volumeChange = volumes[volumes.length - i] - volumes[volumes.length - i - 1]

    // If price and volume move in the same direction, positive correlation
    if ((priceChange > 0 && volumeChange > 0) || (priceChange < 0 && volumeChange < 0)) {
      correlation += 1
    } else if (priceChange !== 0 && volumeChange !== 0) {
      correlation -= 1
    }
  }

  // Normalize correlation to -1 to 1 range
  const priceVolumeCorrelation = correlation / period

  return { volumeStrength, priceVolumeCorrelation }
}

// Detect divergence between price and RSI
export function detectRSIDivergence(
  prices: number[],
  rsiValues: number[],
  lookback = 5,
): {
  bullishDivergence: boolean
  bearishDivergence: boolean
} {
  if (prices.length < lookback || rsiValues.length < lookback) {
    return { bullishDivergence: false, bearishDivergence: false }
  }

  // Find local price lows and highs
  let priceHigh = Number.NEGATIVE_INFINITY
  let priceLow = Number.POSITIVE_INFINITY
  let priceHighIndex = -1
  let priceLowIndex = -1

  for (let i = 1; i <= lookback; i++) {
    const price = prices[prices.length - i]
    if (price > priceHigh) {
      priceHigh = price
      priceHighIndex = prices.length - i
    }
    if (price < priceLow) {
      priceLow = price
      priceLowIndex = prices.length - i
    }
  }

  // Find RSI values at those points
  const rsiAtPriceHigh = rsiValues[rsiValues.length - (prices.length - priceHighIndex)]
  const rsiAtPriceLow = rsiValues[rsiValues.length - (prices.length - priceLowIndex)]

  // Find local RSI lows and highs
  let rsiHigh = Number.NEGATIVE_INFINITY
  let rsiLow = Number.POSITIVE_INFINITY
  let rsiHighIndex = -1
  let rsiLowIndex = -1

  for (let i = 1; i <= lookback; i++) {
    const rsi = rsiValues[rsiValues.length - i]
    if (rsi > rsiHigh) {
      rsiHigh = rsi
      rsiHighIndex = rsiValues.length - i
    }
    if (rsi < rsiLow) {
      rsiLow = rsi
      rsiLowIndex = rsiValues.length - i
    }
  }

  // Bullish divergence: price makes lower low but RSI makes higher low
  const bullishDivergence =
    priceLowIndex === prices.length - 1 && // Latest price is a low
    rsiValues[rsiValues.length - 1] > rsiAtPriceLow // But RSI is higher than at previous low

  // Bearish divergence: price makes higher high but RSI makes lower high
  const bearishDivergence =
    priceHighIndex === prices.length - 1 && // Latest price is a high
    rsiValues[rsiValues.length - 1] < rsiAtPriceHigh // But RSI is lower than at previous high

  return { bullishDivergence, bearishDivergence }
}

// Calculate dynamic stop loss and take profit levels
export function calculateDynamicLevels(
  price: number,
  volatility: number,
  signalType: "BUY" | "SELL",
  atr: number, // Average True Range for volatility
): {
  stopLoss: number
  takeProfit: number
  riskRewardRatio: number
} {
  // Base multipliers
  const baseStopMultiplier = 1.5
  const baseTpMultiplier = 2.5

  // Adjust multipliers based on volatility (0-100)
  const volatilityFactor = volatility / 100
  const stopMultiplier = baseStopMultiplier * (1 + volatilityFactor)
  const tpMultiplier = baseTpMultiplier * (1 + volatilityFactor * 0.5)

  // Calculate stop loss and take profit
  let stopLoss, takeProfit

  if (signalType === "BUY") {
    stopLoss = price - atr * stopMultiplier
    takeProfit = price + atr * tpMultiplier
  } else {
    // SELL
    stopLoss = price + atr * stopMultiplier
    takeProfit = price - atr * tpMultiplier
  }

  // Calculate risk-reward ratio
  const risk = Math.abs(price - stopLoss)
  const reward = Math.abs(price - takeProfit)
  const riskRewardRatio = reward / risk

  return { stopLoss, takeProfit, riskRewardRatio }
}

// Calculate Average True Range (ATR) for volatility measurement
export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
    return 0.001 // Default small value if not enough data
  }

  const trueRanges = []

  for (let i = 1; i < period + 1; i++) {
    const high = highs[highs.length - i]
    const low = lows[lows.length - i]
    const prevClose = closes[closes.length - i - 1]

    // True Range is the greatest of:
    // 1. Current High - Current Low
    // 2. |Current High - Previous Close|
    // 3. |Current Low - Previous Close|
    const tr1 = high - low
    const tr2 = Math.abs(high - prevClose)
    const tr3 = Math.abs(low - prevClose)

    trueRanges.push(Math.max(tr1, tr2, tr3))
  }

  // Calculate average
  return trueRanges.reduce((sum, tr) => sum + tr, 0) / period
}
