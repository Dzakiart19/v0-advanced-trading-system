/**
 * Telegram Connection Manager
 *
 * This utility handles automatic connection and reconnection to Telegram
 * It ensures the connection is always maintained without manual intervention
 */

// Connection check interval in milliseconds (default: 60 seconds)
const CONNECTION_CHECK_INTERVAL = 60000

// Maximum number of consecutive failures before alerting (default: 5)
const MAX_FAILURES_BEFORE_ALERT = 5

class TelegramConnectionManager {
  private botToken: string
  private chatId: string
  private checkInterval: NodeJS.Timeout | null = null
  private consecutiveFailures = 0
  private isInitialized = false

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken
    this.chatId = chatId
  }

  /**
   * Initialize the connection manager
   */
  public initialize(): void {
    if (this.isInitialized) return

    this.isInitialized = true
    this.verifyConnection()

    // Set up periodic connection verification
    this.checkInterval = setInterval(() => {
      this.verifyConnection()
    }, CONNECTION_CHECK_INTERVAL)

    // Send initialization message
    this.sendMessage(
      "🔄 *Telegram Connection Manager Initialized*\n\n" +
        "Your trading system will maintain a continuous connection to Telegram.\n" +
        "Connection status will be monitored automatically.",
    )

    console.log("[Telegram] Connection manager initialized")
  }

  /**
   * Stop the connection manager
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isInitialized = false
    console.log("[Telegram] Connection manager stopped")
  }

  /**
   * Verify the connection to Telegram
   */
  private async verifyConnection(): Promise<void> {
    try {
      const response = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botToken: this.botToken,
          chatId: this.chatId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (this.consecutiveFailures > 0) {
          console.log("[Telegram] Connection restored after failures")
          this.sendMessage("✅ *Telegram Connection Restored*\n\nThe connection to Telegram has been restored.")
        }
        this.consecutiveFailures = 0
      } else {
        this.handleConnectionFailure(`Verification failed: ${data.error}`)
      }
    } catch (error) {
      this.handleConnectionFailure(`Connection error: ${error}`)
    }
  }

  /**
   * Handle connection failures
   */
  private handleConnectionFailure(errorMessage: string): void {
    this.consecutiveFailures++
    console.error(`[Telegram] Connection failure (${this.consecutiveFailures}): ${errorMessage}`)

    // Alert after multiple consecutive failures
    if (this.consecutiveFailures === MAX_FAILURES_BEFORE_ALERT) {
      console.error(`[Telegram] Multiple connection failures detected`)
      // We would normally send an alert through another channel here
    }

    // Attempt immediate reconnection after first failure
    if (this.consecutiveFailures === 1) {
      setTimeout(() => {
        this.verifyConnection()
      }, 5000) // Try again after 5 seconds
    }
  }

  /**
   * Send a message to Telegram
   */
  private async sendMessage(message: string): Promise<void> {
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          chatId: this.chatId,
          botToken: this.botToken,
        }),
      })
    } catch (error) {
      console.error("[Telegram] Failed to send message:", error)
    }
  }
}

// Create and export a singleton instance
const telegramConnectionManager = new TelegramConnectionManager(
  "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58",
  "7390867903",
)

export default telegramConnectionManager
