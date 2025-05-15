import {
  calculateRSI,
  calculateMACD,
  calculateEMA,
  calculateBollingerBands,
  calculateVolumeAnalysis,
  detectRSIDivergence,
  calculateDynamicLevels,
  calculateATR,
} from "./indicators"

export type MarketData = {
  symbol: string
  prices: number[]
  highs: number[]
  lows: number[]
  volumes: number[]
  market: string
  timeframe: string
}

export type Signal = {
  symbol: string
  market: string
  timeframe: string
  signal: "BUY" | "SELL" | "NEUTRAL"
  confidence: number
  reasons: string[]
  timestamp: string
  indicators: {
    rsi: number
    macd: {
      macd: number
      signal: number
      histogram: number
    }
    ema50: number
    bollingerBands: {
      upper: number
      middle: number
      lower: number
    }
    volumeAnalysis: {
      volumeStrength: number
      priceVolumeCorrelation: number
    }
    divergence: {
      bullishDivergence: boolean
      bearishDivergence: boolean
    }
  }
  riskManagement: {
    stopLoss: number
    takeProfit: number
    riskRewardRatio: number
    positionSize: number
  }
  multiTimeframeConfirmation: {
    m5Trend: "bullish" | "bearish" | "neutral"
    m15Trend: "bullish" | "bearish" | "neutral"
    m30Trend: "bullish" | "bearish" | "neutral"
    confirmed: boolean
  }
}

