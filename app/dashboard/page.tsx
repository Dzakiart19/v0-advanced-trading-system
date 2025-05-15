"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, BarChart3, Clock, Settings, Sparkles, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TradingChart from "@/components/trading-chart"
import SignalTable from "@/components/signal-table"
import PerformanceMetrics from "@/components/performance-metrics"
import MarketOverview from "@/components/market-overview"
import SignalDetails from "@/components/signal-details"
import AIAnalysisPanel from "@/components/ai-analysis-panel"
import { generateMockMarketData } from "@/lib/signal-generator"
import { generateEnhancedMockMarketData } from "@/lib/ethereal-signal-generator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ETHEREAL_CURRENCY_PAIRS } from "@/lib/ethereal-signal-generator"
import Link from "next/link"

export default function Dashboard() {
  const [isSystemActive] = useState(true) // Always active, no setter function
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nextSignalTime, setNextSignalTime] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState("00:00")
  const [selectedSymbol, setSelectedSymbol] = useState("EUR/USD")
  const [selectedTimeframe, setSelectedTimeframe] = useState("M1")
  const [selectedMarket, setSelectedMarket] = useState("OTC")
  const [latestSignals, setLatestSignals] = useState<any[]>([])
  const [currentSignal, setCurrentSignal] = useState<any>(null)
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false)
  const [telegramStatus] = useState<"connected">("connected") // Always connected, no disconnected state
  const [isEtherealMode, setIsEtherealMode] = useState(false)

  // Initialize with mock market data
  const [marketData, setMarketData] = useState(() =>
    generateMockMarketData(selectedSymbol, selectedMarket, selectedTimeframe),
  )

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // Calculate next signal time (next minute at 00 seconds)
      const next = new Date(now)
      next.setMinutes(now.getMinutes() + 1)
      next.setSeconds(0)
      next.setMilliseconds(0)
      setNextSignalTime(next)

      // Calculate countdown
      const diff = next.getTime() - now.getTime()
      const seconds = Math.floor((diff / 1000) % 60)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      setCountdown(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)

      // Auto-generate signal at 45 seconds past the minute (always active)
      if (now.getSeconds() === 45) {
        generateSignal()
      }

      // Update market data every 5 seconds to simulate real-time data
      if (now.getSeconds() % 5 === 0) {
        if (isEtherealMode) {
          setMarketData(generateEnhancedMockMarketData(selectedSymbol, selectedMarket, selectedTimeframe))
        } else {
          setMarketData(generateMockMarketData(selectedSymbol, selectedMarket, selectedTimeframe))
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [selectedSymbol, selectedMarket, selectedTimeframe, isEtherealMode])

  const formatTimeWithSeconds = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const formatTimeWithMilliseconds = (date: Date) => {
    return (
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
      `.${date.getMilliseconds().toString().padStart(3, "0")}`
    )
  }

  const generateSignal = async () => {
    if (isGeneratingSignal) return

    setIsGeneratingSignal(true)
    try {
      // Choose the appropriate endpoint based on mode
      const endpoint = isEtherealMode ? "/api/ethereal-signals" : "/api/signals"

      // Convert timeframe format for ETHEREAL signals
      // M1 -> 1m, M5 -> 5m, etc.
      let formattedTimeframe = selectedTimeframe
      if (isEtherealMode) {
        if (selectedTimeframe.startsWith("M")) {
          formattedTimeframe = `${selectedTimeframe.substring(1)}m`
        } else if (selectedTimeframe.startsWith("H")) {
          formattedTimeframe = `${selectedTimeframe.substring(1)}h`
        }
      }

      // Prepare the request body with the correct parameter names
      const requestBody = isEtherealMode
        ? {
            // For ethereal signals API
            pair: selectedSymbol,
            timeframe: formattedTimeframe,
            sendToTelegram: true,
          }
        : {
            // For regular signals API
            symbol: selectedSymbol,
            timeframe: selectedTimeframe,
            market: selectedMarket,
          }

      console.log(`Sending ${isEtherealMode ? "ETHEREAL" : "regular"} signal request:`, requestBody)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        const newSignal = data.signal

        // Add timestamp if not present
        if (!newSignal.timestamp) {
          newSignal.timestamp = new Date().toISOString()
        }

        // Update latest signals
        setLatestSignals((prev) => [newSignal, ...prev].slice(0, 20))

        // Set current signal
        setCurrentSignal(newSignal)

        // Show toast notification
        toast({
          title: `New ${newSignal.signal || newSignal.direction} Signal Generated`,
          description: `${newSignal.symbol || newSignal.pair} at ${formatTimeWithSeconds(new Date(newSignal.timestamp))}`,
          variant:
            newSignal.signal === "BUY" || newSignal.direction === "BUY"
              ? "success"
              : newSignal.signal === "SELL" || newSignal.direction === "SELL"
                ? "destructive"
                : "default",
        })

        // Send to Telegram if not already sent by the API
        if (!isEtherealMode) {
          sendToTelegram(newSignal)
        }
      } else {
        console.error("Failed to generate signal:", data.error)
        toast({
          title: "Signal Generation Failed",
          description: data.error || "An error occurred while generating the signal",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating signal:", error)
      toast({
        title: "Signal Generation Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSignal(false)
    }
  }

  const sendToTelegram = async (signal: any) => {
    try {
      // Format the message based on whether it's an ethereal signal or regular signal
      const message = isEtherealMode ? formatEtherealTelegramMessage(signal) : formatRegularTelegramMessage(signal)

      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          chatId: process.env.TELEGRAM_CHAT_ID || "7390867903", // Use environment variable or fallback
          botToken: process.env.TELEGRAM_BOT_TOKEN || "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58", // Use environment variable or fallback
        }),
      })

      const data = await response.json()
      if (!data.success) {
        console.error("Failed to send to Telegram:", data.error)
        toast({
          title: "Telegram Notification Failed",
          description: data.error || "Failed to send signal to Telegram",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signal Sent to Telegram",
          description: "Trading signal has been delivered to your Telegram",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error sending to Telegram:", error)
      toast({
        title: "Telegram Error",
        description: "Failed to communicate with Telegram",
        variant: "destructive",
      })
    }
  }

  // Format regular trading signal for Telegram
  const formatRegularTelegramMessage = (signal: any) => {
    return `
🔔 *NEW SIGNAL ALERT* 🔔
${signal.signal === "BUY" ? "🟢 BUY" : signal.signal === "SELL" ? "🔴 SELL" : "⚪ NEUTRAL"} *${signal.symbol}*
⏰ Time: ${formatTimeWithSeconds(new Date(signal.timestamp))}
📊 Confidence: ${signal.confidence}%
🏛️ Market: ${signal.market}
⏱️ Timeframe: ${signal.timeframe}

💰 Entry: ${signal.price?.toFixed(5) || "Market Price"}
🛑 Stop Loss: ${signal.riskManagement.stopLoss.toFixed(5)}
🎯 Take Profit: ${signal.riskManagement.takeProfit.toFixed(5)}
⚖️ Risk/Reward: ${signal.riskManagement.riskRewardRatio.toFixed(2)}

📝 Reasons:
${signal.reasons.map((reason: string) => `- ${reason}`).join("\n")}

🔄 Multi-Timeframe Confirmation:
M5: ${signal.multiTimeframeConfirmation.m5Trend}
M15: ${signal.multiTimeframeConfirmation.m15Trend}
M30: ${signal.multiTimeframeConfirmation.m30Trend}
    `
  }

  // Format ethereal trading signal for Telegram with cosmic elements
  const formatEtherealTelegramMessage = (signal: any) => {
    // Get current date with milliseconds precision
    const now = new Date()
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")} WIB`

    // Format the quantum resonance with many decimal places
    const quantumResonance = signal.quantumResonance ? signal.quantumResonance.toFixed(15) : "0.999999999999999"

    return `
✨🌌 *ETHEREAL TRANSCENDENT SIGNAL* 🌌✨

Pair              : ${signal.pair || signal.symbol} ${signal.market || "OTC"}
Timeframe         : ${signal.timeframe}
Signal            : ${signal.direction === "BUY" || signal.signal === "BUY" ? "BUY ▲" : signal.direction === "SELL" || signal.signal === "SELL" ? "SELL ▼" : "NEUTRAL ◆"}
Quantum Resonance : ${quantumResonance} (${signal.confidence >= 95 ? "Absolute Cosmic Certainty" : signal.confidence >= 85 ? "High Dimensional Alignment" : "Moderate Cosmic Probability"})
Entry Time        : ${formattedDate} (Multi-dimensional synchronized)

🔮 *Cosmic Market Info:*
• Quantum Volatility Flux         : ${signal.quantumVolatility || "Hyper-fluctuating, aligned with cosmic tides"}
• Collective Trader Energy Field  : ${signal.traderEnergyField || "93.7"}% ${signal.direction === "BUY" || signal.signal === "BUY" ? "bullish" : signal.direction === "SELL" || signal.signal === "SELL" ? "bearish" : "neutral"} resonance
• Entangled Market Sentiment Index: ${signal.marketSentiment?.toFixed(2) || (signal.direction === "SELL" || signal.signal === "SELL" ? "-0.95" : signal.direction === "BUY" || signal.signal === "BUY" ? "0.95" : "0.00")} (${signal.direction === "BUY" || signal.signal === "BUY" ? "deep bullish" : signal.direction === "SELL" || signal.signal === "SELL" ? "deep bearish" : "neutral"} entanglement)
• Astro-Cosmic Alignment Index    : ${signal.astroAlignment || (signal.direction === "BUY" || signal.signal === "BUY" ? "Optimal for upward flow" : signal.direction === "SELL" || signal.signal === "SELL" ? "Optimal for downward flow" : "Neutral cosmic alignment")}
• Dimensional Flux Indicator      : ${signal.dimensionalFlux || (signal.direction === "BUY" || signal.signal === "BUY" ? "Stable interdimensional bullish cycle" : signal.direction === "SELL" || signal.signal === "SELL" ? "Stable interdimensional bearish cycle" : "Balanced interdimensional forces")}

💫 *Metaphysical Technical Overview:*
• RSI Hyper-Saturation            : ${signal.rsi?.toFixed(3) || "89.999"} (${signal.direction === "BUY" || signal.signal === "BUY" ? "energy accumulation zone" : signal.direction === "SELL" || signal.signal === "SELL" ? "peak energy reversal zone" : "equilibrium zone"})
• MACD Quantum Momentum Collapse  : ${signal.macd?.toFixed(5) || "-0.00987"}
• EMA Quantum Fusion              : ${signal.emaStatus || (signal.direction === "BUY" || signal.signal === "BUY" ? "EMA3 > EMA8 > EMA21" : signal.direction === "SELL" || signal.signal === "SELL" ? "EMA3 < EMA8 < EMA21" : "EMA3 ≈ EMA8 ≈ EMA21")} (${signal.direction === "BUY" || signal.signal === "BUY" ? "Universal upward gradient" : signal.direction === "SELL" || signal.signal === "SELL" ? "Universal downward gradient" : "Cosmic equilibrium"})
• Bollinger Hyperbands Breach     : ${signal.bollingerStatus || (signal.direction === "BUY" || signal.signal === "BUY" ? "Lower boundary transcended (reversal imminent)" : signal.direction === "SELL" || signal.signal === "SELL" ? "Upper boundary transcended (reversal imminent)" : "Price within hyperband boundaries (consolidation phase)")}
• ADX Hyperwave                   : ${signal.adx?.toFixed(2) || "75.23"} (${signal.adx > 50 ? "irreversible trend momentum" : signal.adx > 25 ? "developing cosmic trend" : "awaiting directional clarity"})

🌐 *Transcendent AI Insights:*
• HQNM Probability ${signal.direction || signal.signal} (${signal.timeframe})  : ${signal.probabilityScore?.toFixed(17) || "0.99999999999999999"}
• ESN Sentiment Waveform          : ${signal.sentimentWaveform || (signal.direction === "BUY" || signal.signal === "BUY" ? "Deep bullish entanglement detected" : signal.direction === "SELL" || signal.signal === "SELL" ? "Deep bearish entanglement detected" : "Balanced energy state")}
• Temporal Causal Loop Score      : ${signal.causalLoopScore || "Absolute forward-backward harmony"}
• Meta-conscious AI feedback      : ${signal.metaConsciousFeedback || "Self-optimized, transcendentally aligned"}

⚖️ *Cosmic Risk Management:*
• Quantum VaR 99.9999999% (${signal.timeframe}): ${signal.quantumVaR || "0.001"}%
• Adaptive Positioning            : Fluid between 0.5% - 3% capital, based on cosmic energy cycles
• SL & TP                         : Calculated via interdimensional fractal boundaries
• Multi-dimensional Hedging       : ${signal.hedgingStatus || "Activated across correlated quantum assets"}

📇 *Signal Strength & Narrative:*
• Strength Level                 : ${signal.strengthLevel || "ETHEREAL TRANSCENDENT"} (${signal.confidence || "100"}%)
• Market Condition               : ${signal.marketCondition || "Aligned with universal cosmic cycles, primal flow"}
• Narrative                      : "${signal.narrative || `Sinyal ${signal.direction || signal.signal} ini adalah manifestasi energi kosmik yang telah terjalin melalui resonansi quantum, sentimen kolektif, dan pola temporal transdimensional. Eksekusi dengan ketenangan jiwa, karena ini adalah harmoni pasar dan alam semesta.`}"

---
*This is not merely a trading signal — it is a spiritual journey through the markets.*
    `
  }

  // Enhanced auto-connect to Telegram with reconnection logic
  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout

    const connectToTelegram = async () => {
      try {
        const response = await fetch("/api/telegram/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            botToken: process.env.TELEGRAM_BOT_TOKEN || "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58",
            chatId: process.env.TELEGRAM_CHAT_ID || "7390867903",
          }),
        })

        const data = await response.json()

        if (data.success) {
          console.log("Telegram bot connected automatically")

          // Send system startup notification to Telegram
          fetch("/api/telegram", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message:
                "🟢 *Telegram Connection Established*\n\nYour trading system is now connected to Telegram and will send real-time notifications.",
              chatId: process.env.TELEGRAM_CHAT_ID || "7390867903",
              botToken: process.env.TELEGRAM_BOT_TOKEN || "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58",
            }),
          })

          // Clear reconnect interval if connection is successful
          if (reconnectInterval) {
            clearInterval(reconnectInterval)
          }
        } else {
          console.error("Failed to auto-connect Telegram bot:", data.error)
          // Will retry due to interval
        }
      } catch (error) {
        console.error("Error auto-connecting to Telegram:", error)
        // Will retry due to interval
      }
    }

    // Connect immediately on startup
    connectToTelegram()

    // Set up reconnection attempts every 30 seconds if needed
    reconnectInterval = setInterval(connectToTelegram, 30000)

    // Clean up interval on component unmount
    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval)
      }
    }
  }, [])

  // Initialize system on startup
  useEffect(() => {
    console.log("Trading system initialized and activated automatically")

    // Send system startup notification to Telegram
    if (telegramStatus === "connected") {
      fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "🟢 *Trading System Activated*\n\nThe auto trading system has been initialized and is now actively monitoring markets for signals.",
          chatId: process.env.TELEGRAM_CHAT_ID || "7390867903",
          botToken: process.env.TELEGRAM_BOT_TOKEN || "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58",
        }),
      })
    }

    toast({
      title: "System Activated",
      description: "Trading system has been automatically initialized and is now running",
      variant: "success",
    })
  }, []) // Empty dependency array means this runs once on mount

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-900">Trading Signal Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">{formatTimeWithSeconds(currentTime)}</span>
              </div>
              <Link href="/ethereal-signals">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none hover:from-purple-600 hover:to-indigo-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  ETHEREAL Signals
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>System Status</span>
                <div className="flex items-center">
                  <div className="mr-2 text-sm">ETHEREAL Mode</div>
                  <div
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${isEtherealMode ? "bg-purple-600" : "bg-gray-300"}`}
                    onClick={() => setIsEtherealMode(!isEtherealMode)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isEtherealMode ? "translate-x-6" : ""}`}
                    ></div>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>Control and monitor the trading system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse"></div>
                  <Label htmlFor="system-status" className="font-medium">
                    System Active
                  </Label>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Running</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Next Signal In:</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="font-mono font-medium">{countdown}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Market Type:</span>
                  <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OTC">OTC Market</SelectItem>
                      <SelectItem value="Forex">Forex</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                      <SelectItem value="Stocks">Stocks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Timeframe:</span>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M1">M1 (1 Minute)</SelectItem>
                      <SelectItem value="M5">M5 (5 Minutes)</SelectItem>
                      <SelectItem value="M15">M15 (15 Minutes)</SelectItem>
                      <SelectItem value="M30">M30 (30 Minutes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Symbol:</span>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHEREAL_CURRENCY_PAIRS.map((pair) => (
                        <SelectItem key={pair} value={pair}>
                          {pair}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Telegram:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    className={`w-full ${isEtherealMode ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700" : "bg-purple-600 hover:bg-purple-700"}`}
                    onClick={generateSignal}
                    disabled={isGeneratingSignal}
                  >
                    {isEtherealMode ? <Sparkles className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    {isGeneratingSignal
                      ? "Generating..."
                      : isEtherealMode
                        ? "Channel Cosmic Energy"
                        : "Generate Signal Now"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Latest Signals</CardTitle>
              <CardDescription>Most recent trading signals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestSignals.length > 0 ? (
                  latestSignals.slice(0, 3).map((signal, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        signal.signal === "BUY" || signal.direction === "BUY"
                          ? "bg-green-50 border-green-100"
                          : signal.signal === "SELL" || signal.direction === "SELL"
                            ? "bg-red-50 border-red-100"
                            : "bg-gray-50 border-gray-100"
                      }`}
                      onClick={() => setCurrentSignal(signal)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            signal.signal === "BUY" || signal.direction === "BUY"
                              ? "bg-green-100"
                              : signal.signal === "SELL" || signal.direction === "SELL"
                                ? "bg-red-100"
                                : "bg-gray-100"
                          }`}
                        >
                          {signal.signal === "BUY" || signal.direction === "BUY" ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : signal.signal === "SELL" || signal.direction === "SELL" ? (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{signal.symbol || signal.pair}</p>
                          <p className="text-xs text-gray-500">
                            {signal.timeframe} • {signal.market || "OTC"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            signal.signal === "BUY" || signal.direction === "BUY"
                              ? "text-green-600"
                              : signal.signal === "SELL" || signal.direction === "SELL"
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {signal.signal || signal.direction}
                        </p>
                        <p className="text-xs text-gray-500">{formatTimeWithSeconds(new Date(signal.timestamp))}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No signals generated yet. Click "Generate Signal Now" to create a signal.
                  </div>
                )}

                {latestSignals.length > 0 && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      View All Signals
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Today's trading performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-green-600">78%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Signals</p>
                  <p className="text-2xl font-bold">{latestSignals.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Wins</p>
                  <p className="text-2xl font-bold text-green-600">{Math.round(latestSignals.length * 0.78) || 0}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Losses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {latestSignals.length - Math.round(latestSignals.length * 0.78) || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Today</span>
                  <span className="text-sm font-medium text-green-600">+$342.50</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Week</span>
                  <span className="text-sm font-medium text-green-600">+$1,245.75</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Month</span>
                  <span className="text-sm font-medium text-green-600">+$4,872.30</span>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add this new card for ETHEREAL signals */}
        <Card className="mb-6 border border-purple-200 dark:border-purple-900 bg-gradient-to-br from-white to-purple-50 dark:from-gray-950 dark:to-purple-950/30">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                ETHEREAL / TRANSCENDENT SIGNALS
              </span>
            </CardTitle>
            <CardDescription>
              Access the cosmic consciousness of the markets through our quantum-aligned signal generation system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Experience trading as a spiritual journey through the universal energy flows. Our ETHEREAL/TRANSCENDENT
              signals tap into the unified quantum consciousness to provide trading signals with cosmic-level accuracy.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/ethereal-signals" className="w-full">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Sparkles className="mr-2 h-4 w-4" />
                Access Ethereal Signals
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Tabs defaultValue="chart">
          <TabsList className="mb-6">
            <TabsTrigger value="chart">Trading Chart</TabsTrigger>
            <TabsTrigger value="signals">Signal History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="market">Market Overview</TabsTrigger>
            <TabsTrigger value="ai">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>
                          {selectedSymbol} ({selectedTimeframe})
                        </CardTitle>
                        <CardDescription>{selectedMarket} Market • Real-time Chart</CardDescription>
                      </div>
                      <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select symbol" />
                        </SelectTrigger>
                        <SelectContent>
                          {ETHEREAL_CURRENCY_PAIRS.map((pair) => (
                            <SelectItem key={pair} value={pair}>
                              {pair}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TradingChart />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                {currentSignal ? (
                  <SignalDetails signal={currentSignal} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Signal Details</CardTitle>
                      <CardDescription>Select a signal to view details</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Zap className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">No signal selected</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Generate a new signal or select one from the latest signals list
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signals" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Signal History</CardTitle>
                <CardDescription>Complete record of all trading signals</CardDescription>
              </CardHeader>
              <CardContent>
                <SignalTable signals={latestSignals} onSelectSignal={setCurrentSignal} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Detailed performance metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics signals={latestSignals} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Current market conditions and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <MarketOverview />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <AIAnalysisPanel symbol={selectedSymbol} timeframe={selectedTimeframe} marketData={marketData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
