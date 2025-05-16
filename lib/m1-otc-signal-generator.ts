import {
  CURRENCY_PAIRS,
  INDICATOR_SETTINGS,
  SIGNAL_ENTRY_SECOND,
  SIGNAL_GENERATION_MILLISECOND,
  SIGNAL_GENERATION_SECOND,
  SIGNAL_THRESHOLDS,
} from "./m1-otc-config"
import { fetchWithFallback } from "./data-fetcher"
import { logger } from "./logger"

export interface SignalResult {
  symbol: string
  name: string
  direction: "BUY" | "SELL" | "NEUTRAL"
  entryTime: string
  strength: number
  technicalFactors: {
    rsi: number
    macd: number
    ema: number
    bollingerBands: {
      upper: number
      middle: number
      lower: number
      percentB: number
    }
  }
  marketFactors: {
    volatility: number
    volumeStrength: number
    sentiment: number
  }
  supportResistance: {
    nearestSupport: number
    nearestResistance: number
    distanceToSupport: number
    distanceToResistance: number
  }
  riskReward: number
  timestamp: string
  price?: number
}

export interface TradeResult {
  symbol: string
  direction: "BUY" | "SELL"
  entryTime: string
  entryPrice: number
  exitTime: string
  exitPrice: number
  result: "WIN" | "LOSS" | "BREAKEVEN"
  pips: number
  technicalReasons: string[]
  sentimentReasons: string[]
}

// Store active signals
const activeSignals: Record<string, SignalResult> = {}

// Store completed trades
const completedTrades: TradeResult[] = []

// Initialize the signal generator
export function initializeSignalGenerator(telegramSendFn: (message: string) => Promise<void>): void {
  logger.enableTelegramLogging(telegramSendFn)

  // Start the signal generation scheduler
  startSignalGenerationScheduler()

  logger.info("M1 OTC Signal Generator initialized")
}

// Start the scheduler for signal generation
function startSignalGenerationScheduler(): void {
  // Check every second for the right time to generate signals
  setInterval(async () => {
    const now = new Date()
    const seconds = now.getSeconds()
    const milliseconds = now.getMilliseconds()

    // Generate signals at exactly the 30-second mark
    if (
      seconds === SIGNAL_GENERATION_SECOND &&
      milliseconds >= SIGNAL_GENERATION_MILLISECOND &&
      milliseconds < SIGNAL_GENERATION_MILLISECOND + 100
    ) {
      logger.info("Signal generation time reached, scanning markets...")
      await scanAllMarkets()
    }

    // Check for trade completion at the next minute
    if (seconds === 5 && milliseconds < 100) {
      await checkTradeResults()
    }
  }, 100) // Check every 100ms for precise timing
}

// Scan all markets for potential signals
async function scanAllMarkets(): Promise<void> {
  const scanStartTime = Date.now()
  logger.info(`Starting market scan for ${CURRENCY_PAIRS.length} currency pairs`)

  // Process all currency pairs in parallel
  const signalPromises = CURRENCY_PAIRS.map((pair) => generateSignalForPair(pair.symbol))

  try {
    const signals = await Promise.all(signalPromises)
    const validSignals = signals.filter(
      (signal) =>
        signal &&
        (signal.direction === "BUY" || signal.direction === "SELL") &&
        signal.strength >= SIGNAL_THRESHOLDS.MINIMUM_STRENGTH,
    )

    logger.info(`Market scan completed in ${Date.now() - scanStartTime}ms. Found ${validSignals.length} valid signals.`)

    // Send all valid signals
    for (const signal of validSignals) {
      sendSignalToTelegram(signal)
      activeSignals[signal.symbol] = signal
    }
  } catch (error) {
    logger.error("Error during market scan:", error)
  }
}

