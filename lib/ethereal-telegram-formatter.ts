// Types for the ETHEREAL signal
export interface EtherealSignal {
  pair: string
  timeframe: string
  direction: "BUY" | "SELL"
  timestamp: Date
  confidence: number

  // Cosmic market info
  quantumVolatility: string
  traderEnergyField: number
  marketSentiment: number
  astroAlignment: string
  dimensionalFlux: string

  // Technical indicators
  rsi: number
  macd: number
  emaStatus: string
  bollingerStatus: string
  adx: number

  // AI insights
  probabilityScore: number
  sentimentWaveform: string
  causalLoopScore: string
  metaConsciousFeedback: string

  // Risk management
  quantumVaR: number
  adaptivePositioning: string
  stopLoss?: number
  takeProfit?: number
  hedgingStatus: string

  // Signal metadata
  strengthLevel: "NORMAL" | "STRONG" | "VERY STRONG" | "ETHEREAL" | "TRANSCENDENT"
  marketCondition: string
}

/**
 * Formats an ETHEREAL signal for Telegram
 * Ensures the message is properly formatted for Telegram without HTML tags
 */
export function formatEtherealTelegramMessage(signal: EtherealSignal): string {
  const directionEmoji = signal.direction === "BUY" ? "▲" : "▼"
  const directionColor = signal.direction === "BUY" ? "🟢" : "🔴"
  const directionText = signal.direction === "BUY" ? "buy" : "sell"

  // Format the timestamp with Indonesian timezone (WIB)
  // Using standard date formatting without fractionalSecondDigits to avoid the error
  const formattedTime = signal.timestamp.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Add milliseconds manually (up to 3 digits which is the maximum supported)
  const milliseconds = signal.timestamp.getMilliseconds().toString().padStart(3, "0")
  const timeWithMilliseconds = `${formattedTime}.${milliseconds}`

  // Calculate the quantum resonance with 15 decimal places
  const quantumResonance = signal.confidence.toFixed(15)

  // New format as requested with ETHEREAL elements
  return `${signal.pair} | ${signal.timeframe} | ${directionText}

📡 Market info:
• Volatility: ${signal.quantumVolatility}
• Asset strength by volume: ${signal.traderEnergyField.toFixed(1)}% ${signal.direction.toLowerCase()} resonance
• Volume result: Quantum entangled
• Sentiment: ${signal.marketSentiment > 0 ? "Upward" : "Downward"} pressure

💵 Technical overview:
• Current price: Quantum flux
• Resistance (R1): Dimensional barrier
• Support (S1): Cosmic foundation
• RSI: ${signal.rsi.toFixed(2)}
• MACD: ${signal.macd.toFixed(5)}
• Moving Average: ${signal.emaStatus}

📇 Signal strength:
• Strength: ${getStrengthPercentage(signal.strengthLevel)}
• Market conditions: ${signal.marketCondition}

⌛ Time: ${timeWithMilliseconds} WIB

✨ ETHEREAL TRANSCENDENT SIGNAL ✨
`
}

/**
 * Maps strength level to percentage
 */
function getStrengthPercentage(level: string): string {
  switch (level) {
    case "NORMAL":
      return "80%"
    case "STRONG":
      return "90%"
    case "VERY STRONG":
      return "95%"
    case "ETHEREAL":
      return "99%"
    case "TRANSCENDENT":
      return "100%"
    default:
      return "85%"
  }
}
