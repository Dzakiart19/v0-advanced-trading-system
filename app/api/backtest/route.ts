import { NextResponse } from "next/server"
import { generateSignal } from "@/lib/signal-generator"

// Simulate a backtest of the trading strategy
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbol, timeframe, market, period, initialBalance } = body

    if (!symbol) {
      return NextResponse.json({ success: false, error: "Symbol is required" }, { status: 400 })
    }

    // Default values
    const testPeriod = period || 30 // days
    const startBalance = initialBalance || 1000 // dollars

    // Generate historical data for backtesting
    // In a real implementation, this would fetch actual historical data
    const historicalData = generateBacktestData(symbol, market || "OTC", timeframe || "M1", testPeriod)

    // Run backtest
    const results = runBacktest(historicalData, startBalance)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error("Error running backtest:", error)
    return NextResponse.json({ success: false, error: "Failed to run backtest" }, { status: 500 })
  }
}

// Generate mock historical data for backtesting
function generateBacktestData(symbol: string, market: string, timeframe: string, days: number) {
  const dataPoints = days * 24 * 60 // Assuming 1-minute data
  const basePrice = symbol === "USD/JPY" ? 110 : symbol === "EUR/USD" ? 1.1 : symbol === "GBP/USD" ? 1.3 : 0.7

  const data = []
  let currentPrice = basePrice

  for (let i = 0; i < dataPoints; i++) {
    // Generate price with some trend and volatility
    const trend = Math.sin(i / 1000) * 0.0001 // Small trend component
    const volatility = (Math.random() - 0.5) * 0.001 // Random volatility
    currentPrice = currentPrice * (1 + trend + volatility)

    // Generate candle data
    const open = currentPrice
    const high = open * (1 + Math.random() * 0.001)
    const low = open * (1 - Math.random() * 0.001)
    const close = open * (1 + (Math.random() - 0.5) * 0.0005)
    const volume = Math.floor(Math.random() * 1000) + 500

    // Create timestamp
    const timestamp = new Date()
    timestamp.setMinutes(timestamp.getMinutes() - (dataPoints - i))

    data.push({
      timestamp: timestamp.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    })
  }

  return {
    symbol,
    market,
    timeframe,
    data,
  }
}