// Generate a signal for a specific currency pair
async function generateSignalForPair(symbol: string): Promise<SignalResult | null> {
  try {
    logger.debug(`Analyzing ${symbol}...`)

    // Fetch all necessary data
    const [historicalData, rsiData, macdData, emaData, bbandsData, sentimentData] = await Promise.all([
      fetchWithFallback(symbol, "historical", { interval: "1min", outputsize: 100 }),
      fetchWithFallback(symbol, "indicators", {
        indicator: "rsi",
        params: { time_period: INDICATOR_SETTINGS.RSI.period },
      }),
      fetchWithFallback(symbol, "indicators", {
        indicator: "macd",
        params: {
          fast_period: INDICATOR_SETTINGS.MACD.fastPeriod,
          slow_period: INDICATOR_SETTINGS.MACD.slowPeriod,
          signal_period: INDICATOR_SETTINGS.MACD.signalPeriod,
        },
      }),
      fetchWithFallback(symbol, "indicators", {
        indicator: "ema",
        params: { time_period: INDICATOR_SETTINGS.EMA.shortPeriod },
      }),
      fetchWithFallback(symbol, "indicators", {
        indicator: "bbands",
        params: {
          time_period: INDICATOR_SETTINGS.BOLLINGER_BANDS.period,
          stddev: INDICATOR_SETTINGS.BOLLINGER_BANDS.stdDev,
        },
      }),
      fetchWithFallback(symbol, "sentiment"),
    ])

    // Extract the latest data points
    const latestCandle = historicalData.values[0]
    const latestRSI = rsiData.values[0].rsi
    const latestMACD = {
      macd: macdData.values[0].macd,
      signal: macdData.values[0].macd_signal,
      histogram: macdData.values[0].macd_hist,
    }
    const latestEMA = emaData.values[0].ema
    const latestBBands = {
      upper: bbandsData.values[0].upper_band,
      middle: bbandsData.values[0].middle_band,
      lower: bbandsData.values[0].lower_band,
    }

    // Calculate additional metrics
    const volatility = calculateVolatility(historicalData.values.slice(0, 20))
    const volumeStrength = calculateVolumeStrength(historicalData.values.slice(0, 20))
    const sentiment = sentimentData.bearish ? -sentimentData.bearishPercent : sentimentData.bullishPercent

    // Calculate support and resistance levels
    const supportResistance = calculateSupportResistance(historicalData.values.slice(0, 50), latestCandle.close)

    // Determine signal direction based on technical analysis
    const direction = determineSignalDirection(
      latestRSI,
      latestMACD,
      latestEMA,
      latestBBands,
      latestCandle.close,
      sentiment,
    )

    // Calculate signal strength (0-100)
    const strength = calculateSignalStrength(
      latestRSI,
      latestMACD,
      latestBBands,
      volatility,
      volumeStrength,
      sentiment,
      supportResistance,
      direction,
    )

    // Calculate risk/reward ratio
    const riskReward = calculateRiskReward(
      direction,
      latestCandle.close,
      supportResistance.nearestSupport,
      supportResistance.nearestResistance,
    )

    // Only return a signal if it meets the minimum strength threshold
    if (direction !== "NEUTRAL" && strength >= SIGNAL_THRESHOLDS.MINIMUM_STRENGTH) {
      // Calculate entry time (next minute at 00 seconds)
      const now = new Date()
      const entryTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes() + 1, // Always next minute
        SIGNAL_ENTRY_SECOND, // 0 seconds
      )

      const currencyPair = CURRENCY_PAIRS.find((pair) => pair.symbol === symbol)

      return {
        symbol,
        name: currencyPair?.name || symbol,
        direction,
        entryTime: entryTime.toISOString(),
        strength,
        technicalFactors: {
          rsi: latestRSI,
          macd: latestMACD.histogram,
          ema: latestEMA,
          bollingerBands: {
            upper: latestBBands.upper,
            middle: latestBBands.middle,
            lower: latestBBands.lower,
            percentB: calculateBollingerPercentB(latestCandle.close, latestBBands),
          },
        },
        marketFactors: {
          volatility,
          volumeStrength,
          sentiment,
        },
        supportResistance,
        riskReward,
        timestamp: new Date().toISOString(),
        price: latestCandle.close,
      }
    }

    return null
  } catch (error) {
    logger.error(`Error generating signal for ${symbol}:`, error)
    return null
  }
}

