import { NextResponse } from "next/server"
import { generateSignal, generateMockMarketData } from "@/lib/signal-generator"
import { prepareModelInput, predictSignal } from "@/lib/ml-model"

// Generate a trading signal with AI enhancement
async function generateEnhancedSignal(marketData: any) {
  const { prices, symbol } = marketData
  const lastPrice = prices[prices.length - 1]

  // Generate traditional signal
  const traditionalSignal = generateSignal(marketData)

  // Prepare input for ML model
  const modelInput = prepareModelInput(
    lastPrice,
    traditionalSignal.indicators.rsi,
    traditionalSignal.indicators.macd,
    traditionalSignal.indicators.ema50,
    traditionalSignal.indicators.bollingerBands,
    traditionalSignal.indicators.volumeAnalysis,
    traditionalSignal.indicators.divergence,
    traditionalSignal.multiTimeframeConfirmation,
  )

  // Get ML model prediction
  const mlPrediction = predictSignal(modelInput)

  // Combine traditional and ML signals
  // If they agree, increase confidence
  // If they disagree, use the ML prediction but with lower confidence
  const finalSignal = { ...traditionalSignal }

  if (traditionalSignal.signal === mlPrediction.prediction) {
    finalSignal.confidence = Math.min(100, traditionalSignal.confidence + 10)
    finalSignal.reasons.push("AI model confirms signal with high confidence")
  } else if (mlPrediction.confidence > traditionalSignal.confidence + 20) {
    finalSignal.signal = mlPrediction.prediction
    finalSignal.confidence = mlPrediction.confidence - 10
    finalSignal.reasons = [
      "AI model override: stronger signal detected",
      ...traditionalSignal.reasons.filter((r) => !r.includes("confirmed")),
    ]
  }

  // Add price for reference
  finalSignal.price = lastPrice

  return finalSignal
}

// Get mock market data for multiple symbols
function getMockMarketData() {
  const symbols = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"]
  return symbols.map((symbol) => generateMockMarketData(symbol))
}

export async function GET() {
  try {
    // In a real implementation, you would fetch actual market data from an API
    const marketData = getMockMarketData()

    // Generate enhanced signals for each market
    const signalPromises = marketData.map((data) => generateEnhancedSignal(data))
    const signals = await Promise.all(signalPromises)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      signals,
    })
  } catch (error) {
    console.error("Error generating signals:", error)
    return NextResponse.json({ success: false, error: "Failed to generate signals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbol, timeframe, market } = body

    if (!symbol) {
      return NextResponse.json({ success: false, error: "Symbol is required" }, { status: 400 })
    }

    // Generate mock market data for the requested symbol
    const mockData = generateMockMarketData(symbol, market || "OTC", timeframe || "M1")

    // Generate enhanced signal
    const signal = await generateEnhancedSignal(mockData)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      signal,
    })
  } catch (error) {
    console.error("Error generating signal:", error)
    return NextResponse.json({ success: false, error: "Failed to generate signal" }, { status: 500 })
  }
}
