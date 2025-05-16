import { ApiService } from "./api-service"
import {
  OTC_CURRENCY_PAIRS,
  TECHNICAL_INDICATORS,
  SIGNAL_STRENGTH,
  SIGNAL_TIMING,
  SIGNAL_MESSAGE_FORMAT,
  TRADE_RESULT_FORMAT,
  LOGGING_CONFIG,
} from "./otc-auto-signal-config"
import { Logger } from "./logger"

export interface OTCSignal {
  pair: string
  direction: "BUY" | "SELL"
  price: number
  timestamp: string
  entryTime: string
  strength: number
  technicalIndicators: {
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
  marketInfo: {
    volatility: {
      value: number
      description: string
      atr: number
    }
    assetStrength: string
    volumeMetric: string
    volumeData: {
      current: number
      average: number
      ratio: number
      trend: string
      anomaly: boolean
      anomalyScore: number
    }
    sentiment: {
      score: number
      description: string
      keywords: string[]
    }
  }
  levels: {
    support: number
    resistance: number
  }
  marketConditions: string
  reasons: string[]
  message: string
}

export interface TradeResult {
  signal: OTCSignal
  result: "Win" | "Lose"
  reason: string
  entryPrice: number
  exitPrice: number
  pnl: number
  pnlPercentage: number
  duration: number // in seconds
  technicalAtExit: {
    rsi: number
    macd: {
      macd: number
      signal: number
      histogram: number
    }
  }
  volumeChange: number // percentage
  sentimentShift: number // -1 to 1
  message: string
  suggestions: string[]
}

export class OTCSignalGenerator {
  private static logger = new Logger("OTCSignalGenerator", LOGGING_CONFIG)
  private static activeSignals: Map<string, OTCSignal> = new Map()
  private static scheduledTasks: Map<string, NodeJS.Timeout> = new Map()

  // Initialize the signal generator system
  static initialize(): void {
    this.logger.info("Initializing OTC Signal Generator system")

    // Set up the main signal generation loop
    this.setupSignalGenerationLoop()

    this.logger.info("OTC Signal Generator system initialized successfully")
  }

  // Set up the main signal generation loop
  private static setupSignalGenerationLoop(): void {
    this.logger.info("Setting up signal generation loop")

    // Function to check if it's time to generate signals
    const checkAndGenerateSignals = async () => {
      const now = new Date()
      const seconds = now.getSeconds()
      const milliseconds = now.getMilliseconds()

      // Calculate time until next signal generation
      let timeUntilNextRun = 0

      // If we're at the exact second for signal generation (with a small tolerance)
      if (Math.abs(seconds - SIGNAL_TIMING.sendSignalAtSecond) <= 1 && milliseconds < 200) {
        this.logger.info(`Signal generation time reached: ${now.toISOString()}`)

        try {
          // Generate signals for all pairs
          await this.generateSignalsForAllPairs()
        } catch (error) {
          this.logger.error("Error in signal generation loop:", error)
        }

        // Calculate time until next run (approximately 60 seconds)
        timeUntilNextRun = 60000 - (seconds * 1000 + milliseconds)
      } else {
        // Calculate time until next signal generation
        if (seconds < SIGNAL_TIMING.sendSignalAtSecond) {
          // Still need to wait within this minute
          timeUntilNextRun = (SIGNAL_TIMING.sendSignalAtSecond - seconds) * 1000 - milliseconds
        } else {
          // Need to wait until next minute
          timeUntilNextRun = (60 - seconds + SIGNAL_TIMING.sendSignalAtSecond) * 1000 - milliseconds
        }
      }

      // Ensure we don't schedule too frequently
      timeUntilNextRun = Math.max(timeUntilNextRun, 1000)

      this.logger.debug(`Next signal generation in ${timeUntilNextRun}ms`)

      // Schedule next check
      setTimeout(checkAndGenerateSignals, timeUntilNextRun)
    }

    // Start the loop
    checkAndGenerateSignals()
  }