// Run backtest on historical data
function runBacktest(historicalData: any, initialBalance: number) {
  const { symbol, market, timeframe, data } = historicalData

  let balance = initialBalance
  const trades = []
  const equity = [{ timestamp: data[0].timestamp, value: balance }]
  let openTrade = null

  // Process data in chunks to simulate real-time signal generation
  const chunkSize = 100 // Number of candles to process at once

  for (let i = chunkSize; i < data.length; i++) {
    // Prepare market data for signal generation
    const marketData = {
      symbol,
      market,
      timeframe,
      prices: data.slice(i - chunkSize, i).map((d) => d.close),
      highs: data.slice(i - chunkSize, i).map((d) => d.high),
      lows: data.slice(i - chunkSize, i).map((d) => d.low),
      volumes: data.slice(i - chunkSize, i).map((d) => d.volume),
    }

    // Generate signal
    const signal = generateSignal(marketData)

    // Process open trade if exists
    if (openTrade) {
      const currentPrice = data[i].close

      // Check if stop loss or take profit hit
      if (openTrade.type === "BUY") {
        if (data[i].low <= openTrade.stopLoss) {
          // Stop loss hit
          const profit = (openTrade.stopLoss - openTrade.entryPrice) * openTrade.size
          balance += profit

          trades.push({
            ...openTrade,
            exitPrice: openTrade.stopLoss,
            exitTime: data[i].timestamp,
            profit,
            result: "LOSS",
          })

          openTrade = null
        } else if (data[i].high >= openTrade.takeProfit) {
          // Take profit hit
          const profit = (openTrade.takeProfit - openTrade.entryPrice) * openTrade.size
          balance += profit

          trades.push({
            ...openTrade,
            exitPrice: openTrade.takeProfit,
            exitTime: data[i].timestamp,
            profit,
            result: "WIN",
          })

          openTrade = null
        }
      } else if (openTrade.type === "SELL") {
        if (data[i].high >= openTrade.stopLoss) {
          // Stop loss hit
          const profit = (openTrade.entryPrice - openTrade.stopLoss) * openTrade.size
          balance += profit

          trades.push({
            ...openTrade,
            exitPrice: openTrade.stopLoss,
            exitTime: data[i].timestamp,
            profit,
            result: "LOSS",
          })

          openTrade = null
        } else if (data[i].low <= openTrade.takeProfit) {
          // Take profit hit
          const profit = (openTrade.entryPrice - openTrade.takeProfit) * openTrade.size
          balance += profit

          trades.push({
            ...openTrade,
            exitPrice: openTrade.takeProfit,
            exitTime: data[i].timestamp,
            profit,
            result: "WIN",
          })

          openTrade = null
        }
      }
    }

    // Open new trade if signal is strong and no open trade
    if (!openTrade && (signal.signal === "BUY" || signal.signal === "SELL") && signal.confidence > 70) {
      const currentPrice = data[i].close
      const riskAmount = balance * 0.02 // Risk 2% of balance

      // Calculate position size
      const stopLoss = signal.riskManagement.stopLoss
      const riskPerUnit = Math.abs(currentPrice - stopLoss)
      const size = riskAmount / riskPerUnit

      openTrade = {
        type: signal.signal,
        entryPrice: currentPrice,
        stopLoss: signal.riskManagement.stopLoss,
        takeProfit: signal.riskManagement.takeProfit,
        entryTime: data[i].timestamp,
        size,
        confidence: signal.confidence,
      }
    }

    // Record equity curve
    equity.push({
      timestamp: data[i].timestamp,
      value:
        balance +
        (openTrade
          ? openTrade.type === "BUY"
            ? (data[i].close - openTrade.entryPrice) * openTrade.size
            : (openTrade.entryPrice - data[i].close) * openTrade.size
          : 0),
    })
  }

  // Close any open trade at the end
  if (openTrade) {
    const lastPrice = data[data.length - 1].close
    let profit

    if (openTrade.type === "BUY") {
      profit = (lastPrice - openTrade.entryPrice) * openTrade.size
    } else {
      profit = (openTrade.entryPrice - lastPrice) * openTrade.size
    }

    balance += profit

    trades.push({
      ...openTrade,
      exitPrice: lastPrice,
      exitTime: data[data.length - 1].timestamp,
      profit,
      result: profit > 0 ? "WIN" : "LOSS",
    })
  }

  // Calculate performance metrics
  const wins = trades.filter((t) => t.result === "WIN").length
  const losses = trades.filter((t) => t.result === "LOSS").length
  const totalTrades = trades.length
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
  const profitFactor =
    trades.reduce((sum, t) => (t.profit > 0 ? sum + t.profit : sum), 0) /
    Math.abs(trades.reduce((sum, t) => (t.profit < 0 ? sum + t.profit : sum), 0) || 1)

  const maxDrawdown = calculateMaxDrawdown(equity)

  return {
    initialBalance,
    finalBalance: balance,
    profit: balance - initialBalance,
    profitPercentage: ((balance - initialBalance) / initialBalance) * 100,
    trades: totalTrades,
    wins,
    losses,
    winRate,
    profitFactor,
    maxDrawdown,
    equity: equity.filter((_, i) => i % 60 === 0), // Sample equity curve (every hour)
    tradeSummary: trades.map((t) => ({
      type: t.type,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      profit: t.profit,
      result: t.result,
    })),
  }
}

// Calculate maximum drawdown from equity curve
function calculateMaxDrawdown(equity: any[]) {
  let maxDrawdown = 0
  let peak = equity[0].value

  for (const point of equity) {
    if (point.value > peak) {
      peak = point.value
    }

    const drawdown = ((peak - point.value) / peak) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return maxDrawdown
}
