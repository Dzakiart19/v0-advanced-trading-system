import { type NextRequest, NextResponse } from "next/server"
import { initializeSignalGenerator, getActiveSignals, getCompletedTrades } from "@/lib/m1-otc-signal-generator"
import { logger } from "@/lib/logger"

// Flag to track if the signal generator has been initialized
let isInitialized = false

// Initialize the signal generator
async function ensureInitialized() {
  if (!isInitialized) {
    // Define the function to send messages to Telegram
    const sendTelegramMessage = async (message: string) => {
      try {
        const response = await fetch("/api/telegram/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send Telegram message: ${response.statusText}`)
        }
      } catch (error) {
        console.error("Error sending Telegram message:", error)
      }
    }

    // Initialize the signal generator
    initializeSignalGenerator(sendTelegramMessage)
    isInitialized = true
    logger.info("M1 OTC Signal Generator initialized via API")
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure the signal generator is initialized
    await ensureInitialized()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "active"

    // Return the requested data
    if (type === "active") {
      return NextResponse.json({ signals: getActiveSignals() })
    } else if (type === "completed") {
      return NextResponse.json({ trades: getCompletedTrades() })
    } else {
      return NextResponse.json({
        active: getActiveSignals(),
        completed: getCompletedTrades(),
      })
    }
  } catch (error) {
    logger.error("Error in M1 OTC signals API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure the signal generator is initialized
    await ensureInitialized()

    // This endpoint doesn't actually need to do anything for POST requests
    // as the signal generator runs automatically based on time

    return NextResponse.json({
      success: true,
      message: "Signal generator is running automatically based on time",
    })
  } catch (error) {
    logger.error("Error in M1 OTC signals API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
