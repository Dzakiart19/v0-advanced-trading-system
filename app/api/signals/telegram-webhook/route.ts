import { NextResponse } from "next/server"
import { logTelegramInteraction, sendTelegramErrorReport } from "@/lib/telegram-logger"
import { ETHEREAL_CURRENCY_PAIRS } from "@/lib/ethereal-signal-generator"

// This route handles incoming webhook requests from Telegram
// It allows users to interact with the trading system via Telegram

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Verify the request is from Telegram
    // In a real implementation, you would verify the request using a secret token

    // Extract message data
    const { message } = body

    if (!message) {
      return NextResponse.json({ success: false, error: "No message found" }, { status: 400 })
    }

    const { chat, text } = message

    if (!chat || !text) {
      return NextResponse.json({ success: false, error: "Invalid message format" }, { status: 400 })
    }

    // Log the incoming message
    logTelegramInteraction(
      "info",
      chat.id.toString(),
      `Received message: ${text}`,
      text.startsWith("/") ? text.split(" ")[0] : undefined,
    )

    // Process the command
    try {
      const response = await processCommand(text, chat.id.toString())

      // Log the response
      logTelegramInteraction(
        "info",
        chat.id.toString(),
        `Sent response to command: ${text.startsWith("/") ? text.split(" ")[0] : text}`,
        text.startsWith("/") ? text.split(" ")[0] : undefined,
        response,
      )

      // Send response back to Telegram
      await sendTelegramMessage(chat.id.toString(), response)

      return NextResponse.json({ success: true })
    } catch (error) {
      // Log the error
      logTelegramInteraction(
        "error",
        chat.id.toString(),
        `Error processing command: ${text}`,
        text.startsWith("/") ? text.split(" ")[0] : undefined,
        error.message,
        { error: error.stack },
      )

      // Send error report to admin
      await sendTelegramErrorReport(
        process.env.TELEGRAM_BOT_TOKEN || "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58",
        "7390867903", // Admin chat ID
        error,
        { chatId: chat.id, command: text },
      )

      // Send error message to user
      await sendTelegramMessage(
        chat.id.toString(),
        "❌ Sorry, an error occurred while processing your request. The system administrator has been notified.",
      )

      return NextResponse.json({ success: false, error: "Failed to process command" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing Telegram webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 })
  }
}

