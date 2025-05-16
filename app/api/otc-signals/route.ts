import { NextResponse } from "next/server"
import { OTCSignalGenerator } from "@/lib/otc-signal-generator"
import { getTelegramService } from "@/lib/telegram-service"
import { Logger } from "@/lib/logger"
import { LOGGING_CONFIG } from "@/lib/otc-auto-signal-config"

const logger = new Logger("OTCSignalsAPI", LOGGING_CONFIG)

// Initialize the signal generator on server start
OTCSignalGenerator.initialize()

// Generate signals for all OTC pairs
export async function GET(request: Request) {
  try {
    logger.info("Received request to get all OTC signals")
    const startTime = Date.now()

    // Get active signals
    const activeSignals = OTCSignalGenerator.getActiveSignals()

    // If no active signals, generate new ones
    let signals = activeSignals
    if (activeSignals.length === 0) {
      logger.info("No active signals found, generating new signals")
      signals = await OTCSignalGenerator.generateSignalsForAllPairs()
    }

    const endTime = Date.now()
    logger.info(`Completed OTC signals request in ${endTime - startTime}ms, returning ${signals.length} signals`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: signals.length,
      signals,
    })
  } catch (error) {
    logger.error("Error generating OTC signals:", error)
    return NextResponse.json({ success: false, error: "Failed to generate OTC signals" }, { status: 500 })
  }
}

// Generate signal for a specific pair
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pair, sendToTelegram = true } = body

    logger.info(`Received request to generate signal for ${pair}`)

    if (!pair) {
      logger.warn("Missing required parameter: pair")
      return NextResponse.json({ success: false, error: "Pair is required" }, { status: 400 })
    }

    // Check if there's an active signal for this pair
    let signal = OTCSignalGenerator.getActiveSignalForPair(pair)

    // If no active signal, generate a new one
    if (!signal) {
      logger.info(`No active signal found for ${pair}, generating new signal`)
      signal = await OTCSignalGenerator.generateSignalForPair(pair)
    }

    if (!signal) {
      logger.warn(`No valid signal generated for ${pair}`)
      return NextResponse.json(
        { success: false, error: "No valid signal generated for the specified pair" },
        { status: 404 },
      )
    }

    // Send to Telegram if requested
    if (sendToTelegram) {
      logger.info(`Sending signal for ${pair} to Telegram`)
      const telegramService = getTelegramService()
      if (telegramService) {
        await telegramService.sendMessage(signal.message)
        logger.info(`Signal for ${pair} sent to Telegram successfully`)
      } else {
        logger.warn("Telegram service not available")
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      signal,
    })
  } catch (error) {
    logger.error("Error generating OTC signal:", error)
    return NextResponse.json({ success: false, error: "Failed to generate OTC signal" }, { status: 500 })
  }
}
