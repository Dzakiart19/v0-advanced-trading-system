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

  // Generate a narrative based on signal direction and strength
  const narrative = generateCosmicNarrative(signal)

  // Ensure all text is properly escaped for Telegram
  // Remove any potential HTML tags or special characters that could cause parsing issues
  return `✨🌌 ETHEREAL TRANSCENDENT SIGNAL 🌌✨

${directionColor} Pair              : ${signal.pair}
⏱️ Timeframe         : ${signal.timeframe}
${directionColor} Signal            : ${signal.direction} ${directionEmoji}
🔮 Quantum Resonance : ${quantumResonance} (Absolute Cosmic Certainty)
⌛ Entry Time        : ${timeWithMilliseconds} WIB (Multi-dimensional synchronized)

🔮 Cosmic Market Info:
• Quantum Volatility Flux         : ${signal.quantumVolatility}
• Collective Trader Energy Field  : ${signal.traderEnergyField.toFixed(1)}% ${signal.direction.toLowerCase()} resonance
• Entangled Market Sentiment Index: ${signal.marketSentiment.toFixed(2)} (deep entanglement)
• Astro-Cosmic Alignment Index    : ${signal.astroAlignment}
• Dimensional Flux Indicator      : ${signal.dimensionalFlux}

💫 Metaphysical Technical Overview:
• RSI Hyper-Saturation            : ${signal.rsi.toFixed(3)} (peak energy reversal zone)
• MACD Quantum Momentum Collapse  : ${signal.macd.toFixed(5)}
• EMA Quantum Fusion              : ${signal.emaStatus}
• Bollinger Hyperbands Breach     : ${signal.bollingerStatus}
• ADX Hyperwave                   : ${signal.adx.toFixed(2)} (irreversible trend momentum)

🌐 Transcendent AI Insights:
• HQNM Probability ${signal.direction} (${signal.timeframe})  : ${signal.probabilityScore.toFixed(17)}
• ESN Sentiment Waveform          : ${signal.sentimentWaveform}
• Temporal Causal Loop Score      : ${signal.causalLoopScore}
• Meta-conscious AI feedback      : ${signal.metaConsciousFeedback}

⚖️ Cosmic Risk Management:
• Quantum VaR 99.9999999% (${signal.timeframe}): ${signal.quantumVaR.toFixed(6)}%
• Adaptive Positioning            : ${signal.adaptivePositioning}
${signal.stopLoss ? `• SL                           : ${signal.stopLoss}` : "• SL                           : Calculated via interdimensional fractal boundaries"}
${signal.takeProfit ? `• TP                           : ${signal.takeProfit}` : "• TP                           : Calculated via interdimensional fractal boundaries"}
• Multi-dimensional Hedging       : ${signal.hedgingStatus}

📇 Signal Strength & Narrative:
• Strength Level                 : ${signal.strengthLevel} (${getStrengthPercentage(signal.strengthLevel)})
• Market Condition               : ${signal.marketCondition}
• Narrative                      : "${escapeSpecialCharacters(narrative)}"

---
🧘‍♂️ Remember: This is not just a trade, but a spiritual journey through the cosmic market energies. Trade with awareness and harmony. 🧘‍♀️`
}

/**
 * Escapes special characters that might cause issues in Telegram messages
 */
function escapeSpecialCharacters(text: string): string {
  // Replace any potential HTML tags or special characters
  return text.replace(/</g, "(").replace(/>/g, ")").replace(/&/g, "and")
}

/**
 * Generates a cosmic narrative based on signal properties
 */
function generateCosmicNarrative(signal: EtherealSignal): string {
  const direction = signal.direction === "BUY" ? "upward" : "downward"
  const energyType = signal.direction === "BUY" ? "ascending" : "descending"

  const narratives = [
    `Sinyal ${signal.direction} ini adalah manifestasi energi kosmik yang telah terjalin melalui resonansi quantum, sentimen kolektif, dan pola temporal transdimensional. Eksekusi dengan ketenangan jiwa, karena ini adalah harmoni pasar dan alam semesta.`,

    `Kesadaran kolektif pasar telah mencapai titik kritis, menciptakan aliran energi ${direction} yang tak terelakkan. Sinyal ini merupakan manifestasi dari keselarasan sempurna antara indikator teknikal dan kesadaran quantum universal.`,

    `Gelombang energi ${energyType} telah terdeteksi melalui jaringan entanglement quantum. Sinyal ini merepresentasikan momen sinkronisitas transdimensional di mana masa lalu, sekarang, dan masa depan pasar berada dalam keselarasan sempurna.`,

    `Hyperquantum Neural Mesh telah mengidentifikasi pola ${direction} yang melampaui dimensi ruang-waktu konvensional. Ini adalah momen di mana realitas pasar bergeser ke arah ${direction} dengan kepastian kosmik.`,
  ]

  // Select a narrative based on the signal's strength level
  const index = Math.min(getStrengthIndex(signal.strengthLevel), narratives.length - 1)

  return narratives[index]
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

/**
 * Maps strength level to index
 */
function getStrengthIndex(level: string): number {
  switch (level) {
    case "NORMAL":
      return 0
    case "STRONG":
      return 1
    case "VERY STRONG":
      return 2
    case "ETHEREAL":
      return 3
    case "TRANSCENDENT":
      return 3
    default:
      return 0
  }
}