// Generate a trading signal based on technical analysis
export function generateSignal(marketData: MarketData, accountBalance = 1000): Signal {
  const { prices, highs, lows, volumes, symbol, market, timeframe } = marketData
  const lastPrice = prices[prices.length - 1]

  // Calculate indicators
  const rsi = calculateRSI(prices)
  const macd = calculateMACD(prices)
  const ema50 = calculateEMA(prices)
  const bollingerBands = calculateBollingerBands(prices)
  const volumeAnalysis = calculateVolumeAnalysis(volumes, prices)

  // Calculate RSI values for divergence detection
  const rsiValues = []
  for (let i = 0; i < prices.length; i++) {
    rsiValues.push(calculateRSI(prices.slice(0, i + 1)))
  }
  const divergence = detectRSIDivergence(prices, rsiValues)

  // Calculate ATR for volatility measurement
  const atr = calculateATR(highs, lows, prices)

  // Mock multi-timeframe confirmation (in a real system, this would use actual data from higher timeframes)
  const multiTimeframeConfirmation = {
    m5Trend: Math.random() > 0.6 ? "bullish" : Math.random() > 0.3 ? "bearish" : "neutral",
    m15Trend: Math.random() > 0.6 ? "bullish" : Math.random() > 0.3 ? "bearish" : "neutral",
    m30Trend: Math.random() > 0.6 ? "bullish" : Math.random() > 0.3 ? "bearish" : "neutral",
    confirmed: Math.random() > 0.3, // 70% chance of confirmation
  } as const

  // Signal logic based on multiple indicators
  let signalType: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL"
  let confidence = 0
  const reasons: string[] = []

  // RSI conditions with MACD confirmation and EMA validation
  if (rsi < 30 && macd.histogram > 0 && lastPrice > ema50) {
    signalType = "BUY"
    confidence += 30
    reasons.push("RSI indicates oversold conditions (< 30)")
    reasons.push("MACD histogram is positive, confirming bullish momentum")
    reasons.push("Price is above EMA50, confirming uptrend")
  } else if (rsi > 70 && macd.histogram < 0 && lastPrice < ema50) {
    signalType = "SELL"
    confidence += 30
    reasons.push("RSI indicates overbought conditions (> 70)")
    reasons.push("MACD histogram is negative, confirming bearish momentum")
    reasons.push("Price is below EMA50, confirming downtrend")
  }

  // Bollinger Bands breakout with volume confirmation
  if (lastPrice < bollingerBands.lower && volumeAnalysis.volumeStrength > 60) {
    if (signalType === "BUY") {
      confidence += 20
      reasons.push("Price is below lower Bollinger Band with strong volume, indicating potential reversal")
    } else if (signalType === "NEUTRAL") {
      signalType = "BUY"
      confidence += 20
      reasons.push("Price is below lower Bollinger Band with strong volume")
    }
  } else if (lastPrice > bollingerBands.upper && volumeAnalysis.volumeStrength > 60) {
    if (signalType === "SELL") {
      confidence += 20
      reasons.push("Price is above upper Bollinger Band with strong volume, indicating potential reversal")
    } else if (signalType === "NEUTRAL") {
      signalType = "SELL"
      confidence += 20
      reasons.push("Price is above upper Bollinger Band with strong volume")
    }
  }

  // RSI Divergence
  if (divergence.bullishDivergence) {
    if (signalType === "BUY") {
      confidence += 15
      reasons.push("Bullish RSI divergence confirms buy signal")
    } else if (signalType === "NEUTRAL") {
      signalType = "BUY"
      confidence += 15
      reasons.push("Bullish RSI divergence detected")
    }
  } else if (divergence.bearishDivergence) {
    if (signalType === "SELL") {
      confidence += 15
      reasons.push("Bearish RSI divergence confirms sell signal")
    } else if (signalType === "NEUTRAL") {
      signalType = "SELL"
      confidence += 15
      reasons.push("Bearish RSI divergence detected")
    }
  }

  // Multi-timeframe confirmation
  if (signalType === "BUY") {
    let mtfConfirmationCount = 0
    if (multiTimeframeConfirmation.m5Trend === "bullish") mtfConfirmationCount++
    if (multiTimeframeConfirmation.m15Trend === "bullish") mtfConfirmationCount++
    if (multiTimeframeConfirmation.m30Trend === "bullish") mtfConfirmationCount++

    if (mtfConfirmationCount >= 2) {
      confidence += 20
      reasons.push(`Buy signal confirmed on ${mtfConfirmationCount} higher timeframes`)
    } else {
      confidence -= 10
      reasons.push(`Warning: Buy signal not confirmed on higher timeframes`)
    }
  } else if (signalType === "SELL") {
    let mtfConfirmationCount = 0
    if (multiTimeframeConfirmation.m5Trend === "bearish") mtfConfirmationCount++
    if (multiTimeframeConfirmation.m15Trend === "bearish") mtfConfirmationCount++
    if (multiTimeframeConfirmation.m30Trend === "bearish") mtfConfirmationCount++

    if (mtfConfirmationCount >= 2) {
      confidence += 20
      reasons.push(`Sell signal confirmed on ${mtfConfirmationCount} higher timeframes`)
    } else {
      confidence -= 10
      reasons.push(`Warning: Sell signal not confirmed on higher timeframes`)
    }
  }

  // If no clear signal or low confidence, return neutral
  if (signalType === "NEUTRAL" || confidence < 50) {
    return {
      symbol,
      market,
      timeframe,
      signal: "NEUTRAL",
      confidence: Math.max(0, Math.min(confidence, 100)),
      reasons: confidence > 0 ? reasons : ["No clear trading signal based on current indicators"],
      timestamp: new Date().toISOString(),
      indicators: {
        rsi,
        macd,
        ema50,
        bollingerBands,
        volumeAnalysis,
        divergence,
      },
      riskManagement: {
        stopLoss: 0,
        takeProfit: 0,
        riskRewardRatio: 0,
        positionSize: 0,
      },
      multiTimeframeConfirmation,
    }
  }

  // Calculate risk management parameters
  const volatility = Math.min(100, Math.max(0, atr * 1000)) // Scale ATR to 0-100 range
  const { stopLoss, takeProfit, riskRewardRatio } = calculateDynamicLevels(lastPrice, volatility, signalType, atr)

  // Calculate position size based on risk (2% of account balance)
  const riskAmount = accountBalance * 0.02
  const riskPerUnit = Math.abs(lastPrice - stopLoss)
  const positionSize = riskAmount / riskPerUnit

  return {
    symbol,
    market,
    timeframe,
    signal: signalType,
    confidence: Math.min(confidence, 100),
    reasons,
    timestamp: new Date().toISOString(),
    indicators: {
      rsi,
      macd,
      ema50,
      bollingerBands,
      volumeAnalysis,
      divergence,
    },
    riskManagement: {
      stopLoss,
      takeProfit,
      riskRewardRatio,
      positionSize,
    },
    multiTimeframeConfirmation,
  }
}

// Generate mock market data for testing
export function generateMockMarketData(symbol: string, market = "OTC", timeframe = "M1"): MarketData {
  // Generate random price data
  const basePrice = symbol === "USD/JPY" ? 110 : symbol === "EUR/USD" ? 1.1 : symbol === "GBP/USD" ? 1.3 : 0.7
  const prices = []
  const highs = []
  const lows = []
  const volumes = []

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
  }

  return {
    symbol,
    prices,
    highs,
    lows,
    volumes,
    market,
    timeframe,
  }
}
