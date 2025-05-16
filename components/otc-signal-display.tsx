"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Clock, Copy, RefreshCw, Send, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { SIGNAL_TIMING } from "@/lib/otc-auto-signal-config"

interface OTCSignal {
  pair: string
  direction: "BUY" | "SELL"
  price: number
  timestamp: string
  entryTime: string
  strength: number
  technicalIndicators: {
    rsi: number
    macd: {
      macd: number
      signal: number
      histogram: number
    }
    ema9: number
    ema21: number
    sma50: number
  }
  marketInfo: {
    volatility: {
      value: number
      description: string
      atr: number
    }
    assetStrength: string
    volumeMetric: string
    volumeData: {
      current: number
      average: number
      ratio: number
      trend: string
      anomaly: boolean
      anomalyScore: number
    }
    sentiment: {
      score: number
      description: string
      keywords: string[]
    }
  }
  levels: {
    support: number
    resistance: number
  }
  marketConditions: string
  reasons: string[]
  message: string
}

interface TradeResult {
  signal: OTCSignal
  result: "Win" | "Lose"
  reason: string
  entryPrice: number
  exitPrice: number
  pnl: number
  pnlPercentage: number
  duration: number
  technicalAtExit: {
    rsi: number
    macd: {
      macd: number
      signal: number
      histogram: number
    }
  }
  volumeChange: number
  sentimentShift: number
  message: string
  suggestions: string[]
}

