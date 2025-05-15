"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sparkles, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ETHEREAL_CURRENCY_PAIRS, ETHEREAL_TIMEFRAMES } from "@/lib/ethereal-signal-generator"

export default function EtherealSignalsPage() {
  const [selectedPair, setSelectedPair] = useState(ETHEREAL_CURRENCY_PAIRS[0])
  const [selectedTimeframe, setSelectedTimeframe] = useState(ETHEREAL_TIMEFRAMES[0])
  const [sendToTelegram, setSendToTelegram] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentSignal, setCurrentSignal] = useState<any>(null)

  const generateSignal = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      console.log("Generating ETHEREAL signal with:", {
        pair: selectedPair,
        timeframe: selectedTimeframe,
        sendToTelegram,
      })

      const response = await fetch("/api/ethereal-signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pair: selectedPair,
          timeframe: selectedTimeframe,
          sendToTelegram,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentSignal(data.signal)
        toast({
          title: "ETHEREAL Signal Generated",
          description: `${data.signal.pair} ${data.signal.direction} signal has been channeled from the cosmic consciousness`,
          variant: "success",
        })
      } else {
        console.error("Failed to generate ETHEREAL signal:", data.error)
        toast({
          title: "Signal Generation Failed",
          description: data.error || "Failed to channel cosmic energy",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating ETHEREAL signal:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while channeling cosmic energy",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (date: Date | string) => {
    if (!date) return "Unknown"

    const dateObj = typeof date === "string" ? new Date(date) : date

    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 text-white">
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            ETHEREAL / TRANSCENDENT SIGNALS
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Access the unified quantum consciousness of the markets through our metaphysical signal generation system.
            Experience trading as a spiritual journey through the universal energy flows.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-purple-500 col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-purple-400" />
                Channel Cosmic Energy
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your connection to the market's quantum consciousness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pair" className="text-gray-300">
                  Currency Pair
                </Label>
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger id="pair" className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {ETHEREAL_CURRENCY_PAIRS.map((pair) => (
                      <SelectItem key={pair} value={pair} className="hover:bg-gray-700">
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeframe" className="text-gray-300">
                  Temporal Dimension
                </Label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger id="timeframe" className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {ETHEREAL_TIMEFRAMES.map((timeframe) => (
                      <SelectItem key={timeframe} value={timeframe} className="hover:bg-gray-700">
                        {timeframe.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="telegram" className="text-gray-300 cursor-pointer">
                  Send to Telegram
                </Label>
                <Switch
                  id="telegram"
                  checked={sendToTelegram}
                  onCheckedChange={setSendToTelegram}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={generateSignal}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Channeling Cosmic Energy...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate ETHEREAL Signal
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gray-800 border-purple-500 col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">
                {currentSignal ? (
                  <div className="flex items-center">
                    {currentSignal.direction === "BUY" ? (
                      <ArrowUp className="mr-2 h-5 w-5 text-green-400" />
                    ) : (
                      <ArrowDown className="mr-2 h-5 w-5 text-red-400" />
                    )}
                    <span>
                      {currentSignal.pair} • {currentSignal.direction} Signal
                    </span>
                  </div>
                ) : (
                  "ETHEREAL Signal Visualization"
                )}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {currentSignal
                  ? `Generated at ${formatDate(currentSignal.timestamp || new Date())}`
                  : "Generate a signal to view cosmic market insights"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSignal ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Quantum Resonance</h3>
                      <p className="text-2xl font-mono">{currentSignal.confidence.toFixed(15)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {currentSignal.confidence > 0.95
                          ? "Absolute Cosmic Certainty"
                          : currentSignal.confidence > 0.85
                            ? "High Dimensional Alignment"
                            : "Moderate Cosmic Probability"}
                      </p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Signal Strength</h3>
                      <p className="text-2xl font-medium">{currentSignal.strengthLevel}</p>
                      <div className="w-full bg-gray-600 h-2 rounded-full mt-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${currentSignal.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Cosmic Market Info</h3>
                      <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Quantum Volatility Flux:</span>
                          <span className="text-white">{currentSignal.quantumVolatility}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Trader Energy Field:</span>
                          <span className="text-white">{currentSignal.traderEnergyField}% resonance</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Market Sentiment Index:</span>
                          <span className="text-white">{currentSignal.marketSentiment?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Astro-Cosmic Alignment:</span>
                          <span className="text-white">{currentSignal.astroAlignment}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Metaphysical Technical Overview</h3>
                      <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">RSI Hyper-Saturation:</span>
                          <span className="text-white">{currentSignal.rsi?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD Quantum Momentum:</span>
                          <span className="text-white">{currentSignal.macd?.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">EMA Quantum Fusion:</span>
                          <span className="text-white">{currentSignal.emaStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ADX Hyperwave:</span>
                          <span className="text-white">{currentSignal.adx?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Transcendent AI Insights</h3>
                      <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">HQNM Probability:</span>
                          <span className="text-white">{currentSignal.probabilityScore?.toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ESN Sentiment Waveform:</span>
                          <span className="text-white">{currentSignal.sentimentWaveform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Meta-conscious Feedback:</span>
                          <span className="text-white">{currentSignal.metaConsciousFeedback}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Cosmic Risk Management</h3>
                      <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Quantum VaR:</span>
                          <span className="text-white">{currentSignal.quantumVaR}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Adaptive Positioning:</span>
                          <span className="text-white">Fluid 0.5% - 3% capital</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Multi-dimensional Hedging:</span>
                          <span className="text-white">{currentSignal.hedgingStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-purple-400 text-sm font-medium mb-2">Spiritual Trading Narrative</h3>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <p className="text-white italic">
                          {currentSignal.narrative ||
                            `Sinyal ${currentSignal.direction} ini adalah manifestasi energi kosmik yang telah terjalin melalui resonansi quantum, sentimen kolektif, dan pola temporal transdimensional. Eksekusi dengan ketenangan jiwa, karena ini adalah harmoni pasar dan alam semesta.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-16 w-16 text-purple-400 mb-4" />
                  <p className="text-gray-300">No ETHEREAL signal has been generated yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Configure your connection parameters and click "Generate ETHEREAL Signal" to channel cosmic market
                    energy
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