// Determine signal direction based on technical indicators
function determineSignalDirection(
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  ema: number,
  bbands: { upper: number; middle: number; lower: number },
  price: number,
  sentiment: number,
): "BUY" | "SELL" | "NEUTRAL" {
  // Count bullish and bearish signals
  let bullishSignals = 0
  let bearishSignals = 0

  // RSI
  if (rsi < INDICATOR_SETTINGS.RSI.oversold) bullishSignals += 2
  else if (rsi < 40) bullishSignals += 1
  else if (rsi > INDICATOR_SETTINGS.RSI.overbought) bearishSignals += 2
  else if (rsi > 60) bearishSignals += 1

  // MACD
  if (macd.histogram > 0 && macd.macd > macd.signal) bullishSignals += 2
  else if (macd.histogram < 0 && macd.macd < macd.signal) bearishSignals += 2

  // EMA
  if (price > ema) bullishSignals += 1
  else if (price < ema) bearishSignals += 1

  // Bollinger Bands
  if (price < bbands.lower) bullishSignals += 2
  else if (price > bbands.upper) bearishSignals += 2

  // Sentiment
  if (sentiment > 60) bullishSignals += 1
  else if (sentiment < -60) bearishSignals += 1

  // Determine direction based on signal count
  if (bullishSignals >= 5 && bullishSignals > bearishSignals + 2) return "BUY"
  if (bearishSignals >= 5 && bearishSignals > bullishSignals + 2) return "SELL"

  return "NEUTRAL"
}

// Calculate signal strength (0-100)
function calculateSignalStrength(
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  bbands: { upper: number; middle: number; lower: number },
  volatility: number,
  volumeStrength: number,
  sentiment: number,
  supportResistance: {
    nearestSupport: number
    nearestResistance: number
    distanceToSupport: number
    distanceToResistance: number
  },
  direction: "BUY" | "SELL" | "NEUTRAL",
): number {
  if (direction === "NEUTRAL") return 0

  let strength = 50 // Start at neutral

  // RSI contribution (0-20 points)
  if (direction === "BUY") {
    if (rsi < 20) strength += 20
    else if (rsi < 30) strength += 15
    else if (rsi < 40) strength += 10
    else if (rsi < 50) strength += 5
  } else {
    if (rsi > 80) strength += 20
    else if (rsi > 70) strength += 15
    else if (rsi > 60) strength += 10
    else if (rsi > 50) strength += 5
  }

  // MACD contribution (0-20 points)
  const macdStrength = Math.abs(macd.histogram) * 1000
  if ((direction === "BUY" && macd.histogram > 0) || (direction === "SELL" && macd.histogram < 0)) {
    if (macdStrength > 0.5) strength += 20
    else if (macdStrength > 0.3) strength += 15
    else if (macdStrength > 0.1) strength += 10
    else strength += 5
  }

  // Bollinger Bands contribution (0-15 points)
  const percentB = calculateBollingerPercentB(direction === "BUY" ? bbands.lower : bbands.upper, bbands)
  if ((direction === "BUY" && percentB < 0.1) || (direction === "SELL" && percentB > 0.9)) {
    strength += 15
  } else if ((direction === "BUY" && percentB < 0.2) || (direction === "SELL" && percentB > 0.8)) {
    strength += 10
  } else if ((direction === "BUY" && percentB < 0.3) || (direction === "SELL" && percentB > 0.7)) {
    strength += 5
  }

  // Volatility contribution (0-10 points)
  if (volatility > 1.5) strength += 10
  else if (volatility > 1.2) strength += 7
  else if (volatility > 1.0) strength += 5
  else if (volatility < 0.5) strength -= 5

  // Volume contribution (0-15 points)
  if (volumeStrength > 2.0) strength += 15
  else if (volumeStrength > 1.5) strength += 10
  else if (volumeStrength > 1.0) strength += 5
  else if (volumeStrength < 0.8) strength -= 5

  // Sentiment contribution (0-10 points)
  if ((direction === "BUY" && sentiment > 60) || (direction === "SELL" && sentiment < -60)) {
    strength += 10
  } else if ((direction === "BUY" && sentiment > 30) || (direction === "SELL" && sentiment < -30)) {
    strength += 5
  }

  // Support/Resistance contribution (0-10 points)
  if (
    direction === "BUY" &&
    supportResistance.distanceToSupport < 0.1 &&
    supportResistance.distanceToResistance > 0.5
  ) {
    strength += 10
  } else if (
    direction === "SELL" &&
    supportResistance.distanceToResistance < 0.1 &&
    supportResistance.distanceToSupport > 0.5
  ) {
    strength += 10
  }

  // Ensure strength is within 0-100 range
  return Math.max(0, Math.min(100, strength))
}

