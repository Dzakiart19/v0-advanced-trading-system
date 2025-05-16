import { NextResponse } from "next/server"
import { Logger } from "@/lib/logger"
import { LOGGING_CONFIG } from "@/lib/otc-auto-signal-config"

const logger = new Logger("YahooFinanceSentiment", LOGGING_CONFIG)

// Mock data for Yahoo Finance sentiment data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  logger.info(`Received request for sentiment data: symbol=${symbol}`)

  if (!symbol) {
    logger.warn("Missing required parameter: symbol")
    return NextResponse.json({ success: false, error: "Symbol is required" }, { status: 400 })
  }

  try {
    // In a real implementation, this would call a sentiment analysis service
    // For now, we'll return mock data
    const mockSentiment = generateMockSentimentData(symbol)

    logger.info(`Generated mock sentiment data for ${symbol}: score=${mockSentiment.score}`)

    return NextResponse.json({
      success: true,
      symbol,
      ...mockSentiment,
    })
  } catch (error) {
    logger.error("Error fetching sentiment data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch sentiment data" }, { status: 500 })
  }
}

// Generate mock sentiment data with realistic patterns
function generateMockSentimentData(symbol: string) {
  // Generate a sentiment score between -1 and 1
  // Use the symbol to seed the random generator for consistency
  const symbolSeed = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const baseRandom = Math.sin(symbolSeed) * 0.5 + 0.5 // Between 0 and 1
  const score = (baseRandom * 2 - 1) * 0.7 // Between -0.7 and 0.7

  // Generate a random volume of data points
  const volume = Math.floor(baseRandom * 500) + 100

  // Generate keywords based on sentiment
  const keywords = generateKeywords(score, symbol)

  // Mock sources
  const sources = ["Twitter", "News Articles", "Financial Forums", "Analyst Reports", "Reddit", "StockTwits"]

  // Select a random subset of sources
  const selectedSources = sources.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2)

  return {
    score,
    volume,
    sources: selectedSources,
    keywords,
    lastUpdated: new Date().toISOString(),
  }
}

// Generate realistic keywords based on sentiment score
function generateKeywords(score: number, symbol: string): string[] {
  const positiveKeywords = [
    "bullish",
    "uptrend",
    "buy signal",
    "strong support",
    "breakout",
    "oversold",
    "undervalued",
    "growth",
    "earnings beat",
    "upgrade",
  ]

  const negativeKeywords = [
    "bearish",
    "downtrend",
    "sell signal",
    "resistance",
    "breakdown",
    "overbought",
    "overvalued",
    "decline",
    "earnings miss",
    "downgrade",
  ]

  const neutralKeywords = [
    "consolidation",
    "sideways",
    "range-bound",
    "neutral",
    "hold",
    "fair value",
    "stable",
    "unchanged",
    "mixed signals",
    "wait and see",
  ]

  let keywordPool: string[]

  if (score > 0.2) {
    // Positive sentiment
    keywordPool = [...positiveKeywords, symbol.split("/")[0], "technical buy"]
  } else if (score < -0.2) {
    // Negative sentiment
    keywordPool = [...negativeKeywords, symbol.split("/")[1], "technical sell"]
  } else {
    // Neutral sentiment
    keywordPool = [...neutralKeywords, symbol, "market watch"]
  }

  // Select 3-5 random keywords
  const count = Math.floor(Math.random() * 3) + 3
  return keywordPool.sort(() => 0.5 - Math.random()).slice(0, count)
}
