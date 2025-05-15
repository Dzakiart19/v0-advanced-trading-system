"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Clock, Copy, Info, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

type SignalDetailsProps = {
  signal: any
}

export default function SignalDetails({ signal }: SignalDetailsProps) {
  const [copied, setCopied] = useState(false)

  // Check if this is an ETHEREAL signal
  const isEtherealSignal = !signal.signal && signal.direction

  // Determine signal direction (BUY/SELL/NEUTRAL)
  const signalDirection = isEtherealSignal ? signal.direction : signal.signal

  const copyToClipboard = () => {
    let signalText = ""

    if (isEtherealSignal) {
      // Format ETHEREAL signal for clipboard
      signalText = `
        ETHEREAL SIGNAL: ${signal.direction} ${signal.pair}
        Time: ${new Date(signal.timestamp).toLocaleString()}
        Confidence: ${signal.confidence ? (signal.confidence * 100).toFixed(2) : "99.99"}%
        Timeframe: ${signal.timeframe}
        
        Quantum Resonance: ${signal.quantumResonance?.toFixed(15) || "0.999999999999999"}
        
        Cosmic Market Info:
        - Quantum Volatility: ${signal.quantumVolatility || "Hyper-fluctuating, aligned with cosmic tides"}
        - Trader Energy Field: ${signal.traderEnergyField?.toFixed(2) || "93.7"}
        - Market Sentiment: ${signal.marketSentiment?.toFixed(2) || "0.95"}
        
        Technical Overview:
        - RSI: ${signal.rsi?.toFixed(2) || "N/A"}
        - MACD: ${signal.macd?.toFixed(5) || "N/A"}
        - EMA Status: ${signal.emaStatus || "N/A"}
        
        Signal Strength: ${signal.strengthLevel || "ETHEREAL"}
      `
    } else {
      // Format regular signal for clipboard
      signalText = `
        Signal: ${signal.signal} ${signal.symbol}
        Time: ${new Date(signal.timestamp).toLocaleString()}
        Confidence: ${signal.confidence}%
        Market: ${signal.market}
        Timeframe: ${signal.timeframe}
        
        Entry: ${signal.price?.toFixed(5) || "Market Price"}
        Stop Loss: ${signal.riskManagement?.stopLoss?.toFixed(5) || "N/A"}
        Take Profit: ${signal.riskManagement?.takeProfit?.toFixed(5) || "N/A"}
        Risk/Reward: ${signal.riskManagement?.riskRewardRatio?.toFixed(2) || "N/A"}
        
        Reasons:
        ${signal.reasons ? signal.reasons.map((reason: string) => `- ${reason}`).join("\n") : "N/A"}
      `
    }

    navigator.clipboard.writeText(signalText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // If signal is undefined or null, show a placeholder
  if (!signal) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Signal Details</CardTitle>
          <CardDescription>No signal selected</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Info className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Select a signal to view details</p>
        </CardContent>
      </Card>
    )
  }

  // Render ETHEREAL signal details
  if (isEtherealSignal) {
    return (
      <Card className="w-full bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                ETHEREAL Signal Details
              </CardTitle>
              <CardDescription>Cosmic analysis of the trading signal</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? "Copied!" : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 rounded-full ${signal.direction === "BUY" ? "bg-green-100" : signal.direction === "SELL" ? "bg-red-100" : "bg-gray-100"}`}
                >
                  {signal.direction === "BUY" ? (
                    <ArrowUp className="h-6 w-6 text-green-600" />
                  ) : signal.direction === "SELL" ? (
                    <ArrowDown className="h-6 w-6 text-red-600" />
                  ) : (
                    <Info className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{signal.pair}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(signal.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div
                  className={`text-xl font-bold ${signal.direction === "BUY" ? "text-green-600" : signal.direction === "SELL" ? "text-red-600" : "text-gray-600"}`}
                >
                  {signal.direction}
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="bg-purple-100 border-purple-200">
                    ETHEREAL
                  </Badge>
                  <Badge variant="outline">{signal.timeframe}</Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium">Quantum Resonance</span>
                <span className="text-sm font-bold">{(signal.confidence * 100 || 99.99).toFixed(2)}%</span>
              </div>
              <Progress value={signal.confidence * 100 || 99.99} className={`h-2 bg-purple-100`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Strength Level</div>
                <div className="text-lg font-bold text-purple-600">{signal.strengthLevel || "ETHEREAL"}</div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">RSI</div>
                <div className="text-lg font-bold">{signal.rsi?.toFixed(2) || "N/A"}</div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Quantum VaR</div>
                <div className="text-lg font-bold">{signal.quantumVaR?.toFixed(5) || "0.00123"}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Cosmic Market Info</h4>
              <ul className="space-y-1">
                <li className="text-sm bg-purple-50 p-2 rounded">
                  <span className="font-medium">Quantum Volatility:</span>{" "}
                  {signal.quantumVolatility || "Hyper-fluctuating, aligned with cosmic tides"}
                </li>
                <li className="text-sm bg-purple-50 p-2 rounded">
                  <span className="font-medium">Trader Energy Field:</span>{" "}
                  {signal.traderEnergyField?.toFixed(2) || "93.7"}
                </li>
                <li className="text-sm bg-purple-50 p-2 rounded">
                  <span className="font-medium">Market Sentiment:</span> {signal.marketSentiment?.toFixed(2) || "0.95"}
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Transcendent Insights</h4>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">Causal Loop Score</div>
                  <div className="text-sm font-bold">
                    {signal.causalLoopScore || "Absolute forward-backward harmony"}
                  </div>
                </div>

                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">Metaconscious Feedback</div>
                  <div className="text-sm font-bold">
                    {signal.metaConsciousFeedback || "Self-optimized, transcendentally aligned"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="bg-purple-50 border-purple-200">
                View Cosmic Data
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">Execute Ethereal Trade</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render regular signal details
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Signal Details</CardTitle>
            <CardDescription>Comprehensive analysis of the trading signal</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            {copied ? "Copied!" : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-full ${signal.signal === "BUY" ? "bg-green-100" : signal.signal === "SELL" ? "bg-red-100" : "bg-gray-100"}`}
              >
                {signal.signal === "BUY" ? (
                  <ArrowUp className="h-6 w-6 text-green-600" />
                ) : signal.signal === "SELL" ? (
                  <ArrowDown className="h-6 w-6 text-red-600" />
                ) : (
                  <Info className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{signal.symbol}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(signal.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div
                className={`text-xl font-bold ${signal.signal === "BUY" ? "text-green-600" : signal.signal === "SELL" ? "text-red-600" : "text-gray-600"}`}
              >
                {signal.signal}
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline">{signal.market}</Badge>
                <Badge variant="outline">{signal.timeframe}</Badge>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm font-medium">Signal Confidence</span>
              <span className="text-sm font-bold">{signal.confidence}%</span>
            </div>
            <Progress
              value={signal.confidence}
              className={`h-2 ${signal.confidence > 75 ? "bg-green-100" : signal.confidence > 50 ? "bg-yellow-100" : "bg-red-100"}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Entry Price</div>
              <div className="text-lg font-bold">{signal.price?.toFixed(5) || "N/A"}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Stop Loss</div>
              <div className="text-lg font-bold text-red-600">
                {signal.riskManagement?.stopLoss?.toFixed(5) || "N/A"}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Take Profit</div>
              <div className="text-lg font-bold text-green-600">
                {signal.riskManagement?.takeProfit?.toFixed(5) || "N/A"}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Signal Reasons</h4>
            <ul className="space-y-1">
              {signal.reasons && signal.reasons.length > 0 ? (
                signal.reasons.map((reason: string, index: number) => (
                  <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                    {reason}
                  </li>
                ))
              ) : (
                <li className="text-sm bg-gray-50 p-2 rounded">No specific reasons provided</li>
              )}
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Technical Indicators</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">RSI</div>
                      <div
                        className={`text-sm font-bold ${signal.indicators?.rsi < 30 ? "text-green-600" : signal.indicators?.rsi > 70 ? "text-red-600" : "text-gray-700"}`}
                      >
                        {signal.indicators?.rsi?.toFixed(2) || "N/A"}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Relative Strength Index</p>
                    <p className="text-xs">{"<30: Oversold, >70: Overbought"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">MACD</div>
                      <div
                        className={`text-sm font-bold ${signal.indicators?.macd?.histogram > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {signal.indicators?.macd?.histogram?.toFixed(5) || "N/A"}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>MACD Histogram</p>
                    <p className="text-xs">{"Positive: Bullish, Negative: Bearish"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">BB Width</div>
                      <div className="text-sm font-bold">
                        {signal.indicators?.bollingerBands
                          ? (
                              ((signal.indicators.bollingerBands.upper - signal.indicators.bollingerBands.lower) /
                                signal.indicators.bollingerBands.middle) *
                              100
                            ).toFixed(2) + "%"
                          : "N/A"}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bollinger Bands Width</p>
                    <p className="text-xs">{"Wider bands indicate higher volatility"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">Volume</div>
                      <div className="text-sm font-bold">
                        {signal.indicators?.volumeAnalysis?.volumeStrength?.toFixed(0) || "N/A"}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Volume Strength</p>
                    <p className="text-xs">{"Higher values indicate stronger volume"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {signal.multiTimeframeConfirmation && (
            <div>
              <h4 className="text-sm font-medium mb-2">Multi-Timeframe Confirmation</h4>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`p-2 rounded text-center ${signal.multiTimeframeConfirmation.m5Trend === "bullish" ? "bg-green-100" : signal.multiTimeframeConfirmation.m5Trend === "bearish" ? "bg-red-100" : "bg-gray-100"}`}
                >
                  <div className="text-xs text-gray-500">M5</div>
                  <div className="text-sm font-medium capitalize">{signal.multiTimeframeConfirmation.m5Trend}</div>
                </div>

                <div
                  className={`p-2 rounded text-center ${signal.multiTimeframeConfirmation.m15Trend === "bullish" ? "bg-green-100" : signal.multiTimeframeConfirmation.m15Trend === "bearish" ? "bg-red-100" : "bg-gray-100"}`}
                >
                  <div className="text-xs text-gray-500">M15</div>
                  <div className="text-sm font-medium capitalize">{signal.multiTimeframeConfirmation.m15Trend}</div>
                </div>

                <div
                  className={`p-2 rounded text-center ${signal.multiTimeframeConfirmation.m30Trend === "bullish" ? "bg-green-100" : signal.multiTimeframeConfirmation.m30Trend === "bearish" ? "bg-red-100" : "bg-gray-100"}`}
                >
                  <div className="text-xs text-gray-500">M30</div>
                  <div className="text-sm font-medium capitalize">{signal.multiTimeframeConfirmation.m30Trend}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline">View Historical Data</Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Execute Trade</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
