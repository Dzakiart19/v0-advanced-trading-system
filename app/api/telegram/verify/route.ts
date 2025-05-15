import { NextResponse } from "next/server"

// This route verifies Telegram bot token and chat ID
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { botToken, chatId } = body

    if (!botToken) {
      return NextResponse.json({ success: false, error: "Bot token is required" }, { status: 400 })
    }

    if (!chatId) {
      return NextResponse.json({ success: false, error: "Chat ID is required" }, { status: 400 })
    }

    // Verify the bot token by making a request to the Telegram API
    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const telegramData = await telegramResponse.json()

      if (!telegramData.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid bot token. Please check your credentials.",
          },
          { status: 400 },
        )
      }

      // Store the bot token and chat ID in environment variables or a secure database
      // For this example, we'll just return success
      // In a production environment, you would store these securely

      return NextResponse.json({
        success: true,
        botInfo: {
          id: telegramData.result.id,
          username: telegramData.result.username,
          firstName: telegramData.result.first_name,
        },
      })
    } catch (error) {
      console.error("Error verifying Telegram bot:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify bot token. Please check your internet connection.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 })
  }
}