export default function OTCSignalDisplay() {
  const [signals, setSignals] = useState<OTCSignal[]>([])
  const [loading, setLoading] = useState(false)
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState("")
  const [countdownProgress, setCountdownProgress] = useState(0)
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([])
  const [selectedSignal, setSelectedSignal] = useState<OTCSignal | null>(null)
  const [selectedResult, setSelectedResult] = useState<TradeResult | null>(null)
  const [systemStatus, setSystemStatus] = useState<"active" | "initializing" | "error">("initializing")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("signals")

  // Refs for auto-update
  const autoUpdateRef = useRef<boolean>(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch signals
  const fetchSignals = async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch("/api/otc-signals")
      const data = await response.json()

      if (data.success) {
        setSignals(data.signals)
        setLastUpdated(new Date())
        setSystemStatus("active")

        if (data.signals.length > 0) {
          toast({
            title: "Signals Updated",
            description: `Found ${data.signals.length} trading signals`,
            variant: "success",
          })
        } else {
          toast({
            title: "No Signals Available",
            description: "No trading signals meet the criteria at this time",
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch signals",
          variant: "destructive",
        })
        setSystemStatus("error")
      }
    } catch (error) {
      console.error("Error fetching signals:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setSystemStatus("error")
    } finally {
      setLoading(false)
    }
  }

  // Copy signal to clipboard
  const copySignal = (signal: OTCSignal) => {
    navigator.clipboard.writeText(signal.message)
    toast({
      title: "Copied",
      description: "Signal copied to clipboard",
      variant: "success",
    })
  }

  // Send signal to Telegram
  const sendToTelegram = async (signal: OTCSignal) => {
    try {
      const response = await fetch("/api/otc-signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pair: signal.pair,
          sendToTelegram: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sent to Telegram",
          description: `Signal for ${signal.pair} sent to Telegram`,
          variant: "success",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send to Telegram",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending to Telegram:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Format time
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    })
  }

  // Toggle auto-update
  const toggleAutoUpdate = () => {
    autoUpdateRef.current = !autoUpdateRef.current
    toast({
      title: autoUpdateRef.current ? "Auto-Update Enabled" : "Auto-Update Disabled",
      description: autoUpdateRef.current
        ? "Signals will update automatically"
        : "Signals will not update automatically",
      variant: autoUpdateRef.current ? "success" : "default",
    })
  }

  // Initialize and set up timer
  useEffect(() => {
    // Fetch signals immediately on mount
    fetchSignals()

    // Set up timer for automatic updates
    const setupTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      timerRef.current = setInterval(() => {
        const now = new Date()
        const seconds = now.getSeconds()
        const milliseconds = now.getMilliseconds()

        // Calculate next update time (at SIGNAL_TIMING.sendSignalAtSecond of each minute)
        const nextUpdateTime = new Date(now)
        if (seconds >= SIGNAL_TIMING.sendSignalAtSecond) {
          // If we're past the signal second in the current minute, set for next minute
          nextUpdateTime.setMinutes(nextUpdateTime.getMinutes() + 1)
        }
        nextUpdateTime.setSeconds(SIGNAL_TIMING.sendSignalAtSecond)
        nextUpdateTime.setMilliseconds(0)
        setNextUpdate(nextUpdateTime)

        // Calculate countdown
        const diff = nextUpdateTime.getTime() - now.getTime()
        const totalSeconds = diff / 1000
        const countdownSeconds = Math.floor(totalSeconds % 60)
        const countdownMinutes = Math.floor((totalSeconds / 60) % 60)
        setCountdown(`${countdownMinutes.toString().padStart(2, "0")}:${countdownSeconds.toString().padStart(2, "0")}`)

        // Calculate progress percentage (inverted: 100% at start, 0% at end)
        const maxCountdown = 60 // Maximum countdown in seconds
        const progress = Math.max(0, Math.min(100, (totalSeconds / maxCountdown) * 100))
        setCountdownProgress(progress)

        // If it's time to update and auto-update is enabled, fetch signals
        if (seconds === SIGNAL_TIMING.sendSignalAtSecond && milliseconds < 200 && autoUpdateRef.current) {
          fetchSignals()
        }
      }, 100) // Update more frequently for smoother countdown
    }

    setupTimer()

    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Calculate win rate
  const calculateWinRate = () => {
    if (tradeResults.length === 0) return 0
    const wins = tradeResults.filter((result) => result.result === "Win").length
    return (wins / tradeResults.length) * 100
  }

  // Get status color
  const getStatusColor = () => {
    switch (systemStatus) {
      case "active":
        return "bg-green-500"
      case "initializing":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get strength color
  const getStrengthColor = (strength: number) => {
    if (strength >= 90) return "text-green-600 font-bold"
    if (strength >= 80) return "text-green-500"
    if (strength >= 70) return "text-yellow-600"
    return "text-gray-500"
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 dark:bg-gray-900">
      <Toaster />
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OTC Auto Signals</h1>
            <div className={`ml-3 h-3 w-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <Badge variant="outline" className="ml-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {systemStatus === "active" ? "System Active" : systemStatus === "initializing" ? "Initializing" : "Error"}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Next update: {countdown}</span>
              </div>
              <Progress value={countdownProgress} className="w-40 h-1 mt-1" />
            </div>
            <Button
              onClick={toggleAutoUpdate}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              {autoUpdateRef.current ? "Auto-Update: ON" : "Auto-Update: OFF"}
            </Button>
            <Button
              onClick={fetchSignals}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Automatically scanning 20+ OTC currency pairs every minute. Signals are generated at{" "}
          {SIGNAL_TIMING.sendSignalAtMinute}:{SIGNAL_TIMING.sendSignalAtSecond.toString().padStart(2, "0")} for entry at{" "}
          {SIGNAL_TIMING.entryAtMinute}:{SIGNAL_TIMING.entryAtSecond.toString().padStart(2, "0")}.
          {lastUpdated && <span className="ml-2 text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</span>}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="signals"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400"
          >
            Active Signals ({signals.length})
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400"
          >
            Trade Results ({tradeResults.length})
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400"
          >
            Signal Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals">
          {signals.length === 0 ? (
            <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No signals available</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Waiting for the next scan at {nextUpdate?.toLocaleTimeString() || "..."} UTC
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signals.map((signal, index) => (
                <Card
                  key={index}
                  className={`${
                    signal.direction === "BUY"
                      ? "border-green-200 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10"
                      : "border-red-200 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10"
                  } hover:shadow-md transition-shadow duration-200 shadow-sm`}
                  onClick={() => {
                    setSelectedSignal(signal)
                    setSelectedResult(null)
                    setActiveTab("details")
                  }}
                >
                  <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        {signal.pair}
                        <Badge
                          className={`ml-2 ${
                            signal.direction === "BUY"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {signal.direction}
                        </Badge>
                      </CardTitle>
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          signal.direction === "BUY" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {signal.direction === "BUY" ? (
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-gray-700 dark:text-gray-300">
                      Signal strength:{" "}
                      <span className={getStrengthColor(signal.strength)}>{signal.strength.toFixed(0)}/100</span> •{" "}
                      {formatTime(signal.timestamp)} UTC
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Market Info</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Volatility:</span>
                            <div className="text-gray-800 dark:text-gray-200">
                              {signal.marketInfo.volatility.description}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Asset Strength:</span>
                            <div className="text-gray-800 dark:text-gray-200">{signal.marketInfo.assetStrength}</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Volume:</span>
                            <div className="text-gray-800 dark:text-gray-200">{signal.marketInfo.volumeMetric}</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Sentiment:</span>
                            <div className="text-gray-800 dark:text-gray-200">
                              {signal.marketInfo.sentiment.description}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                          Technical Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Price:</span>
                            <div className="text-gray-800 dark:text-gray-200">{signal.price.toFixed(5)}</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">RSI:</span>
                            <div className="text-gray-800 dark:text-gray-200">
                              {signal.technicalIndicators.rsi.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Support:</span>
                            <div className="text-gray-800 dark:text-gray-200">{signal.levels.support.toFixed(5)}</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400">Resistance:</span>
                            <div className="text-gray-800 dark:text-gray-200">
                              {signal.levels.resistance.toFixed(5)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Entry Time</h3>
                        <p className="text-xs bg-white dark:bg-gray-700 p-2 rounded font-mono shadow-sm text-gray-800 dark:text-gray-200">
                          {formatTime(signal.entryTime)} UTC
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        copySignal(signal)
                      }}
                      variant="outline"
                      className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        sendToTelegram(signal)
                      }}
                      variant="outline"
                      className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {tradeResults.length === 0 ? (
            <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No trade results available yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Trade results will appear here after signals are executed
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-gray-900 dark:text-white">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                      {calculateWinRate().toFixed(1)}%
                    </div>
                    <Progress value={calculateWinRate()} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-gray-900 dark:text-white">Total Trades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                      {tradeResults.length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-gray-900 dark:text-white">Average P&L</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                      {(
                        tradeResults.reduce((sum, result) => sum + result.pnlPercentage, 0) / tradeResults.length
                      ).toFixed(2)}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tradeResults.map((result, index) => (
                  <Card
                    key={index}
                    className={`${
                      result.result === "Win"
                        ? "border-green-200 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10"
                        : "border-red-200 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10"
                    } hover:shadow-md transition-shadow duration-200 shadow-sm`}
                    onClick={() => {
                      setSelectedResult(result)
                      setSelectedSignal(null)
                      setActiveTab("details")
                    }}
                  >
                    <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center text-gray-900 dark:text-white">
                          {result.signal.pair}
                          <Badge
                            className={`ml-2 ${
                              result.result === "Win"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            {result.result}
                          </Badge>
                        </CardTitle>
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            result.result === "Win" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {result.result === "Win" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-gray-700 dark:text-gray-300">
                        {result.signal.direction} • P&L:{" "}
                        <span className={result.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                          {result.pnl >= 0 ? "+" : ""}
                          {result.pnlPercentage.toFixed(2)}%
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Trade Details</h3>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                              <span className="text-gray-500 dark:text-gray-400">Entry Price:</span>
                              <div className="text-gray-800 dark:text-gray-200">{result.entryPrice.toFixed(5)}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                              <span className="text-gray-500 dark:text-gray-400">Exit Price:</span>
                              <div className="text-gray-800 dark:text-gray-200">{result.exitPrice.toFixed(5)}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                              <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                              <div className="text-gray-800 dark:text-gray-200">{result.duration} seconds</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                              <span className="text-gray-500 dark:text-gray-400">RSI Change:</span>
                              <div className="text-gray-800 dark:text-gray-200">
                                {result.signal.technicalIndicators.rsi.toFixed(1)} →{" "}
                                {result.technicalAtExit.rsi.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Reason</h3>
                          <p className="text-xs bg-white dark:bg-gray-700 p-2 rounded shadow-sm text-gray-800 dark:text-gray-200">
                            {result.reason}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(result.message)
                          toast({
                            title: "Copied",
                            description: "Trade result copied to clipboard",
                            variant: "success",
                          })
                        }}
                        variant="outline"
                        className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Result
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="details">
          {selectedSignal ? (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  {selectedSignal.pair} - {selectedSignal.direction} Signal
                  <Badge className={`ml-2 ${selectedSignal.direction === "BUY" ? "bg-green-500" : "bg-red-500"}`}>
                    {selectedSignal.strength.toFixed(0)}/100
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Generated at {formatTime(selectedSignal.timestamp)} UTC • Entry at{" "}
                  {formatTime(selectedSignal.entryTime)} UTC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Market Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Price Data</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Current Price:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.price.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Support Level:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.levels.support.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Resistance Level:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.levels.resistance.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Market Conditions</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Volatility:</span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {selectedSignal.marketInfo.volatility.description} (
                              {selectedSignal.marketInfo.volatility.value.toFixed(2)}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Asset Strength:</span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {selectedSignal.marketInfo.assetStrength}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Volume Ratio:</span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {selectedSignal.marketInfo.volumeData.ratio.toFixed(2)}x average
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Technical Indicators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">RSI</h4>
                        <div className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                          {selectedSignal.technicalIndicators.rsi.toFixed(2)}
                        </div>
                        <Progress
                          value={selectedSignal.technicalIndicators.rsi}
                          className="h-2 mt-2"
                          indicatorColor={
                            selectedSignal.technicalIndicators.rsi > 70
                              ? "bg-red-500"
                              : selectedSignal.technicalIndicators.rsi < 30
                                ? "bg-green-500"
                                : undefined
                          }
                        />
                        <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                          <span>Oversold</span>
                          <span>Neutral</span>
                          <span>Overbought</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">MACD</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">MACD Line:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.technicalIndicators.macd.macd.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Signal Line:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.technicalIndicators.macd.signal.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Histogram:</span>
                            <span
                              className={`font-mono ${selectedSignal.technicalIndicators.macd.histogram > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedSignal.technicalIndicators.macd.histogram.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Moving Averages</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">EMA9:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.technicalIndicators.ema9.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">EMA21:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.technicalIndicators.ema21.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">SMA50:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedSignal.technicalIndicators.sma50.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Signal Analysis</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                        Reasons for {selectedSignal.direction} Signal
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedSignal.reasons.map((reason, index) => (
                          <li key={index} className="text-sm text-gray-800 dark:text-gray-200">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Sentiment Analysis</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Sentiment Score:</span>
                        <span
                          className={`font-medium ${
                            selectedSignal.marketInfo.sentiment.score > 0.1
                              ? "text-green-600"
                              : selectedSignal.marketInfo.sentiment.score < -0.1
                                ? "text-red-600"
                                : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {selectedSignal.marketInfo.sentiment.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Description:</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {selectedSignal.marketInfo.sentiment.description}
                        </span>
                      </div>
                      {selectedSignal.marketInfo.sentiment.keywords.length > 0 && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSignal.marketInfo.sentiment.keywords.map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => copySignal(selectedSignal)}
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Signal
                </Button>
                <Button
                  onClick={() => sendToTelegram(selectedSignal)}
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Telegram
                </Button>
              </CardFooter>
            </Card>
          ) : selectedResult ? (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  {selectedResult.signal.pair} - Trade Result
                  <Badge className={`ml-2 ${selectedResult.result === "Win" ? "bg-green-500" : "bg-red-500"}`}>
                    {selectedResult.result}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  {selectedResult.signal.direction} Signal • P&L:{" "}
                  <span className={selectedResult.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                    {selectedResult.pnl >= 0 ? "+" : ""}
                    {selectedResult.pnlPercentage.toFixed(2)}%
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Trade Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Price Action</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Entry Price:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedResult.entryPrice.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Exit Price:</span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {selectedResult.exitPrice.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Price Change:</span>
                            <span
                              className={`font-mono ${selectedResult.pnl >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedResult.pnl >= 0 ? "+" : ""}
                              {selectedResult.pnl.toFixed(5)} ({selectedResult.pnlPercentage.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Trade Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Direction:</span>
                            <span className="text-gray-800 dark:text-gray-200">{selectedResult.signal.direction}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                            <span className="text-gray-800 dark:text-gray-200">{selectedResult.duration} seconds</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Signal Strength:</span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {selectedResult.signal.strength.toFixed(0)}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Technical Changes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">RSI</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">Entry:</span>
                          <span className="font-mono text-gray-800 dark:text-gray-200">
                            {selectedResult.signal.technicalIndicators.rsi.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">Exit:</span>
                          <span className="font-mono text-gray-800 dark:text-gray-200">
                            {selectedResult.technicalAtExit.rsi.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-500 dark:text-gray-400">Change:</span>
                          <span
                            className={`font-mono ${
                              (
                                selectedResult.signal.direction === "BUY" &&
                                  selectedResult.technicalAtExit.rsi > selectedResult.signal.technicalIndicators.rsi
                              ) ||
                              (
                                selectedResult.signal.direction === "SELL" &&
                                  selectedResult.technicalAtExit.rsi < selectedResult.signal.technicalIndicators.rsi
                              )
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {selectedResult.technicalAtExit.rsi > selectedResult.signal.technicalIndicators.rsi
                              ? "+"
                              : ""}
                            {(
                              selectedResult.technicalAtExit.rsi - selectedResult.signal.technicalIndicators.rsi
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Market Factors</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">Volume Change:</span>
                          <span
                            className={`font-mono ${selectedResult.volumeChange > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {selectedResult.volumeChange > 0 ? "+" : ""}
                            {selectedResult.volumeChange.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400">Sentiment Shift:</span>
                          <span
                            className={`font-mono ${
                              (selectedResult.signal.direction === "BUY" && selectedResult.sentimentShift > 0) ||
                              (selectedResult.signal.direction === "SELL" && selectedResult.sentimentShift < 0)
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {selectedResult.sentimentShift > 0 ? "+" : ""}
                            {selectedResult.sentimentShift.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Analysis</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                        Reason for {selectedResult.result}
                      </h4>
                      <p className="text-sm mb-4 text-gray-800 dark:text-gray-200">{selectedResult.reason}</p>

                      <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Improvement Suggestions</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-800 dark:text-gray-200">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedResult.message)
                    toast({
                      title: "Copied",
                      description: "Trade result copied to clipboard",
                      variant: "success",
                    })
                  }}
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Result
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No signal or trade result selected</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Click on a signal or trade result to view details
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
