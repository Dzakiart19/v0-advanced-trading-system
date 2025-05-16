export interface CurrencyPair {
  symbol: string
  name: string
  apiSymbol: {
    alphaVantage: string
    twelveData: string
    yahooFinance: string
  }
}

export const CURRENCY_PAIRS: CurrencyPair[] = [
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    apiSymbol: {
      alphaVantage: "EURUSD",
      twelveData: "EUR/USD",
      yahooFinance: "EURUSD=X",
    },
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    apiSymbol: {
      alphaVantage: "GBPUSD",
      twelveData: "GBP/USD",
      yahooFinance: "GBPUSD=X",
    },
  },
  {
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    apiSymbol: {
      alphaVantage: "USDJPY",
      twelveData: "USD/JPY",
      yahooFinance: "USDJPY=X",
    },
  },
  {
    symbol: "AUDUSD",
    name: "Australian Dollar / US Dollar",
    apiSymbol: {
      alphaVantage: "AUDUSD",
      twelveData: "AUD/USD",
      yahooFinance: "AUDUSD=X",
    },
  },
  {
    symbol: "USDCAD",
    name: "US Dollar / Canadian Dollar",
    apiSymbol: {
      alphaVantage: "USDCAD",
      twelveData: "USD/CAD",
      yahooFinance: "USDCAD=X",
    },
  },
  {
    symbol: "USDCHF",
    name: "US Dollar / Swiss Franc",
    apiSymbol: {
      alphaVantage: "USDCHF",
      twelveData: "USD/CHF",
      yahooFinance: "USDCHF=X",
    },
  },
  {
    symbol: "NZDUSD",
    name: "New Zealand Dollar / US Dollar",
    apiSymbol: {
      alphaVantage: "NZDUSD",
      twelveData: "NZD/USD",
      yahooFinance: "NZDUSD=X",
    },
  },
  {
    symbol: "EURJPY",
    name: "Euro / Japanese Yen",
    apiSymbol: {
      alphaVantage: "EURJPY",
      twelveData: "EUR/JPY",
      yahooFinance: "EURJPY=X",
    },
  },
  {
    symbol: "GBPJPY",
    name: "British Pound / Japanese Yen",
    apiSymbol: {
      alphaVantage: "GBPJPY",
      twelveData: "GBP/JPY",
      yahooFinance: "GBPJPY=X",
    },
  },
  {
    symbol: "EURGBP",
    name: "Euro / British Pound",
    apiSymbol: {
      alphaVantage: "EURGBP",
      twelveData: "EUR/GBP",
      yahooFinance: "EURGBP=X",
    },
  },
  {
    symbol: "AUDJPY",
    name: "Australian Dollar / Japanese Yen",
    apiSymbol: {
      alphaVantage: "AUDJPY",
      twelveData: "AUD/JPY",
      yahooFinance: "AUDJPY=X",
    },
  },
  {
    symbol: "CADJPY",
    name: "Canadian Dollar / Japanese Yen",
    apiSymbol: {
      alphaVantage: "CADJPY",
      twelveData: "CAD/JPY",
      yahooFinance: "CADJPY=X",
    },
  },
  {
    symbol: "CHFJPY",
    name: "Swiss Franc / Japanese Yen",
    apiSymbol: {
      alphaVantage: "CHFJPY",
      twelveData: "CHF/JPY",
      yahooFinance: "CHFJPY=X",
    },
  },
  {
    symbol: "EURAUD",
    name: "Euro / Australian Dollar",
    apiSymbol: {
      alphaVantage: "EURAUD",
      twelveData: "EUR/AUD",
      yahooFinance: "EURAUD=X",
    },
  },
  {
    symbol: "EURCAD",
    name: "Euro / Canadian Dollar",
    apiSymbol: {
      alphaVantage: "EURCAD",
      twelveData: "EUR/CAD",
      yahooFinance: "EURCAD=X",
    },
  },
  {
    symbol: "EURCHF",
    name: "Euro / Swiss Franc",
    apiSymbol: {
      alphaVantage: "EURCHF",
      twelveData: "EUR/CHF",
      yahooFinance: "EURCHF=X",
    },
  },
  {
    symbol: "GBPAUD",
    name: "British Pound / Australian Dollar",
    apiSymbol: {
      alphaVantage: "GBPAUD",
      twelveData: "GBP/AUD",
      yahooFinance: "GBPAUD=X",
    },
  },
  {
    symbol: "GBPCAD",
    name: "British Pound / Canadian Dollar",
    apiSymbol: {
      alphaVantage: "GBPCAD",
      twelveData: "GBP/CAD",
      yahooFinance: "GBPCAD=X",
    },
  },
  {
    symbol: "GBPCHF",
    name: "British Pound / Swiss Franc",
    apiSymbol: {
      alphaVantage: "GBPCHF",
      twelveData: "GBP/CHF",
      yahooFinance: "GBPCHF=X",
    },
  },
  {
    symbol: "AUDCAD",
    name: "Australian Dollar / Canadian Dollar",
    apiSymbol: {
      alphaVantage: "AUDCAD",
      twelveData: "AUD/CAD",
      yahooFinance: "AUDCAD=X",
    },
  },
]

export const TIMEFRAME = "1min"
export const SIGNAL_GENERATION_SECOND = 30 // 30-second mark
export const SIGNAL_ENTRY_SECOND = 0 // 00-second mark (start of next minute)
export const SIGNAL_GENERATION_MILLISECOND = 0 // 30:00 mark (0ms)

export const API_KEYS = {
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY || "",
  TWELVE_DATA: process.env.TWELVE_DATA_API_KEY || "",
}

export const API_ENDPOINTS = {
  ALPHA_VANTAGE: "https://www.alphavantage.co/query",
  TWELVE_DATA: "https://api.twelvedata.com",
  YAHOO_FINANCE_PROXY: "/api/yahoo-finance",
}

export const CACHE_TTL = {
  HISTORICAL_DATA: 60 * 1000, // 1 minute
  TECHNICAL_INDICATORS: 30 * 1000, // 30 seconds
  SENTIMENT_DATA: 5 * 60 * 1000, // 5 minutes
}

export const INDICATOR_SETTINGS = {
  RSI: {
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  MACD: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  },
  EMA: {
    shortPeriod: 9,
    mediumPeriod: 21,
    longPeriod: 50,
  },
  BOLLINGER_BANDS: {
    period: 20,
    stdDev: 2,
  },
  ATR: {
    period: 14,
  },
}

export const SIGNAL_THRESHOLDS = {
  MINIMUM_STRENGTH: 70, // Minimum signal strength to generate a signal (0-100)
  MINIMUM_VOLUME: 1.5, // Minimum volume ratio compared to average
  MINIMUM_VOLATILITY: 0.8, // Minimum volatility ratio compared to average
}

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

export const CURRENT_LOG_LEVEL = LOG_LEVELS.INFO
