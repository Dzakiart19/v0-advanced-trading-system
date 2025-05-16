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

import { LOGGING_CONFIG } from "./otc-auto-signal-config"

export class Logger {
  private name: string
  private config: any
  private telegramSendFn: ((message: string) => Promise<void>) | null = null

  constructor(name: string, config: any = LOGGING_CONFIG) {
    this.name = name
    this.config = config
  }

  enableTelegramLogging(telegramSendFn: (message: string) => Promise<void>): void {
    this.telegramSendFn = telegramSendFn
  }

  debug(message: string, data?: any): void {
    if (this.config.level === "debug") {
      this.log("DEBUG", message, data)
    }
  }

  info(message: string, data?: any): void {
    if (this.config.level === "debug" || this.config.level === "info") {
      this.log("INFO", message, data)
    }
  }

  warn(message: string, data?: any): void {
    if (this.config.level === "debug" || this.config.level === "info" || this.config.level === "warn") {
      this.log("WARN", message, data)
    }
  }

  error(message: string, data?: any): void {
    this.log("ERROR", message, data)
  }

  private async log(level: string, message: string, data?: any): Promise<void> {
    const timestamp = new Date().toISOString()
    const formattedMessage = `[${timestamp}] [${level}] [${this.name}] ${message}`

    if (this.config.logToConsole) {
      switch (level) {
        case "DEBUG":
          console.debug(formattedMessage)
          if (data) console.debug(data)
          break
        case "INFO":
          console.info(formattedMessage)
          if (data) console.info(data)
          break
        case "WARN":
          console.warn(formattedMessage)
          if (data) console.warn(data)
          break
        case "ERROR":
          console.error(formattedMessage)
          if (data) console.error(data)
          break
      }
    }

    // In a real implementation, we would also log to file if config.logToFile is true

    // Send to Telegram if enabled
    if (this.telegramSendFn && level === "ERROR") {
      try {
        await this.telegramSendFn(`[${level}] ${this.name}: ${message}`)
      } catch (error) {
        console.error("Failed to send log to Telegram:", error)
      }
    }
  }
}

// Create a default logger instance for general application logging
export const logger = new Logger("app")