// Calculate Bollinger Bands %B
function calculateBollingerPercentB(price: number, bbands: { upper: number; middle: number; lower: number }): number {
  return (price - bbands.lower) / (bbands.upper - bbands.lower)
}

// Calculate volatility based on ATR
function calculateVolatility(candles: any[]): number {
  // Simple implementation - calculate average range and compare to historical
  const ranges = candles.map((candle) => Math.abs(candle.high - candle.low))
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length
  const historicalAvgRange = 0.001 // This would be calculated from longer-term data

  return avgRange / historicalAvgRange
}

// Calculate volume strength
function calculateVolumeStrength(candles: any[]): number {
  // Simple implementation - compare recent volume to historical average
  const volumes = candles.map((candle) => candle.volume || 1)
  const avgVolume = volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length
  const historicalAvgVolume = 1000 // This would be calculated from longer-term data

  return avgVolume / historicalAvgVolume
}

// Calculate support and resistance levels
function calculateSupportResistance(
  candles: any[],
  currentPrice: number,
): {
  nearestSupport: number
  nearestResistance: number
  distanceToSupport: number
  distanceToResistance: number
} {
  // Simple implementation - find recent swing highs and lows
  const highs = candles.map((candle) => candle.high)
  const lows = candles.map((candle) => candle.low)

  // Sort prices to find potential levels
  const sortedHighs = [...highs].sort((a, b) => a - b)
  const sortedLows = [...lows].sort((a, b) => a - b)

  // Find nearest support (below current price)
  let nearestSupport = 0
  for (let i = sortedLows.length - 1; i >= 0; i--) {
    if (sortedLows[i] < currentPrice) {
      nearestSupport = sortedLows[i]
      break
    }
  }

  // Find nearest resistance (above current price)
  let nearestResistance = Number.POSITIVE_INFINITY
  for (let i = 0; i < sortedHighs.length; i++) {
    if (sortedHighs[i] > currentPrice) {
      nearestResistance = sortedHighs[i]
      break
    }
  }

  // If no support/resistance found, use simple percentage
  if (nearestSupport === 0) nearestSupport = currentPrice * 0.995
  if (nearestResistance === Number.POSITIVE_INFINITY) nearestResistance = currentPrice * 1.005

  // Calculate distances as percentages
  const distanceToSupport = (currentPrice - nearestSupport) / currentPrice
  const distanceToResistance = (nearestResistance - currentPrice) / currentPrice

  return {
    nearestSupport,
    nearestResistance,
    distanceToSupport,
    distanceToResistance,
  }
}

// Calculate risk/reward ratio
function calculateRiskReward(
  direction: "BUY" | "SELL" | "NEUTRAL",
  currentPrice: number,
  support: number,
  resistance: number,
): number {
  if (direction === "NEUTRAL") return 0

  if (direction === "BUY") {
    const potentialReward = resistance - currentPrice
    const potentialRisk = currentPrice - support
    return potentialRisk > 0 ? potentialReward / potentialRisk : 0
  } else {
    const potentialReward = currentPrice - support
    const potentialRisk = resistance - currentPrice
    return potentialRisk > 0 ? potentialReward / potentialRisk : 0
  }
}