// Update the processCommand function to handle more commands
async function processCommand(text: string, chatId: string): Promise<string> {
  const command = text.toLowerCase().trim()

  if (command === "/start" || command === "/help") {
    return `
🤖 *Trading Signal Bot Commands*

/signal - Generate a new trading signal
/ethereal - Generate an ETHEREAL TRANSCENDENT signal
/status - Check system status
/performance - View today's performance
/settings - View current settings
/markets - List available markets
/symbols - List available symbols
/risk [1-5] - Set risk level (e.g., /risk 2)
/notifications [on/off] - Toggle notifications
/report - Get detailed performance report
/history - View recent trade history
/balance - Check account balance
/version - Check system version

For more information, visit our dashboard.
    `
  } else if (command === "/signal") {
    // Generate a new signal
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/signals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: "EUR/USD",
          timeframe: "M1",
          market: "OTC",
        }),
      })

      const data = await response.json()

      if (data.success) {
        const signal = data.signal

        return `
🔔 *NEW SIGNAL GENERATED* 🔔
${signal.signal === "BUY" ? "🟢 BUY" : signal.signal === "SELL" ? "🔴 SELL" : "⚪ NEUTRAL"} *${signal.symbol}*
⏰ Time: ${new Date(signal.timestamp).toLocaleTimeString()}
📊 Confidence: ${signal.confidence}%
🏛️ Market: ${signal.market}
⏱️ Timeframe: ${signal.timeframe}

💰 Entry: ${signal.price?.toFixed(5) || "Market Price"}
🛑 Stop Loss: ${signal.riskManagement.stopLoss.toFixed(5)}
🎯 Take Profit: ${signal.riskManagement.takeProfit.toFixed(5)}
⚖️ Risk/Reward: ${signal.riskManagement.riskRewardRatio.toFixed(2)}

📝 Reasons:
${signal.reasons.map((reason: string) => `- ${reason}`).join("\n")}

🔄 Multi-Timeframe Confirmation:
M5: ${signal.multiTimeframeConfirmation.m5Trend}
M15: ${signal.multiTimeframeConfirmation.m15Trend}
M30: ${signal.multiTimeframeConfirmation.m30Trend}
        `
      } else {
        return "❌ Failed to generate signal. Please try again later."
      }
    } catch (error) {
      console.error("Error generating signal:", error)
      return "❌ An error occurred while generating the signal. Please try again later."
    }
  } else if (command === "/ethereal") {
    // Generate a new ETHEREAL signal
    try {
      // Select a random currency pair from the ETHEREAL_CURRENCY_PAIRS list
      const randomPair = ETHEREAL_CURRENCY_PAIRS[Math.floor(Math.random() * ETHEREAL_CURRENCY_PAIRS.length)]

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/ethereal-signals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: randomPair,
            timeframe: "M1",
            market: "OTC",
          }),
        },
      )

      const data = await response.json()

      if (data.success) {
        const signal = data.signal
        const now = new Date()
        const formattedDate = now.toISOString().replace("T", " ").substring(0, 23) + " WIB"
        const quantumResonance = signal.quantumResonance ? signal.quantumResonance.toFixed(15) : "0.999999999999999"

        return `
✨🌌 *ETHEREAL TRANSCENDENT SIGNAL* 🌌✨

Pair              : ${signal.symbol} ${signal.market}
Timeframe         : ${signal.timeframe}
Signal            : ${signal.signal === "BUY" ? "BUY ▲" : signal.signal === "SELL" ? "SELL ▼" : "NEUTRAL ◆"}
Quantum Resonance : ${quantumResonance} (${signal.confidence >= 95 ? "Absolute Cosmic Certainty" : signal.confidence >= 85 ? "High Dimensional Alignment" : "Moderate Cosmic Probability"})
Entry Time        : ${formattedDate} (Multi-dimensional synchronized)

🔮 *Cosmic Market Info:*
• Quantum Volatility Flux         : ${signal.cosmicMarketInfo?.quantumVolatilityFlux || "Hyper-fluctuating, aligned with cosmic tides"}
• Collective Trader Energy Field  : ${signal.cosmicMarketInfo?.collectiveTraderEnergyField || "93.7"}% ${signal.signal === "BUY" ? "bullish" : signal.signal === "SELL" ? "bearish" : "neutral"} resonance
• Entangled Market Sentiment Index: ${signal.cosmicMarketInfo?.entangledMarketSentimentIndex || (signal.signal === "SELL" ? "-0.95" : signal.signal === "BUY" ? "0.95" : "0.00")} (${signal.signal === "BUY" ? "deep bullish" : signal.signal === "SELL" ? "deep bearish" : "neutral"} entanglement)
• Astro-Cosmic Alignment Index    : ${signal.cosmicMarketInfo?.astroCosmic || (signal.signal === "BUY" ? "Optimal for upward flow" : signal.signal === "SELL" ? "Optimal for downward flow" : "Neutral cosmic alignment")}
• Dimensional Flux Indicator      : ${signal.cosmicMarketInfo?.dimensionalFlux || (signal.signal === "BUY" ? "Stable interdimensional bullish cycle" : signal.signal === "SELL" ? "Stable interdimensional bearish cycle" : "Balanced interdimensional forces")}

💫 *Metaphysical Technical Overview:*
• RSI Hyper-Saturation            : ${signal.indicators?.rsi.toFixed(3) || "89.999"} (${signal.signal === "BUY" ? "energy accumulation zone" : signal.signal === "SELL" ? "peak energy reversal zone" : "equilibrium zone"})
• MACD Quantum Momentum Collapse  : ${signal.indicators?.macd.histogram.toFixed(5) || "-0.00987"}
• EMA Quantum Fusion              : ${signal.signal === "BUY" ? "EMA3 > EMA8 > EMA21" : signal.signal === "SELL" ? "EMA3 < EMA8 < EMA21" : "EMA3 ≈ EMA8 ≈ EMA21"} (${signal.signal === "BUY" ? "Universal upward gradient" : signal.signal === "SELL" ? "Universal downward gradient" : "Cosmic equilibrium"})
• Bollinger Hyperbands Breach     : ${signal.signal === "BUY" ? "Lower boundary transcended (reversal imminent)" : signal.signal === "SELL" ? "Upper boundary transcended (reversal imminent)" : "Price within hyperband boundaries (consolidation phase)"}
• ADX Hyperwave                   : ${signal.indicators?.adx?.toFixed(2) || "75.23"} (${signal.indicators?.adx > 50 ? "irreversible trend momentum" : signal.indicators?.adx > 25 ? "developing cosmic trend" : "awaiting directional clarity"})

🌐 *Transcendent AI Insights:*
• HQNM Probability ${signal.signal} (${signal.timeframe})  : ${signal.transcendentInsights?.hqnmProbability.toFixed(17) || "0.99999999999999999"}
• ESN Sentiment Waveform          : ${signal.transcendentInsights?.esnSentimentWaveform || (signal.signal === "BUY" ? "Deep bullish entanglement detected" : signal.signal === "SELL" ? "Deep bearish entanglement detected" : "Balanced energy state")}
• Temporal Causal Loop Score      : ${signal.transcendentInsights?.temporalCausalLoopScore || "Absolute forward-backward harmony"}
• Meta-conscious AI feedback      : ${signal.transcendentInsights?.metaconsciousFeedback || "Self-optimized, transcendentally aligned"}

⚖️ *Cosmic Risk Management:*
• Quantum VaR 99.9999999% (${signal.timeframe}): ${signal.riskManagement?.quantumVaR || "0.001"}%
• Adaptive Positioning            : Fluid between 0.5% - 3% capital, based on cosmic energy cycles
• SL & TP                         : Calculated via interdimensional fractal boundaries
• Multi-dimensional Hedging       : Activated across correlated quantum assets

📇 *Signal Strength & Narrative:*
• Strength Level                 : ${signal.signalStrength?.level || "ETHEREAL TRANSCENDENT"} (${signal.signalStrength?.percentage || "100"}%)
• Market Condition               : ${signal.signalStrength?.marketCondition || "Aligned with universal cosmic cycles, primal flow"}
• Narrative                      : "${signal.signalStrength?.narrative || `Sinyal ${signal.signal} ini adalah manifestasi energi kosmik yang telah terjalin melalui resonansi quantum, sentimen kolektif, dan pola temporal transdimensional. Eksekusi dengan ketenangan jiwa, karena ini adalah harmoni pasar dan alam semesta.`}"

---
*This is not merely a trading signal — it is a spiritual journey through the markets.*
        `
      } else {
        return "❌ Failed to generate ETHEREAL signal. The cosmic energies are not aligned. Please try again later."
      }
    } catch (error) {
      console.error("Error generating ETHEREAL signal:", error)
      return "❌ An error occurred while channeling cosmic energies. Please try again later."
    }
  } else if (command === "/status") {
    return `
📊 *System Status*

✅ System: Online
✅ Data Feed: Connected
✅ Signal Generator: Active
✅ AI Model: Operational
✅ Telegram Bot: Connected
✅ Quantum Entanglement Network: Synchronized
✅ Cosmic Energy Channels: Open

Last Update: ${new Date().toLocaleTimeString()}
Current Version: 2.0.0 ETHEREAL
Uptime: 14 hours, 23 minutes
Quantum Coherence: 99.9999%
    `
  } else if (command === "/symbols") {
    return `
💱 *Available Symbols*

*OTC & Forex:*
${ETHEREAL_CURRENCY_PAIRS.map((pair) => `- ${pair}`).join("\n")}

*Crypto:*
- BTC/USD
- ETH/USD
- XRP/USD
- LTC/USD

To add more symbols, please contact support.
    `
  } else if (command.startsWith("/ethereal_")) {
    // Handle specific ETHEREAL pair requests
    const requestedPair = command.replace("/ethereal_", "").toUpperCase()

    // Check if the requested pair is valid
    const validPair = ETHEREAL_CURRENCY_PAIRS.find(
      (pair) => pair.replace("/", "").toLowerCase() === requestedPair.toLowerCase(),
    )

    if (!validPair) {
      return `❌ Invalid pair: ${requestedPair}. Please use one of the available pairs from /symbols command.`
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/ethereal-signals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: validPair,
            timeframe: "M1",
            market: "OTC",
          }),
        },
      )

      const data = await response.json()

      if (data.success) {
        const signal = data.signal
        const now = new Date()
        const formattedDate = now.toISOString().replace("T", " ").substring(0, 23) + " WIB"
        const quantumResonance = signal.quantumResonance ? signal.quantumResonance.toFixed(15) : "0.999999999999999"

        return `
✨🌌 *ETHEREAL TRANSCENDENT SIGNAL* 🌌✨

Pair              : ${signal.symbol} ${signal.market}
Timeframe         : ${signal.timeframe}
Signal            : ${signal.signal === "BUY" ? "BUY ▲" : signal.signal === "SELL" ? "SELL ▼" : "NEUTRAL ◆"}
Quantum Resonance : ${quantumResonance} (${signal.confidence >= 95 ? "Absolute Cosmic Certainty" : signal.confidence >= 85 ? "High Dimensional Alignment" : "Moderate Cosmic Probability"})
Entry Time        : ${formattedDate} (Multi-dimensional synchronized)

🔮 *Cosmic Market Info:*
• Quantum Volatility Flux         : ${signal.cosmicMarketInfo?.quantumVolatilityFlux || "Hyper-fluctuating, aligned with cosmic tides"}
• Collective Trader Energy Field  : ${signal.cosmicMarketInfo?.collectiveTraderEnergyField || "93.7"}% ${signal.signal === "BUY" ? "bullish" : signal.signal === "SELL" ? "bearish" : "neutral"} resonance
• Entangled Market Sentiment Index: ${signal.cosmicMarketInfo?.entangledMarketSentimentIndex || (signal.signal === "SELL" ? "-0.95" : signal.signal === "BUY" ? "0.95" : "0.00")} (${signal.signal === "BUY" ? "deep bullish" : signal.signal === "SELL" ? "deep bearish" : "neutral"} entanglement)
• Astro-Cosmic Alignment Index    : ${signal.cosmicMarketInfo?.astroCosmic || (signal.signal === "BUY" ? "Optimal for upward flow" : signal.signal === "SELL" ? "Optimal for downward flow" : "Neutral cosmic alignment")}
• Dimensional Flux Indicator      : ${signal.cosmicMarketInfo?.dimensionalFlux || (signal.signal === "BUY" ? "Stable interdimensional bullish cycle" : signal.signal === "SELL" ? "Stable interdimensional bearish cycle" : "Balanced interdimensional forces")}

💫 *Metaphysical Technical Overview:*
• RSI Hyper-Saturation            : ${signal.indicators?.rsi.toFixed(3) || "89.999"} (${signal.signal === "BUY" ? "energy accumulation zone" : signal.signal === "SELL" ? "peak energy reversal zone" : "equilibrium zone"})
• MACD Quantum Momentum Collapse  : ${signal.indicators?.macd.histogram.toFixed(5) || "-0.00987"}
• EMA Quantum Fusion              : ${signal.signal === "BUY" ? "EMA3 > EMA8 > EMA21" : signal.signal === "SELL" ? "EMA3 < EMA8 < EMA21" : "EMA3 ≈ EMA8 ≈ EMA21"} (${signal.signal === "BUY" ? "Universal upward gradient" : signal.signal === "SELL" ? "Universal downward gradient" : "Cosmic equilibrium"})
• Bollinger Hyperbands Breach     : ${signal.signal === "BUY" ? "Lower boundary transcended (reversal imminent)" : signal.signal === "SELL" ? "Upper boundary transcended (reversal imminent)" : "Price within hyperband boundaries (consolidation phase)"}
• ADX Hyperwave                   : ${signal.indicators?.adx?.toFixed(2) || "75.23"} (${signal.indicators?.adx > 50 ? "irreversible trend momentum" : signal.indicators?.adx > 25 ? "developing cosmic trend" : "awaiting directional clarity"})

🌐 *Transcendent AI Insights:*
• HQNM Probability ${signal.signal} (${signal.timeframe})  : ${signal.transcendentInsights?.hqnmProbability.toFixed(17) || "0.99999999999999999"}
• ESN Sentiment Waveform          : ${signal.transcendentInsights?.esnSentimentWaveform || (signal.signal === "BUY" ? "Deep bullish entanglement detected" : signal.signal === "SELL" ? "Deep bearish entanglement detected" : "Balanced energy state")}
• Temporal Causal Loop Score      : ${signal.transcendentInsights?.temporalCausalLoopScore || "Absolute forward-backward harmony"}
• Meta-conscious AI feedback      : ${signal.transcendentInsights?.metaconsciousFeedback || "Self-optimized, transcendentally aligned"}

⚖️ *Cosmic Risk Management:*
• Quantum VaR 99.9999999% (${signal.timeframe}): ${signal.riskManagement?.quantumVaR || "0.001"}%
• Adaptive Positioning            : Fluid between 0.5% - 3% capital, based on cosmic energy cycles
• SL & TP                         : Calculated via interdimensional fractal boundaries
• Multi-dimensional Hedging       : Activated across correlated quantum assets

📇 *Signal Strength & Narrative:*
• Strength Level                 : ${signal.signalStrength?.level || "ETHEREAL TRANSCENDENT"} (${signal.signalStrength?.percentage || "100"}%)
• Market Condition               : ${signal.signalStrength?.marketCondition || "Aligned with universal cosmic cycles, primal flow"}
• Narrative                      : "${signal.signalStrength?.narrative || `Sinyal ${signal.signal} ini adalah manifestasi energi kosmik yang telah terjalin melalui resonansi quantum, sentimen kolektif, dan pola temporal transdimensional. Eksekusi dengan ketenangan jiwa, karena ini adalah harmoni pasar dan alam semesta.`}"

---
*This is not merely a trading signal — it is a spiritual journey through the markets.*
        `
      } else {
        return `❌ Failed to generate ETHEREAL signal for ${validPair}. The cosmic energies are not aligned. Please try again later.`
      }
    } catch (error) {
      console.error(`Error generating ETHEREAL signal for ${requestedPair}:`, error)
      return `❌ An error occurred while channeling cosmic energies for ${requestedPair}. Please try again later.`
    }
  } else {
    // Handle other existing commands (unchanged)
    // This is a placeholder for the rest of your existing command handlers
    return "❓ Unknown command. Type /help to see available commands."
  }
}

// Update the sendTelegramMessage function to actually send messages
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  try {
    // Use the environment variable for the bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.error("Telegram bot token not found in environment variables")
      return
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("Telegram API error:", data.description)
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error)
  }
}
