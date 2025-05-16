// Enhanced configuration for OTC Auto Signal System

// List of OTC currency pairs to analyze
export const OTC_CURRENCY_PAIRS = [
  "EUR/USD OTC",
  "GBP/USD OTC",
  "USD/JPY OTC",
  "AUD/USD OTC",
  "USD/CAD OTC",
  "USD/CHF OTC",
  "NZD/USD OTC",
  "EUR/GBP OTC",
  "EUR/JPY OTC",
  "GBP/JPY OTC",
  "EUR/CHF OTC",
  "GBP/AUD OTC",
  "AUD/JPY OTC",
  "NZD/JPY OTC",
  "USD/MXN OTC",
  "USD/SGD OTC",
  "EUR/NZD OTC",
  "GBP/NZD OTC",
  "AUD/CAD OTC",
  "CAD/JPY OTC",
]

// API Configuration with rate limits and retry strategies
export const API_CONFIG = {
  alphaVantage: {
    baseUrl: "https://www.alphavantage.co/query",
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
    endpoints: {
      intraday: "TIME_SERIES_INTRADAY",
      rsi: "RSI",
      macd: "MACD",
      ema: "EMA",
      sma: "SMA",
    },
    rateLimit: 5, // Requests per minute
    retryDelay: 15000, // 15 seconds between retries
    maxRetries: 3,
  },
  twelveData: {
    baseUrl: "https://api.twelvedata.com",
    apiKey: process.env.TWELVE_DATA_API_KEY || "",
    endpoints: {
      timeSeries: "time_series",
      realTime: "quote",
      volume: "volume",
    },
    rateLimit: 8, // Requests per minute
    retryDelay: 10000, // 10 seconds between retries
    maxRetries: 3,
  },
  yahooFinance: {
    // For integration with yFinance Python via API proxy
    baseUrl: "/api/yahoo-finance",
    endpoints: {
      historical: "historical",
      sentiment: "sentiment",
    },
    retryDelay: 5000, // 5 seconds between retries
    maxRetries: 3,
  },
}

// Technical indicator configuration with weights for signal calculation
export const TECHNICAL_INDICATORS = {
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
    weight: 0.25, // Weight in signal calculation
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    weight: 0.2,
  },
  ema: {
    periods: [9, 21],
    weight: 0.15,
  },
  sma: {
    period: 50,
    weight: 0.1,
  },
  volume: {
    period: 20, // For average volume comparison
    weight: 0.2,
  },
  sentiment: {
    weight: 0.1,
  },
}

// Precise signal timing configuration
export const SIGNAL_TIMING = {
  // Send signal at exactly 29 minutes and 30 seconds of each minute
  sendSignalAtSecond: 30,
  sendSignalAtMinute: 29,
  // Entry time at exactly 30 seconds of each minute
  entryAtSecond: 30,
  entryAtMinute: 0,
  // Preparation time in milliseconds before sending signal
  preparationTime: 2000, // 2 seconds before signal time to prepare data
  // Maximum allowed delay in milliseconds
  maxAllowedDelay: 1000, // 1 second maximum delay tolerance
}

// Signal strength thresholds
export const SIGNAL_STRENGTH = {
  minimum: 70, // Minimum score to send a signal (0-100)
  strong: 85, // Threshold for strong signals
  veryStrong: 95, // Threshold for very strong signals
}

// Cache configuration for low latency
export const CACHE_CONFIG = {
  ttl: 60, // Time to live in seconds
  maxSize: 1000, // Maximum number of items in cache
  priorityKeys: ["market_data", "technical_indicators"], // Keys to prioritize in cache
}

// Signal message format
export const SIGNAL_MESSAGE_FORMAT = `
{PAIR} OTC | 1 minutes | {DIRECTION} {ARROW}

📡 Market info:
• Volatility: {VOLATILITY}
• Asset strength by volume: {ASSET_STRENGTH}
• Volume result: {VOLUME_METRIC}
• Sentiment: {SENTIMENT}

💵 Technical overview:
• Current price: {PRICE} OTC
• Resistance (R1): {RESISTANCE}
• Support (S1): {SUPPORT}
• RSI: {RSI}
• MACD: {MACD}
• Moving Average: EMA9={EMA9}, EMA21={EMA21}, SMA50={SMA50}

📇 Signal strength:
• Strength: {STRENGTH}/100
• Market conditions: {MARKET_CONDITIONS}

🕒 Signal sent at: {SIGNAL_TIME} UTC for entry at {ENTRY_TIME} UTC
`

// Post-trade report format
export const TRADE_RESULT_FORMAT = `
Result: {RESULT}
Reason: {REASON}

Technical Analysis:
• Entry Price: {ENTRY_PRICE}
• Exit Price: {EXIT_PRICE}
• RSI at Entry: {RSI_ENTRY}
• RSI at Exit: {RSI_EXIT}
• Volume Change: {VOLUME_CHANGE}%
• Sentiment Shift: {SENTIMENT_SHIFT}

Performance Metrics:
• Profit/Loss: {PNL}
• Duration: {DURATION}
• Market Volatility: {VOLATILITY}

Improvement Suggestions:
{SUGGESTIONS}
`

// Logging configuration
export const LOGGING_CONFIG = {
  enabled: true,
  level: "info", // debug, info, warn, error
  logToFile: true,
  logFilePath: "./logs/otc-signals.log",
  logToConsole: true,
  includeTimestamp: true,
}