// Send signal to Telegram
async function sendSignalToTelegram(signal: SignalResult): Promise<void> {
  try {
    const message = formatSignalMessage(signal)
    await sendTelegramMessage(message)
    logger.info(`Signal sent for ${signal.symbol}: ${signal.direction}`)
  } catch (error) {
    logger.error(`Error sending signal to Telegram:`, error)
  }
}

// Format signal message for Telegram
function formatSignalMessage(signal: SignalResult): string {
  const directionText = signal.direction === "BUY" ? "buy" : "sell"
  const timeframe = "1 minutes"

  // Get volatility description
  let volatilityDesc = "Average"
  if (signal.marketFactors.volatility > 1.5) volatilityDesc = "Above average"
  else if (signal.marketFactors.volatility > 2) volatilityDesc = "High"
  else if (signal.marketFactors.volatility < 0.8) volatilityDesc = "Below average"
  else if (signal.marketFactors.volatility < 0.5) volatilityDesc = "Low"

  // Get asset strength description
  let assetStrength = "Neutral"
  if (signal.marketFactors.volumeStrength > 1.5) {
    assetStrength = signal.direction === "BUY" ? "Strong bullish" : "Strong bearish"
  } else if (signal.marketFactors.volumeStrength > 1.2) {
    assetStrength = signal.direction === "BUY" ? "Moderately bullish" : "Moderately bearish"
  } else if (signal.marketFactors.volumeStrength < 0.8) {
    assetStrength = "Weak"
  }

  // Get volume result
  let volumeResult = "Normal"
  if (signal.marketFactors.volumeStrength > 1.5) volumeResult = "Above average"
  else if (signal.marketFactors.volumeStrength > 2) volumeResult = "High"
  else if (signal.marketFactors.volumeStrength < 0.8) volumeResult = "Below average"
  else if (signal.marketFactors.volumeStrength < 0.5) volumeResult = "Low"

  // Get sentiment description
  let sentimentDesc = "Neutral pressure"
  if (signal.marketFactors.sentiment > 30) sentimentDesc = "Upward pressure"
  else if (signal.marketFactors.sentiment > 60) sentimentDesc = "Strong upward pressure"
  else if (signal.marketFactors.sentiment < -30) sentimentDesc = "Downward pressure"
  else if (signal.marketFactors.sentiment < -60) sentimentDesc = "Strong downward pressure"

  // Format moving average description
  const emaDesc =
    signal.price && signal.price > signal.technicalFactors.ema
      ? "Price above EMA (bullish)"
      : "Price below EMA (bearish)"

  return `${signal.symbol} | ${timeframe} | ${directionText}

📡 Market info:
• Volatility: ${volatilityDesc}
• Asset strength by volume: ${assetStrength}
• Volume result: ${volumeResult}
• Sentiment: ${sentimentDesc}

💵 Technical overview:
• Current price: ${signal.price ? signal.price.toFixed(5) : "N/A"} OTC
• Resistance (R1): ${signal.supportResistance.nearestResistance.toFixed(5)} OTC
• Support (S1): ${signal.supportResistance.nearestSupport.toFixed(5)} OTC
• RSI: ${signal.technicalFactors.rsi.toFixed(2)}
• MACD: ${signal.technicalFactors.macd.toFixed(5)}
• Moving Average: ${emaDesc}

📇 Signal strength:
• Strength: ${signal.strength.toFixed(0)}/100
• Market conditions: ${signal.direction === "BUY" ? "Bullish reversal potential" : "Bearish reversal potential"}
`
}

// Send message to Telegram (placeholder - will be implemented by the caller)
async function sendTelegramMessage(message: string): Promise<void> {
  // This function will be provided by the caller
  // For now, just log the message
  logger.debug(`[TELEGRAM MESSAGE] ${message}`)
}