  // Generate signals for all OTC pairs
  static async generateSignalsForAllPairs(): Promise<OTCSignal[]> {
    this.logger.info(`Starting signal generation for all ${OTC_CURRENCY_PAIRS.length} OTC pairs`)
    const startTime = Date.now()
    const signals: OTCSignal[] = []

    // Process all pairs in parallel
    const signalPromises = OTC_CURRENCY_PAIRS.map(async (pair) => {
      try {
        const signal = await this.generateSignalForPair(pair)
        if (signal) {
          signals.push(signal)
          this.logger.info(
            `Generated ${signal.direction} signal for ${pair} with strength ${signal.strength.toFixed(0)}`,
          )
        } else {
          this.logger.debug(`No signal generated for ${pair} (below threshold or conditions not met)`)
        }
      } catch (error) {
        this.logger.error(`Error generating signal for ${pair}:`, error)
      }
    })

    await Promise.all(signalPromises)

    const endTime = Date.now()
    this.logger.info(
      `Completed signal generation for all pairs in ${endTime - startTime}ms, found ${signals.length} signals`,
    )

    return signals
  }

  // Generate signal for a specific pair
  static async generateSignalForPair(pair: string): Promise<OTCSignal | null> {
    try {
      this.logger.debug(`Generating signal for ${pair}`)
      const startTime = Date.now()

      // Fetch all data for the pair
      const { marketData, technicalIndicators, sentimentData, volumeData, supportResistance, volatility } =
        await ApiService.fetchAllData(pair)

      if (marketData.length === 0) {
        this.logger.warn(`No market data available for ${pair}`)
        return null
      }

      // Current price
      const currentPrice = marketData[0].close

      // Determine signal direction based on technical indicators and sentiment
      const { direction, strength, reasons } = this.determineSignalDirection(
        technicalIndicators,
        sentimentData,
        volumeData,
        currentPrice,
        supportResistance,
        volatility,
      )

      // If signal strength is below minimum threshold, don't generate a signal
      if (strength < SIGNAL_STRENGTH.minimum) {
        this.logger.debug(
          `Signal strength ${strength.toFixed(0)} for ${pair} is below threshold ${SIGNAL_STRENGTH.minimum}`,
        )
        return null
      }

      // Determine asset strength description
      let assetStrength = "Neutral"
      if (volumeData.ratio > 1.5 && direction === "BUY") {
        assetStrength = "Strong bullish"
      } else if (volumeData.ratio > 1.5 && direction === "SELL") {
        assetStrength = "Strong bearish"
      } else if (volumeData.ratio > 1.2 && direction === "BUY") {
        assetStrength = "Moderately bullish"
      } else if (volumeData.ratio > 1.2 && direction === "SELL") {
        assetStrength = "Moderately bearish"
      } else if (volumeData.ratio < 0.8) {
        assetStrength = "Weak"
      }

      // Determine sentiment description
      let sentimentDescription = "Neutral pressure"
      if (sentimentData.score > 0.3) {
        sentimentDescription = "Strong upward pressure"
      } else if (sentimentData.score > 0.1) {
        sentimentDescription = "Moderate upward pressure"
      } else if (sentimentData.score < -0.3) {
        sentimentDescription = "Strong downward pressure"
      } else if (sentimentData.score < -0.1) {
        sentimentDescription = "Moderate downward pressure"
      }

      // Format volume metric
      const volumeMetric = `${volumeData.current.toLocaleString()} (${volumeData.ratio.toFixed(2)}x avg${volumeData.anomaly ? ", anomalous" : ""})`

      // Create signal object with precise timing
      const now = new Date()

      // Calculate exact entry time (30 seconds into the current or next minute)
      const entryTime = new Date(now)
      if (now.getSeconds() > SIGNAL_TIMING.entryAtSecond) {
        // If we're past the entry second in this minute, set for next minute
        entryTime.setMinutes(entryTime.getMinutes() + 1)
      }
      entryTime.setSeconds(SIGNAL_TIMING.entryAtSecond)
      entryTime.setMilliseconds(0)

      const signal: OTCSignal = {
        pair,
        direction,
        price: currentPrice,
        timestamp: now.toISOString(),
        entryTime: entryTime.toISOString(),
        strength,
        technicalIndicators,
        marketInfo: {
          volatility: {
            value: volatility.value,
            description: volatility.description,
            atr: volatility.atr,
          },
          assetStrength,
          volumeMetric,
          volumeData,
          sentiment: {
            score: sentimentData.score,
            description: sentimentDescription,
            keywords: sentimentData.keywords || [],
          },
        },
        levels: supportResistance,
        marketConditions: reasons.join("; "),
        reasons,
        message: this.formatSignalMessage({
          pair,
          direction,
          price: currentPrice,
          timestamp: now,
          entryTime,
          technicalIndicators,
          volatility: volatility.description,
          assetStrength,
          volumeMetric,
          sentiment: sentimentDescription,
          support: supportResistance.support,
          resistance: supportResistance.resistance,
          strength,
          marketConditions: reasons.join("; "),
        }),
      }

      // Store the active signal
      this.activeSignals.set(pair, signal)

      // Schedule trade result evaluation
      this.scheduleTradeResultEvaluation(pair, signal)

      const endTime = Date.now()
      this.logger.debug(`Signal generation for ${pair} completed in ${endTime - startTime}ms`)

      return signal
    } catch (error) {
      this.logger.error(`Error generating signal for ${pair}:`, error)
      return null
    }
  }

