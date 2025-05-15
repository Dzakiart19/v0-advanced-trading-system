import { type NextRequest, NextResponse } from "next/server"
import { generateEtherealSignal, ETHEREAL_CURRENCY_PAIRS, ETHEREAL_TIMEFRAMES } from "@/lib/ethereal-signal-generator"
import { getTelegramService, initTelegramService } from "@/lib/telegram-service"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { pair, timeframe, sendToTelegram = false } = data

    console.log("Received request for ETHEREAL signal:", { pair, timeframe, sendToTelegram })

    // Validate inputs
    if (!pair || !timeframe) {
      console.error("Missing required parameters:", { pair, timeframe })
      return NextResponse.json({ success: false, error: "Pair and timeframe are required" }, { status: 400 })
    }

    // Normalize the pair to match our supported pairs
    const normalizedPair = pair.includes("OTC") ? pair : `${pair} OTC`

    // Check if the pair is supported
    const isPairSupported = ETHEREAL_CURRENCY_PAIRS.some(
      (p) => p.toLowerCase() === normalizedPair.toLowerCase() || p.toLowerCase() === pair.toLowerCase(),
    )

    if (!isPairSupported) {
      console.error("Invalid currency pair:", pair)
      return NextResponse.json({ success: false, error: "Invalid currency pair" }, { status: 400 })
    }

    // Normalize the timeframe for validation
    const normalizedTimeframe = normalizeTimeframe(timeframe)

    // Check if the timeframe is supported
    const isTimeframeSupported = ETHEREAL_TIMEFRAMES.some(
      (t) => t.toLowerCase() === normalizedTimeframe.toLowerCase() || t.toLowerCase() === timeframe.toLowerCase(),
    )

    if (!isTimeframeSupported) {
      console.error("Invalid timeframe:", timeframe)
      return NextResponse.json({ success: false, error: `Invalid timeframe: ${timeframe}` }, { status: 400 })
    }

    // Generate the ETHEREAL signal
    console.log("Generating ETHEREAL signal for:", { normalizedPair, normalizedTimeframe })
    const signal = generateEtherealSignal(normalizedPair, normalizedTimeframe)

    // Send to Telegram if requested
    if (sendToTelegram) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID || ""
      const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/signals/telegram-webhook`

      if (!botToken) {
        return NextResponse.json({ success: false, error: "Telegram bot token not configured" }, { status: 500 })
      }

      const telegramService = getTelegramService() || initTelegramService(botToken, chatId, webhookUrl)

      const sent = await telegramService.sendEtherealSignal(signal)

      if (!sent) {
        return NextResponse.json({ success: false, error: "Failed to send signal to Telegram" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      signal,
    })
  } catch (error) {
    console.error("Error generating ETHEREAL signal:", error)
    return NextResponse.json({ success: false, error: "Failed to generate ETHEREAL signal" }, { status: 500 })
  }
}

export async function GET() {
  // Return the list of supported pairs and timeframes
  return NextResponse.json({
    pairs: ETHEREAL_CURRENCY_PAIRS,
    timeframes: ETHEREAL_TIMEFRAMES,
  })
}

/**
 * Helper function to normalize timeframe format
 * Converts any timeframe format to a standardized format (e.g., "M1", "m1", "1m" all become "1m")
 */
function normalizeTimeframe(timeframe: string): string {
  // Convert to lowercase for easier handling
  const tf = timeframe.toLowerCase()

  // Handle formats like "m1", "m5", etc.
  if (tf.startsWith("m") && /^\d+$/.test(tf.substring(1))) {
    const number = tf.substring(1)
    return `${number}m`
  }

  // Handle formats like "h1", "h4", etc.
  if (tf.startsWith("h") && /^\d+$/.test(tf.substring(1))) {
    const number = tf.substring(1)
    return `${number}h`
  }

  // Handle formats like "1m", "5m", etc.
  if (/^\d+[mh]$/.test(tf)) {
    return tf
  }

  // Default fallback - return as is
  return timeframe
}