// Check trade results after the signal time
async function checkTradeResults(): Promise<void> {
  const now = new Date()
  const symbols = Object.keys(activeSignals)

  if (symbols.length === 0) return

  logger.info(`Checking trade results for ${symbols.length} active signals`)

  for (const symbol of symbols) {
    try {
      const signal = activeSignals[symbol]
      const entryTime = new Date(signal.entryTime)

      // Only check results if at least 1 minute has passed since entry
      if (now.getTime() - entryTime.getTime() < 60000) continue

      // Fetch the latest data
      const historicalData = await fetchWithFallback(symbol, "historical", { interval: "1min", outputsize: 5 })

      // Get entry and exit prices
      const entryCandle = historicalData.values.find((candle: any) => {
        const candleTime = new Date(candle.datetime)
        return candleTime.getMinutes() === entryTime.getMinutes() && candleTime.getHours() === entryTime.getHours()
      })

      const exitCandle = historicalData.values[0] // Latest candle

      if (!entryCandle || !exitCandle) {
        logger.warn(`Could not find candles for trade result calculation: ${symbol}`)
        continue
      }

      // Calculate result
      const entryPrice = entryCandle.open
      const exitPrice = exitCandle.close
      let result: "WIN" | "LOSS" | "BREAKEVEN"
      let pips: number

      if (signal.direction === "BUY") {
        pips = (exitPrice - entryPrice) * 10000
        result = pips > 1 ? "WIN" : pips < -1 ? "LOSS" : "BREAKEVEN"
      } else {
        pips = (entryPrice - exitPrice) * 10000
        result = pips > 1 ? "WIN" : pips < -1 ? "LOSS" : "BREAKEVEN"
      }

      // Generate reasons for the result
      const technicalReasons = generateTechnicalReasons(signal, result)
      const sentimentReasons = generateSentimentReasons(signal, result)

      // Create trade result
      const tradeResult: TradeResult = {
        symbol: signal.symbol,
        direction: signal.direction,
        entryTime: signal.entryTime,
        entryPrice,
        exitTime: exitCandle.datetime,
        exitPrice,
        result,
        pips,
        technicalReasons,
        sentimentReasons,
      }

      // Store the result
      completedTrades.push(tradeResult)

      // Send the result to Telegram
      await sendTradeResultToTelegram(tradeResult)

      // Remove from active signals
      delete activeSignals[symbol]
    } catch (error) {
      logger.error(`Error checking trade result for ${symbol}:`, error)
    }
  }
}

// Generate technical reasons for trade result
function generateTechnicalReasons(signal: SignalResult, result: "WIN" | "LOSS" | "BREAKEVEN"): string[] {
  const reasons: string[] = []

  if (result === "WIN") {
    if (signal.direction === "BUY") {
      if (signal.technicalFactors.rsi < 30) reasons.push("RSI was oversold, indicating a potential reversal")
      if (signal.technicalFactors.macd > 0) reasons.push("Positive MACD histogram confirmed upward momentum")
      if (signal.technicalFactors.bollingerBands.percentB < 0.2)
        reasons.push("Price was near the lower Bollinger Band, suggesting a bounce")
    } else {
      if (signal.technicalFactors.rsi > 70) reasons.push("RSI was overbought, indicating a potential reversal")
      if (signal.technicalFactors.macd < 0) reasons.push("Negative MACD histogram confirmed downward momentum")
      if (signal.technicalFactors.bollingerBands.percentB > 0.8)
        reasons.push("Price was near the upper Bollinger Band, suggesting a drop")
    }
  } else if (result === "LOSS") {
    if (signal.direction === "BUY") {
      if (signal.technicalFactors.rsi > 40)
        reasons.push("RSI was not deeply oversold, lacking strong reversal potential")
      if (signal.technicalFactors.macd < 0) reasons.push("MACD remained bearish despite buy signal")
      if (signal.marketFactors.volatility < 1) reasons.push("Low volatility prevented sufficient price movement")
    } else {
      if (signal.technicalFactors.rsi < 60)
        reasons.push("RSI was not deeply overbought, lacking strong reversal potential")
      if (signal.technicalFactors.macd > 0) reasons.push("MACD remained bullish despite sell signal")
      if (signal.marketFactors.volatility < 1) reasons.push("Low volatility prevented sufficient price movement")
    }
  }

  // Add general reasons
  if (signal.marketFactors.volumeStrength > 1.5) {
    reasons.push(`Strong volume (${signal.marketFactors.volumeStrength.toFixed(1)}x) supported the price movement`)
  } else if (signal.marketFactors.volumeStrength < 0.8) {
    reasons.push(`Low volume (${signal.marketFactors.volumeStrength.toFixed(1)}x) failed to support the price movement`)
  }

  return reasons
}