  // Schedule trade result evaluation
  private static scheduleTradeResultEvaluation(pair: string, signal: OTCSignal): void {
    // Clear any existing scheduled task for this pair
    if (this.scheduledTasks.has(pair)) {
      clearTimeout(this.scheduledTasks.get(pair)!)
    }

    // Calculate time until evaluation (5 minutes after entry)
    const entryTime = new Date(signal.entryTime)
    const evaluationTime = new Date(entryTime.getTime() + 5 * 60 * 1000) // 5 minutes after entry
    const now = new Date()
    const timeUntilEvaluation = evaluationTime.getTime() - now.getTime()

    this.logger.debug(`Scheduled trade result evaluation for ${pair} in ${timeUntilEvaluation}ms`)

    // Schedule the evaluation
    const task = setTimeout(async () => {
      try {
        await this.evaluateTradeResult(pair, signal)
      } catch (error) {
        this.logger.error(`Error evaluating trade result for ${pair}:`, error)
      }
    }, timeUntilEvaluation)

    this.scheduledTasks.set(pair, task)
  }

  // Evaluate trade result
  private static async evaluateTradeResult(pair: string, signal: OTCSignal): Promise<TradeResult | null> {
    try {
      this.logger.info(`Evaluating trade result for ${pair}`)

      // Fetch current market data
      const { marketData, technicalIndicators, sentimentData, volumeData } = await ApiService.fetchAllData(pair)

      if (marketData.length === 0) {
        this.logger.warn(`No market data available for ${pair} to evaluate trade result`)
        return null
      }

      // Get current price
      const currentPrice = marketData[0].close
      const entryPrice = signal.price

      // Calculate profit/loss
      let pnl = 0
      if (signal.direction === "BUY") {
        pnl = currentPrice - entryPrice
      } else {
        pnl = entryPrice - currentPrice
      }

      const pnlPercentage = (pnl / entryPrice) * 100

      // Determine result
      const result: "Win" | "Lose" = pnl > 0 ? "Win" : "Lose"

      // Calculate duration
      const entryTime = new Date(signal.entryTime)
      const exitTime = new Date()
      const duration = Math.round((exitTime.getTime() - entryTime.getTime()) / 1000) // in seconds

      // Calculate volume change
      const volumeChange =
        ((volumeData.current - signal.marketInfo.volumeData.current) / signal.marketInfo.volumeData.current) * 100

      // Calculate sentiment shift
      const sentimentShift = sentimentData.score - signal.marketInfo.sentiment.score

      // Determine reason for result
      let reason = ""
      const suggestions: string[] = []

      if (result === "Win") {
        if (signal.direction === "BUY" && technicalIndicators.rsi > signal.technicalIndicators.rsi) {
          reason = "RSI continued to strengthen, confirming bullish momentum"
        } else if (signal.direction === "SELL" && technicalIndicators.rsi < signal.technicalIndicators.rsi) {
          reason = "RSI continued to weaken, confirming bearish momentum"
        } else if (Math.abs(volumeChange) > 20) {
          reason = `Significant volume increase (${volumeChange.toFixed(1)}%) supported the ${signal.direction.toLowerCase()} signal`
        } else if (Math.abs(sentimentShift) > 0.2) {
          reason = `Market sentiment shifted strongly (${sentimentShift > 0 ? "positive" : "negative"} shift of ${Math.abs(sentimentShift).toFixed(2)})`
        } else {
          reason = `Technical analysis correctly identified ${signal.direction.toLowerCase()} opportunity`
        }

        suggestions.push("Continue using similar entry criteria for this pair")
        suggestions.push(
          `${signal.direction} signals with RSI at ${signal.technicalIndicators.rsi.toFixed(1)} are effective`,
        )
      } else {
        if (signal.direction === "BUY" && technicalIndicators.rsi < signal.technicalIndicators.rsi) {
          reason = "RSI reversed unexpectedly, momentum failed to continue"
          suggestions.push("Consider waiting for stronger RSI confirmation before BUY signals")
        } else if (signal.direction === "SELL" && technicalIndicators.rsi > signal.technicalIndicators.rsi) {
          reason = "RSI reversed unexpectedly, momentum failed to continue"
          suggestions.push("Consider waiting for stronger RSI confirmation before SELL signals")
        } else if (Math.abs(volumeChange) < -20) {
          reason = `Volume dropped significantly (${volumeChange.toFixed(1)}%), insufficient to sustain the move`
          suggestions.push("Add volume confirmation requirements to signal generation")
        } else if (Math.abs(sentimentShift) > 0.2) {
          reason = `Rapid sentiment shift (${sentimentShift > 0 ? "positive" : "negative"} shift of ${Math.abs(sentimentShift).toFixed(2)})`
          suggestions.push("Consider adding sentiment stability checks to signal criteria")
        } else {
          reason = `Market conditions changed rapidly after signal generation`
          suggestions.push("Consider shorter trade duration for this pair")
        }

        suggestions.push(
          `Avoid ${signal.direction} signals when volatility is ${signal.marketInfo.volatility.description.toLowerCase()}`,
        )
      }

      // Create trade result
      const tradeResult: TradeResult = {
        signal,
        result,
        reason,
        entryPrice,
        exitPrice: currentPrice,
        pnl,
        pnlPercentage,
        duration,
        technicalAtExit: {
          rsi: technicalIndicators.rsi,
          macd: technicalIndicators.macd,
        },
        volumeChange,
        sentimentShift,
        suggestions,
        message: this.formatTradeResultMessage({
          result,
          reason,
          entryPrice,
          exitPrice: currentPrice,
          rsiEntry: signal.technicalIndicators.rsi,
          rsiExit: technicalIndicators.rsi,
          volumeChange,
          sentimentShift,
          pnl,
          pnlPercentage,
          duration,
          volatility: signal.marketInfo.volatility.description,
          suggestions,
        }),
      }

      this.logger.info(`Trade result for ${pair}: ${result}, PnL: ${pnlPercentage.toFixed(2)}%`)

      // Remove from active signals
      this.activeSignals.delete(pair)

      return tradeResult
    } catch (error) {
      this.logger.error(`Error evaluating trade result for ${pair}:`, error)
      return null
    }
  }

