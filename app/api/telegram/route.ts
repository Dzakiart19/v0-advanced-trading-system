import { NextResponse } from "next/server"

// This is a mock implementation of a Telegram bot API
// In a real implementation, you would use the Telegram Bot API to send messages

// Update the POST function to accept botToken
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, chatId, botToken } = body

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    if (!chatId) {
      return NextResponse.json({ success: false, error: "Chat ID is required" }, { status: 400 })
    }

    if (!botToken) {
      return NextResponse.json({ success: false, error: "Bot token is required" }, { status: 400 })
    }

    // In a real implementation, you would send the message to Telegram
    try {
      // Actually send the message to Telegram
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      })

      const telegramData = await telegramResponse.json()

      if (!telegramData.ok) {
        console.error("Telegram API error:", telegramData.description)
        return NextResponse.json(
          {
            success: false,
            error: `Telegram error: ${telegramData.description}`,
          },
          { status: 400 },
        )
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: "Message sent successfully",
        details: {
          chatId,
          messageLength: message.length,
          messageId: telegramData.result.message_id,
        },
      })
    } catch (error) {
      console.error("Error sending Telegram message:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send Telegram message. Please check your internet connection.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    return NextResponse.json({ success: false, error: "Failed to send Telegram message" }, { status: 500 })
  }
}
