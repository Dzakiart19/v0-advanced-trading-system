import telegramConnectionManager from "./telegram-connection-manager"

/**
 * Initialize Telegram connection
 * This function should be called when the app starts
 */
export function initTelegramConnection() {
  // Initialize the Telegram connection manager
  telegramConnectionManager.initialize()

  // Return the manager for potential cleanup
  return telegramConnectionManager
}