  // Determine signal direction and strength with enhanced analysis
  private static determineSignalDirection(
    technicalIndicators: {
      rsi: number
      macd: { macd: number; signal: number; histogram: number }
      ema9: number
      ema21: number
      sma50: number
    },
    sentimentData: { score: number; volume: number; sources: string[]; keywords: string[] },
    volumeData: {
      current: number
      average: number
      ratio: number
      trend: "increasing" | "decreasing" | "stable"
      anomaly: boolean
      anomalyScore: number
    },
    currentPrice: number,
    supportResistance: { support: number; resistance: number },
    volatility: { value: number; description: string; atr: number },
  ): { direction: "BUY" | "SELL"; strength: number; reasons: string[] } {
    let buyScore = 0
    let sellScore = 0
    const reasons: string[] = []

    // RSI Analysis
    if (technicalIndicators.rsi < TECHNICAL_INDICATORS.rsi.oversold) {
      buyScore += 100 * TECHNICAL_INDICATORS.rsi.weight
      reasons.push(`RSI oversold (${technicalIndicators.rsi.toFixed(2)})`)
    } else if (technicalIndicators.rsi > TECHNICAL_INDICATORS.rsi.overbought) {
      sellScore += 100 * TECHNICAL_INDICATORS.rsi.weight
      reasons.push(`RSI overbought (${technicalIndicators.rsi.toFixed(2)})`)
    } else if (technicalIndicators.rsi < 40) {
      buyScore += 50 * TECHNICAL_INDICATORS.rsi.weight
      reasons.push(`RSI approaching oversold (${technicalIndicators.rsi.toFixed(2)})`)
    } else if (technicalIndicators.rsi > 60) {
      sellScore += 50 * TECHNICAL_INDICATORS.rsi.weight
      reasons.push(`RSI approaching overbought (${technicalIndicators.rsi.toFixed(2)})`)
    }

    // MACD Analysis
    if (
      technicalIndicators.macd.histogram > 0 &&
      technicalIndicators.macd.histogram > technicalIndicators.macd.signal
    ) {
      buyScore += 100 * TECHNICAL_INDICATORS.macd.weight
      reasons.push("MACD histogram positive and increasing")
    } else if (
      technicalIndicators.macd.histogram < 0 &&
      technicalIndicators.macd.histogram < technicalIndicators.macd.signal
    ) {
      sellScore += 100 * TECHNICAL_INDICATORS.macd.weight
      reasons.push("MACD histogram negative and decreasing")
    } else if (technicalIndicators.macd.histogram > 0) {
      buyScore += 50 * TECHNICAL_INDICATORS.macd.weight
      reasons.push("MACD histogram positive")
    } else if (technicalIndicators.macd.histogram < 0) {
      sellScore += 50 * TECHNICAL_INDICATORS.macd.weight
      reasons.push("MACD histogram negative")
    }

    // EMA Analysis
    if (technicalIndicators.ema9 > technicalIndicators.ema21) {
      buyScore += 100 * TECHNICAL_INDICATORS.ema.weight
      reasons.push("EMA9 above EMA21 (bullish)")
    } else if (technicalIndicators.ema9 < technicalIndicators.ema21) {
      sellScore += 100 * TECHNICAL_INDICATORS.ema.weight
      reasons.push("EMA9 below EMA21 (bearish)")
    }

    // SMA Analysis
    if (currentPrice > technicalIndicators.sma50) {
      buyScore += 100 * TECHNICAL_INDICATORS.sma.weight
      reasons.push("Price above SMA50 (bullish trend)")
    } else if (currentPrice < technicalIndicators.sma50) {
      sellScore += 100 * TECHNICAL_INDICATORS.sma.weight
      reasons.push("Price below SMA50 (bearish trend)")
    }

    // Volume Analysis with anomaly detection
    if (volumeData.ratio > 1.2 && volumeData.trend === "increasing") {
      // High volume can confirm both buy and sell signals
      if (buyScore > sellScore) {
        buyScore += 100 * TECHNICAL_INDICATORS.volume.weight
        reasons.push(`Increasing volume (${volumeData.ratio.toFixed(2)}x avg) confirms bullish momentum`)
      } else if (sellScore > buyScore) {
        sellScore += 100 * TECHNICAL_INDICATORS.volume.weight
        reasons.push(`Increasing volume (${volumeData.ratio.toFixed(2)}x avg) confirms bearish momentum`)
      }
    }

    // Volume anomaly analysis
    if (volumeData.anomaly) {
      if (buyScore > sellScore) {
        buyScore += 50 * TECHNICAL_INDICATORS.volume.weight * volumeData.anomalyScore
        reasons.push(
          `Anomalous volume spike (${volumeData.anomalyScore.toFixed(2)} score) suggests strong buying interest`,
        )
      } else if (sellScore > buyScore) {
        sellScore += 50 * TECHNICAL_INDICATORS.volume.weight * volumeData.anomalyScore
        reasons.push(
          `Anomalous volume spike (${volumeData.anomalyScore.toFixed(2)} score) suggests strong selling pressure`,
        )
      }
    }

    // Sentiment Analysis
    if (sentimentData.score > 0.1) {
      buyScore += 100 * TECHNICAL_INDICATORS.sentiment.weight
      reasons.push(`Positive market sentiment (${sentimentData.score.toFixed(2)})`)

      // Add keywords if available
      if (sentimentData.keywords && sentimentData.keywords.length > 0) {
        reasons.push(`Positive keywords: ${sentimentData.keywords.slice(0, 3).join(", ")}`)
      }
    } else if (sentimentData.score < -0.1) {
      sellScore += 100 * TECHNICAL_INDICATORS.sentiment.weight
      reasons.push(`Negative market sentiment (${sentimentData.score.toFixed(2)})`)

      // Add keywords if available
      if (sentimentData.keywords && sentimentData.keywords.length > 0) {
        reasons.push(`Negative keywords: ${sentimentData.keywords.slice(0, 3).join(", ")}`)
      }
    }

    // Support/Resistance Analysis
    const priceToSupportRatio = (currentPrice - supportResistance.support) / currentPrice
    const priceToResistanceRatio = (supportResistance.resistance - currentPrice) / currentPrice

    if (priceToSupportRatio < 0.002) {
      buyScore += 80 * TECHNICAL_INDICATORS.sma.weight
      reasons.push(`Price at support level (${supportResistance.support.toFixed(5)}, potential reversal)`)
    } else if (priceToResistanceRatio < 0.002) {
      sellScore += 80 * TECHNICAL_INDICATORS.sma.weight
      reasons.push(`Price at resistance level (${supportResistance.resistance.toFixed(5)}, potential reversal)`)
    }

    // Volatility analysis
    if (volatility.value > 1.5) {
      // High volatility can amplify signals
      buyScore *= 1 + (volatility.value - 1.5) * 0.1
      sellScore *= 1 + (volatility.value - 1.5) * 0.1
      reasons.push(`High volatility (${volatility.value.toFixed(2)}%) amplifies signal strength`)
    } else if (volatility.value < 0.5) {
      // Low volatility can reduce signal strength
      buyScore *= 0.9
      sellScore *= 0.9
      reasons.push(`Low volatility (${volatility.value.toFixed(2)}%) reduces signal reliability`)
    }

    // Determine final direction and strength
    const direction = buyScore > sellScore ? "BUY" : "SELL"
    const strength = Math.max(buyScore, sellScore)

    return { direction, strength, reasons }
  }

