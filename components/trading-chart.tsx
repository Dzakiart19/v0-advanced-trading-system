"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"

// Mock data for the chart
const generateMockData = (length: number) => {
  const data = []
  let price = 1.105

  for (let i = 0; i < length; i++) {
    const time = new Date()
    time.setMinutes(time.getMinutes() - (length - i))

    // Random price movement
    const change = (Math.random() - 0.5) * 0.002
    price += change

    const open = price
    const close = price + (Math.random() - 0.5) * 0.001
    const high = Math.max(open, close) + Math.random() * 0.0005
    const low = Math.min(open, close) - Math.random() * 0.0005

    data.push({
      time: time,
      open: open,
      high: high,
      low: low,
      close: close,
    })
  }

  return data
}

export default function TradingChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [chartData, setChartData] = useState(generateMockData(60))
  const [indicators, setIndicators] = useState({
    rsi: true,
    macd: true,
    bollinger: true,
    ema: true,
  })

  // Function to toggle indicator visibility
  const toggleIndicator = (indicator: keyof typeof indicators) => {
    setIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Chart dimensions
    const chartWidth = canvas.width - 60
    const chartHeight = canvas.height - 60
    const chartTop = 30
    const chartLeft = 50

    // Find min and max prices for scaling
    const prices = chartData.flatMap((d) => [d.high, d.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    const paddedMin = minPrice - priceRange * 0.1
    const paddedMax = maxPrice + priceRange * 0.1
    const adjustedRange = paddedMax - paddedMin

    // Draw price scale
    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + chartHeight - (i / 5) * chartHeight
      const price = paddedMin + (i / 5) * adjustedRange
      ctx.fillText(price.toFixed(5), 5, y + 4)

      // Grid line
      ctx.strokeStyle = "#eee"
      ctx.beginPath()
      ctx.moveTo(chartLeft, y)
      ctx.lineTo(chartLeft + chartWidth, y)
      ctx.stroke()
    }

    // Draw time scale
    const timeInterval = Math.ceil(chartData.length / 6)
    for (let i = 0; i < chartData.length; i += timeInterval) {
      const x = chartLeft + (i / chartData.length) * chartWidth
      const time = chartData[i].time
      const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`

      ctx.fillText(timeStr, x - 15, chartTop + chartHeight + 15)

      // Grid line
      ctx.strokeStyle = "#eee"
      ctx.beginPath()
      ctx.moveTo(x, chartTop)
      ctx.lineTo(x, chartTop + chartHeight)
      ctx.stroke()
    }

    // Draw chart border
    ctx.strokeStyle = "#ddd"
    ctx.strokeRect(chartLeft, chartTop, chartWidth, chartHeight)

    // Draw candlesticks
    const candleWidth = (chartWidth / chartData.length) * 0.8
    const spacing = (chartWidth / chartData.length) * 0.2

    chartData.forEach((candle, i) => {
      const x = chartLeft + (i / chartData.length) * chartWidth + spacing / 2

      // Scale prices to chart height
      const scaledOpen = chartTop + chartHeight - ((candle.open - paddedMin) / adjustedRange) * chartHeight
      const scaledClose = chartTop + chartHeight - ((candle.close - paddedMin) / adjustedRange) * chartHeight
      const scaledHigh = chartTop + chartHeight - ((candle.high - paddedMin) / adjustedRange) * chartHeight
      const scaledLow = chartTop + chartHeight - ((candle.low - paddedMin) / adjustedRange) * chartHeight

      // Draw wick
      ctx.strokeStyle = candle.open > candle.close ? "#ef4444" : "#22c55e"
      ctx.beginPath()
      ctx.moveTo(x + candleWidth / 2, scaledHigh)
      ctx.lineTo(x + candleWidth / 2, scaledLow)
      ctx.stroke()

      // Draw body
      ctx.fillStyle = candle.open > candle.close ? "#ef4444" : "#22c55e"
      const bodyTop = Math.min(scaledOpen, scaledClose)
      const bodyHeight = Math.abs(scaledClose - scaledOpen)
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight)
    })

    // Draw EMA if enabled
    if (indicators.ema) {
      // Calculate simple EMA (for demonstration)
      const emaData = chartData.map((d) => d.close)
      const ema = []
      const period = 14

      // Simple EMA calculation
      let sum = 0
      for (let i = 0; i < period; i++) {
        sum += emaData[i]
      }
      ema.push(sum / period)

      const multiplier = 2 / (period + 1)
      for (let i = period; i < emaData.length; i++) {
        ema.push(emaData[i] * multiplier + ema[i - period] * (1 - multiplier))
      }

      // Draw EMA line
      ctx.strokeStyle = "#8b5cf6"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = period - 1; i < chartData.length; i++) {
        const x = chartLeft + (i / chartData.length) * chartWidth + candleWidth / 2
        const y = chartTop + chartHeight - ((ema[i - period + 1] - paddedMin) / adjustedRange) * chartHeight

        if (i === period - 1) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
      ctx.lineWidth = 1
    }

    // Draw Bollinger Bands if enabled
    if (indicators.bollinger) {
      // Calculate simple Bollinger Bands (for demonstration)
      const period = 20
      const stdDevMultiplier = 2
      const closes = chartData.map((d) => d.close)

      // Calculate SMA
      const sma = []
      for (let i = period - 1; i < closes.length; i++) {
        let sum = 0
        for (let j = i - period + 1; j <= i; j++) {
          sum += closes[j]
        }
        sma.push(sum / period)
      }

      // Calculate Standard Deviation
      const stdDev = []
      for (let i = period - 1; i < closes.length; i++) {
        let sum = 0
        for (let j = i - period + 1; j <= i; j++) {
          sum += Math.pow(closes[j] - sma[i - period + 1], 2)
        }
        stdDev.push(Math.sqrt(sum / period))
      }

      // Calculate Upper and Lower Bands
      const upperBand = sma.map((val, i) => val + stdDevMultiplier * stdDev[i])
      const lowerBand = sma.map((val, i) => val - stdDevMultiplier * stdDev[i])

      // Draw Upper Band
      ctx.strokeStyle = "rgba(139, 92, 246, 0.5)"
      ctx.beginPath()

      for (let i = 0; i < upperBand.length; i++) {
        const x = chartLeft + ((i + period - 1) / chartData.length) * chartWidth + candleWidth / 2
        const y = chartTop + chartHeight - ((upperBand[i] - paddedMin) / adjustedRange) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Draw Lower Band
      ctx.beginPath()

      for (let i = 0; i < lowerBand.length; i++) {
        const x = chartLeft + ((i + period - 1) / chartData.length) * chartWidth + candleWidth / 2
        const y = chartTop + chartHeight - ((lowerBand[i] - paddedMin) / adjustedRange) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }

    // Draw RSI indicator if enabled
    if (indicators.rsi) {
      // Draw RSI in a small panel at the bottom
      const rsiHeight = 50
      const rsiTop = chartTop + chartHeight + 30

      // RSI panel background
      ctx.fillStyle = "#f9fafb"
      ctx.fillRect(chartLeft, rsiTop, chartWidth, rsiHeight)
      ctx.strokeStyle = "#ddd"
      ctx.strokeRect(chartLeft, rsiTop, chartWidth, rsiHeight)

      // RSI levels
      ctx.fillStyle = "#666"
      ctx.fillText("RSI", 20, rsiTop + rsiHeight / 2)
      ctx.fillText("70", 30, rsiTop + rsiHeight * 0.3)
      ctx.fillText("30", 30, rsiTop + rsiHeight * 0.7)

      // RSI level lines
      ctx.strokeStyle = "#ddd"
      ctx.beginPath()
      ctx.moveTo(chartLeft, rsiTop + rsiHeight * 0.3)
      ctx.lineTo(chartLeft + chartWidth, rsiTop + rsiHeight * 0.3)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(chartLeft, rsiTop + rsiHeight * 0.7)
      ctx.lineTo(chartLeft + chartWidth, rsiTop + rsiHeight * 0.7)
      ctx.stroke()

      // Calculate simple RSI (for demonstration)
      const period = 14
      const closes = chartData.map((d) => d.close)
      const changes = []

      for (let i = 1; i < closes.length; i++) {
        changes.push(closes[i] - closes[i - 1])
      }

      const rsiValues = []

      for (let i = period; i < changes.length; i++) {
        let gains = 0
        let losses = 0

        for (let j = i - period; j < i; j++) {
          if (changes[j] >= 0) {
            gains += changes[j]
          } else {
            losses -= changes[j]
          }
        }

        const avgGain = gains / period
        const avgLoss = losses / period

        if (avgLoss === 0) {
          rsiValues.push(100)
        } else {
          const rs = avgGain / avgLoss
          rsiValues.push(100 - 100 / (1 + rs))
        }
      }

      // Draw RSI line
      ctx.strokeStyle = "#8b5cf6"
      ctx.beginPath()

      for (let i = 0; i < rsiValues.length; i++) {
        const x = chartLeft + ((i + period) / chartData.length) * chartWidth
        // RSI is 0-100, but we only show 0-30 and 70-100 as extreme values
        const y = rsiTop + rsiHeight - (rsiValues[i] / 100) * rsiHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }

    // Draw MACD indicator if enabled
    if (indicators.macd) {
      // Draw MACD in a small panel at the bottom
      const macdHeight = 50
      const macdTop = chartTop + chartHeight + (indicators.rsi ? 100 : 30)

      // MACD panel background
      ctx.fillStyle = "#f9fafb"
      ctx.fillRect(chartLeft, macdTop, chartWidth, macdHeight)
      ctx.strokeStyle = "#ddd"
      ctx.strokeRect(chartLeft, macdTop, chartWidth, macdHeight)

      // MACD label
      ctx.fillStyle = "#666"
      ctx.fillText("MACD", 20, macdTop + macdHeight / 2)

      // Calculate simple MACD (for demonstration)
      const closes = chartData.map((d) => d.close)
      const ema12 = []
      const ema26 = []
      const macdLine = []
      const signalLine = []

      // Simple EMA calculation for MACD
      let sum12 = 0
      let sum26 = 0

      for (let i = 0; i < 12; i++) {
        sum12 += closes[i]
      }
      ema12.push(sum12 / 12)

      for (let i = 0; i < 26; i++) {
        sum26 += closes[i]
      }
      ema26.push(sum26 / 26)

      const multiplier12 = 2 / (12 + 1)
      const multiplier26 = 2 / (26 + 1)

      for (let i = 12; i < closes.length; i++) {
        if (i >= ema12.length) {
          ema12.push(closes[i] * multiplier12 + ema12[ema12.length - 1] * (1 - multiplier12))
        }
      }

      for (let i = 26; i < closes.length; i++) {
        if (i >= ema26.length) {
          ema26.push(closes[i] * multiplier26 + ema26[ema26.length - 1] * (1 - multiplier26))
        }
      }

      // Calculate MACD line
      for (let i = 0; i < ema12.length - 14; i++) {
        macdLine.push(ema12[i + 14] - ema26[i])
      }

      // Calculate signal line (9-day EMA of MACD line)
      let sumSignal = 0
      for (let i = 0; i < 9; i++) {
        sumSignal += macdLine[i]
      }
      signalLine.push(sumSignal / 9)

      const multiplierSignal = 2 / (9 + 1)
      for (let i = 9; i < macdLine.length; i++) {
        signalLine.push(macdLine[i] * multiplierSignal + signalLine[signalLine.length - 1] * (1 - multiplierSignal))
      }

      // Calculate histogram
      const histogram = []
      for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i + 9] - signalLine[i])
      }

      // Find min and max for scaling
      const allMacdValues = [...macdLine, ...signalLine]
      const minMacd = Math.min(...allMacdValues)
      const maxMacd = Math.max(...allMacdValues)
      const macdRange = maxMacd - minMacd

      // Draw MACD line
      ctx.strokeStyle = "#8b5cf6"
      ctx.beginPath()

      for (let i = 0; i < macdLine.length; i++) {
        const x = chartLeft + ((i + 26) / chartData.length) * chartWidth
        const y = macdTop + macdHeight / 2 - ((macdLine[i] - minMacd) / macdRange) * (macdHeight * 0.4)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Draw signal line
      ctx.strokeStyle = "#f59e0b"
      ctx.beginPath()

      for (let i = 0; i < signalLine.length; i++) {
        const x = chartLeft + ((i + 35) / chartData.length) * chartWidth
        const y = macdTop + macdHeight / 2 - ((signalLine[i] - minMacd) / macdRange) * (macdHeight * 0.4)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Draw histogram
      for (let i = 0; i < histogram.length; i++) {
        const x = chartLeft + ((i + 35) / chartData.length) * chartWidth
        const zero = macdTop + macdHeight / 2
        const y = zero - (histogram[i] / macdRange) * (macdHeight * 0.4)

        ctx.fillStyle = histogram[i] >= 0 ? "#22c55e" : "#ef4444"
        ctx.fillRect(x - 1, zero, 2, y - zero)
      }
    }

    // Draw buy/sell signals
    const signals = [
      { time: 15, type: "buy", price: chartData[15].low },
      { time: 30, type: "sell", price: chartData[30].high },
      { time: 45, type: "buy", price: chartData[45].low },
    ]

    signals.forEach((signal) => {
      const x = chartLeft + (signal.time / chartData.length) * chartWidth + candleWidth / 2
      const y = chartTop + chartHeight - ((signal.price - paddedMin) / adjustedRange) * chartHeight

      ctx.fillStyle = signal.type === "buy" ? "#22c55e" : "#ef4444"
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.stroke()

      // Draw arrow
      ctx.beginPath()
      if (signal.type === "buy") {
        ctx.moveTo(x, y - 8)
        ctx.lineTo(x - 4, y - 4)
        ctx.lineTo(x + 4, y - 4)
      } else {
        ctx.moveTo(x, y + 8)
        ctx.lineTo(x - 4, y + 4)
        ctx.lineTo(x + 4, y + 4)
      }
      ctx.fill()
    })
  }, [chartData, indicators, zoomLevel])

  // Update chart data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const lastCandle = chartData[chartData.length - 1]
      const time = new Date()

      // Random price movement
      const change = (Math.random() - 0.5) * 0.002
      const price = lastCandle.close + change

      const open = price
      const close = price + (Math.random() - 0.5) * 0.001
      const high = Math.max(open, close) + Math.random() * 0.0005
      const low = Math.min(open, close) - Math.random() * 0.0005

      const newCandle = {
        time: time,
        open: open,
        high: high,
        low: low,
        close: close,
      }

      setChartData((prev) => [...prev.slice(1), newCandle])
    }, 5000)

    return () => clearInterval(interval)
  }, [chartData])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
  }

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white p-4" : ""}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleIndicator("rsi")}
            className={indicators.rsi ? "bg-purple-100" : ""}
          >
            RSI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleIndicator("macd")}
            className={indicators.macd ? "bg-purple-100" : ""}
          >
            MACD
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleIndicator("bollinger")}
            className={indicators.bollinger ? "bg-purple-100" : ""}
          >
            Bollinger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleIndicator("ema")}
            className={indicators.ema ? "bg-purple-100" : ""}
          >
            EMA
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="absolute top-2 right-2 bg-white/80 rounded px-2 py-1 text-sm font-medium">
          1.1052 <span className="text-green-600">+0.0012</span>
        </div>

        <div className="absolute top-2 left-2 flex space-x-2">
          <div className="bg-green-100 text-green-800 rounded px-2 py-1 text-xs font-medium flex items-center">
            <ChevronUp className="h-3 w-3 mr-1" /> BUY
          </div>
          <div className="bg-red-100 text-red-800 rounded px-2 py-1 text-xs font-medium flex items-center">
            <ChevronDown className="h-3 w-3 mr-1" /> SELL
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full"
          style={{
            height: isFullscreen ? "calc(100vh - 120px)" : "500px",
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  )
}