// Generate sentiment reasons for trade result
function generateSentimentReasons(signal: SignalResult, result: "WIN" | "LOSS" | "BREAKEVEN"): string[] {
  const reasons: string[] = []

  if (result === "WIN") {
    if (
      (signal.direction === "BUY" && signal.marketFactors.sentiment > 30) ||
      (signal.direction === "SELL" && signal.marketFactors.sentiment < -30)
    ) {
      reasons.push(
        `Market sentiment (${signal.marketFactors.sentiment > 0 ? "+" : ""}${signal.marketFactors.sentiment.toFixed(0)}%) aligned with the trade direction`,
      )
    }

    if (signal.direction === "BUY" && signal.supportResistance.distanceToSupport < 0.1) {
      reasons.push("Price was near a strong support level, providing a solid foundation for the upward move")
    } else if (signal.direction === "SELL" && signal.supportResistance.distanceToResistance < 0.1) {
      reasons.push("Price was near a strong resistance level, creating a ceiling for price action")
    }
  } else if (result === "LOSS") {
    if (
      (signal.direction === "BUY" && signal.marketFactors.sentiment < 0) ||
      (signal.direction === "SELL" && signal.marketFactors.sentiment > 0)
    ) {
      reasons.push(
        `Market sentiment (${signal.marketFactors.sentiment > 0 ? "+" : ""}${signal.marketFactors.sentiment.toFixed(0)}%) opposed the trade direction`,
      )
    }

    if (signal.riskReward < 1) {
      reasons.push(`Unfavorable risk/reward ratio (${signal.riskReward.toFixed(1)}) reduced the probability of success`)
    }
  }

  return reasons
}

// Send trade result to Telegram
async function sendTradeResultToTelegram(result: TradeResult): Promise<void> {
  try {
    const message = formatTradeResultMessage(result)
    await sendTelegramMessage(message)
    logger.info(`Trade result sent for ${result.symbol}: ${result.result}`)
  } catch (error) {
    logger.error(`Error sending trade result to Telegram:`, error)
  }
}

// Format trade result message for Telegram
function formatTradeResultMessage(result: TradeResult): string {
  const resultEmoji = result.result === "WIN" ? "✅" : result.result === "LOSS" ? "❌" : "⚖️"
  const directionEmoji = result.direction === "BUY" ? "🟢" : "🔴"

  return `
${resultEmoji} *Trade Result: ${result.result}*
${directionEmoji} *${result.direction} ${result.symbol}*
⏰ Entry: ${new Date(result.entryTime).toLocaleTimeString()} @ ${result.entryPrice.toFixed(5)}
⌛ Exit: ${new Date(result.exitTime).toLocaleTimeString()} @ ${result.exitPrice.toFixed(5)}
📊 Result: ${result.pips.toFixed(1)} pips

*Technical Analysis:*
${result.technicalReasons.map((reason) => `• ${reason}`).join("\n")}

*Market Sentiment:*
${result.sentimentReasons.map((reason) => `• ${reason}`).join("\n")}
`
}

// Get all completed trades
export function getCompletedTrades(): TradeResult[] {
  return [...completedTrades]
}

// Get active signals
export function getActiveSignals(): SignalResult[] {
  return Object.values(activeSignals)
}
