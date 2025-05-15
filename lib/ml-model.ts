// This is a simplified ML model for demonstration purposes
// In a real implementation, you would use a more sophisticated model

type ModelInput = {
  rsi: number
  macdHistogram: number
  priceToEma: number
  priceToBollingerUpper: number
  priceToBollingerLower: number
  volumeStrength: number
  priceVolumeCorrelation: number
  bullishDivergence: boolean
  bearishDivergence: boolean
  m5Trend: "bullish" | "bearish" | "neutral"
  m15Trend: "bullish" | "bearish" | "neutral"
  m30Trend: "bullish" | "bearish" | "neutral"
}

type ModelOutput = {
  prediction: "BUY" | "SELL" | "NEUTRAL"
  probability: number
  confidence: number
}

// Convert categorical features to numerical
function encodeFeature(value: "bullish" | "bearish" | "neutral"): number {
  if (value === "bullish") return 1
  if (value === "bearish") return -1
  return 0
}

// Normalize a value to 0-1 range
function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min)
}

// Simple ML model that combines features with weights
export function predictSignal(input: ModelInput): ModelOutput {
  // Normalize inputs
  const normalizedRsi = normalize(input.rsi, 0, 100)
  const normalizedMacd = normalize(input.macdHistogram, -0.01, 0.01) // Assuming typical MACD range
  const normalizedPriceToEma = normalize(input.priceToEma, 0.95, 1.05) // 5% range
  const normalizedPriceToBollingerUpper = normalize(input.priceToBollingerUpper, 0.95, 1.05)
  const normalizedPriceToBollingerLower = normalize(input.priceToBollingerLower, 0.95, 1.05)

  // Feature weights (these would be learned in a real ML model)
  const weights = {
    rsi: 0.15,
    macd: 0.15,
    priceToEma: 0.1,
    priceToBollingerUpper: 0.1,
    priceToBollingerLower: 0.1,
    volumeStrength: 0.05,
    priceVolumeCorrelation: 0.05,
    bullishDivergence: 0.1,
    bearishDivergence: 0.1,
    m5Trend: 0.05,
    m15Trend: 0.05,
    m30Trend: 0.1,
  }

  // Calculate buy signal score
  let buyScore = 0

  // RSI (lower values increase buy score)
  buyScore += weights.rsi * (1 - normalizedRsi)

  // MACD (positive values increase buy score)
  buyScore += weights.macd * (normalizedMacd > 0.5 ? normalizedMacd : 0)

  // Price to EMA (price above EMA increases buy score)
  buyScore += weights.priceToEma * (normalizedPriceToEma > 0.5 ? normalizedPriceToEma : 0)

  // Price to Bollinger Bands (price below lower band increases buy score)
  buyScore += weights.priceToBollingerLower * (1 - normalizedPriceToBollingerLower)

  // Volume strength
  buyScore += (weights.volumeStrength * input.volumeStrength) / 100

  // Price-volume correlation (positive correlation increases buy score)
  buyScore += weights.priceVolumeCorrelation * (input.priceVolumeCorrelation > 0 ? input.priceVolumeCorrelation : 0)

  // Divergence
  buyScore += weights.bullishDivergence * (input.bullishDivergence ? 1 : 0)

  // Multi-timeframe trends
  buyScore += weights.m5Trend * (encodeFeature(input.m5Trend) > 0 ? 1 : 0)
  buyScore += weights.m15Trend * (encodeFeature(input.m15Trend) > 0 ? 1 : 0)
  buyScore += weights.m30Trend * (encodeFeature(input.m30Trend) > 0 ? 1 : 0)

  // Calculate sell signal score
  let sellScore = 0

  // RSI (higher values increase sell score)
  sellScore += weights.rsi * normalizedRsi

  // MACD (negative values increase sell score)
  sellScore += weights.macd * (normalizedMacd < 0.5 ? 1 - normalizedMacd : 0)

  // Price to EMA (price below EMA increases sell score)
  sellScore += weights.priceToEma * (normalizedPriceToEma < 0.5 ? 1 - normalizedPriceToEma : 0)

  // Price to Bollinger Bands (price above upper band increases sell score)
  sellScore += weights.priceToBollingerUpper * normalizedPriceToBollingerUpper

  // Volume strength
  sellScore += (weights.volumeStrength * input.volumeStrength) / 100

  // Price-volume correlation (negative correlation increases sell score)
  sellScore += weights.priceVolumeCorrelation * (input.priceVolumeCorrelation < 0 ? -input.priceVolumeCorrelation : 0)

  // Divergence
  sellScore += weights.bearishDivergence * (input.bearishDivergence ? 1 : 0)

  // Multi-timeframe trends
  sellScore += weights.m5Trend * (encodeFeature(input.m5Trend) < 0 ? 1 : 0)
  sellScore += weights.m15Trend * (encodeFeature(input.m15Trend) < 0 ? 1 : 0)
  sellScore += weights.m30Trend * (encodeFeature(input.m30Trend) < 0 ? 1 : 0)

  // Normalize scores to probabilities
  const totalScore = buyScore + sellScore
  const buyProbability = buyScore / totalScore
  const sellProbability = sellScore / totalScore

  // Determine prediction and confidence
  let prediction: "BUY" | "SELL" | "NEUTRAL"
  let probability: number

  if (buyProbability > 0.6) {
    prediction = "BUY"
    probability = buyProbability
  } else if (sellProbability > 0.6) {
    prediction = "SELL"
    probability = sellProbability
  } else {
    prediction = "NEUTRAL"
    probability = Math.max(buyProbability, sellProbability)
  }

  // Calculate confidence (0-100)
  const confidence = Math.round(probability * 100)

  return {
    prediction,
    probability,
    confidence,
  }
}

// Function to prepare model input from market data and indicators
export function prepareModelInput(
  lastPrice: number,
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  ema50: number,
  bollingerBands: { upper: number; middle: number; lower: number },
  volumeAnalysis: { volumeStrength: number; priceVolumeCorrelation: number },
  divergence: { bullishDivergence: boolean; bearishDivergence: boolean },
  multiTimeframeConfirmation: {
    m5Trend: "bullish" | "bearish" | "neutral"
    m15Trend: "bullish" | "bearish" | "neutral"
    m30Trend: "bullish" | "bearish" | "neutral"
  },
): ModelInput {
  return {
    rsi,
    macdHistogram: macd.histogram,
    priceToEma: lastPrice / ema50,
    priceToBollingerUpper: lastPrice / bollingerBands.upper,
    priceToBollingerLower: lastPrice / bollingerBands.lower,
    volumeStrength: volumeAnalysis.volumeStrength,
    priceVolumeCorrelation: volumeAnalysis.priceVolumeCorrelation,
    bullishDivergence: divergence.bullishDivergence,
    bearishDivergence: divergence.bearishDivergence,
    m5Trend: multiTimeframeConfirmation.m5Trend,
    m15Trend: multiTimeframeConfirmation.m15Trend,
    m30Trend: multiTimeframeConfirmation.m30Trend,
  }
}