  // Format signal message
  private static formatSignalMessage(params: {
    pair: string
    direction: "BUY" | "SELL"
    price: number
    timestamp: Date
    entryTime: Date
    technicalIndicators: {
      rsi: number
      macd: { macd: number; signal: number; histogram: number }
      ema9: number
      ema21: number
      sma50: number
    }
    volatility: string
    assetStrength: string
    volumeMetric: string
    sentiment: string
    support: number
    resistance: number
    strength: number
    marketConditions: string
  }): string {
    const arrow = params.direction === "BUY" ? "▲" : "▼"

    // Format timestamps
    const signalTime = params.timestamp.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    })

    const entryTime = params.entryTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })

    // Replace placeholders in the message template
    const message = SIGNAL_MESSAGE_FORMAT.replace("{PAIR}", params.pair)
      .replace("{DIRECTION}", params.direction)
      .replace("{ARROW}", arrow)
      .replace("{VOLATILITY}", params.volatility)
      .replace("{ASSET_STRENGTH}", params.assetStrength)
      .replace("{VOLUME_METRIC}", params.volumeMetric)
      .replace("{SENTIMENT}", params.sentiment)
      .replace("{PRICE}", params.price.toFixed(5))
      .replace("{RESISTANCE}", params.resistance.toFixed(5))
      .replace("{SUPPORT}", params.support.toFixed(5))
      .replace("{RSI}", params.technicalIndicators.rsi.toFixed(2))
      .replace(
        "{MACD}",
        `${params.technicalIndicators.macd.macd.toFixed(5)} (H: ${params.technicalIndicators.macd.histogram.toFixed(
          5,
        )})`,
      )
      .replace("{EMA9}", params.technicalIndicators.ema9.toFixed(5))
      .replace("{EMA21}", params.technicalIndicators.ema21.toFixed(5))
      .replace("{SMA50}", params.technicalIndicators.sma50.toFixed(5))
      .replace("{STRENGTH}", params.strength.toFixed(0))
      .replace("{MARKET_CONDITIONS}", params.marketConditions)
      .replace("{SIGNAL_TIME}", signalTime + " UTC")
      .replace("{ENTRY_TIME}", entryTime + " UTC")

    return message
  }

  // Format trade result message
  private static formatTradeResultMessage(params: {
    result: "Win" | "Lose"
    reason: string
    entryPrice: number
    exitPrice: number
    rsiEntry: number
    rsiExit: number
    volumeChange: number
    sentimentShift: number
    pnl: number
    pnlPercentage: number
    duration: number
    volatility: string
    suggestions: string[]
  }): string {
    return TRADE_RESULT_FORMAT.replace("{RESULT}", params.result)
      .replace("{REASON}", params.reason)
      .replace("{ENTRY_PRICE}", params.entryPrice.toFixed(5))
      .replace("{EXIT_PRICE}", params.exitPrice.toFixed(5))
      .replace("{RSI_ENTRY}", params.rsiEntry.toFixed(2))
      .replace("{RSI_EXIT}", params.rsiExit.toFixed(2))
      .replace("{VOLUME_CHANGE}", params.volumeChange.toFixed(2))
      .replace("{SENTIMENT_SHIFT}", params.sentimentShift.toFixed(2))
      .replace("{PNL}", `${params.pnl > 0 ? "+" : ""}${params.pnl.toFixed(5)} (${params.pnlPercentage.toFixed(2)}%)`)
      .replace("{DURATION}", `${params.duration} seconds`)
      .replace("{VOLATILITY}", params.volatility)
      .replace("{SUGGESTIONS}", params.suggestions.map((s) => `• ${s}`).join("\n"))
  }

  // Get active signals
  static getActiveSignals(): OTCSignal[] {
    return Array.from(this.activeSignals.values())
  }

  // Get active signal for a specific pair
  static getActiveSignalForPair(pair: string): OTCSignal | null {
    return this.activeSignals.get(pair) || null
  }
}
