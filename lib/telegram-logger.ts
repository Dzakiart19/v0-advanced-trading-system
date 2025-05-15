// Types for Telegram logging
export type TelegramLogLevel = "info" | "warning" | "error" | "debug"

export type TelegramLogEntry = {
  timestamp: string
  level: TelegramLogLevel
  chatId: string
  message: string
  command?: string
  response?: string
  metadata?: Record<string, any>
}

// In-memory log storage (in a real app, this would be a database)
const telegramLogs: TelegramLogEntry[] = []

// Function to log Telegram interactions
export function logTelegramInteraction(
  level: TelegramLogLevel,
  chatId: string,
  message: string,
  command?: string,
  response?: string,
  metadata?: Record<string, any>,
): void {
  const logEntry: TelegramLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    chatId,
    message,
    command,
    response,
    metadata,
  }

  // Add to in-memory logs
  telegramLogs.push(logEntry)

  // In a real implementation, you would also write to a database or file
  console.log(`[TELEGRAM ${level.toUpperCase()}] ${message}`, logEntry)

  // Limit the size of in-memory logs
  if (telegramLogs.length > 1000) {
    telegramLogs.shift() // Remove oldest log
  }
}

// Function to get recent logs
export function getRecentTelegramLogs(limit = 100): TelegramLogEntry[] {
  return telegramLogs.slice(-limit)
}

// Function to get logs for a specific chat ID
export function getTelegramLogsForChat(chatId: string, limit = 100): TelegramLogEntry[] {
  return telegramLogs.filter((log) => log.chatId === chatId).slice(-limit)
}

// Function to clear logs
export function clearTelegramLogs(): void {
  telegramLogs.length = 0
}

// Function to send error report to admin
export async function sendTelegramErrorReport(
  botToken: string,
  adminChatId: string,
  error: Error,
  context?: Record<string, any>,
): Promise<void> {
  try {
    const errorMessage = `
🚨 *ERROR REPORT* 🚨

*Error:* ${error.message}
*Stack:* ${error.stack?.slice(0, 500) || "No stack trace"}
${context ? `*Context:* ${JSON.stringify(context, null, 2)}` : ""}

*Timestamp:* ${new Date().toISOString()}
    `

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: errorMessage,
        parse_mode: "Markdown",
      }),
    })
  } catch (sendError) {
    console.error("Failed to send error report to Telegram admin:", sendError)
  }
}
