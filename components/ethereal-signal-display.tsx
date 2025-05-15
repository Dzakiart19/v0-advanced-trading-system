"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowUp, ArrowDown, Clock } from "lucide-react"

type EtherealSignalDisplayProps = {
  signal: any
}

export default function EtherealSignalDisplay({ signal }: EtherealSignalDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimeWithMilliseconds = (date: Date) => {
    // Format the time with standard options
    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    // Add milliseconds manually (up to 3 digits which is the maximum supported)
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0")
    return `${timeString}.${milliseconds}`
  }

  if (!signal) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-center text-purple-500">
            <Sparkles className="inline-block mr-2 h-5 w-5" />
            ETHEREAL TRANSCENDENT SIGNAL
          </CardTitle>
          <CardDescription className="text-center text-purple-300">No signal has been generated yet</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-purple-400" />
          </div>
          <p className="text-purple-300">Generate an ETHEREAL signal to view cosmic market insights</p>
        </CardContent>
      </Card>
    )
  }

  const signalColor =
    signal.signal === "BUY"
      ? "from-green-900/20 to-emerald-900/20 border-green-500/30"
      : signal.signal === "SELL"
        ? "from-red-900/20 to-rose-900/20 border-red-500/30"
        : "from-gray-900/20 to-slate-900/20 border-gray-500/30"

  const signalTextColor =
    signal.signal === "BUY" ? "text-green-500" : signal.signal === "SELL" ? "text-red-500" : "text-gray-500"

  const signalIcon =
    signal.signal === "BUY" ? (
      <ArrowUp className={`h-6 w-6 ${signalTextColor}`} />
    ) : signal.signal === "SELL" ? (
      <ArrowDown className={`h-6 w-6 ${signalTextColor}`} />
    ) : (
      <Clock className={`h-6 w-6 ${signalTextColor}`} />
    )

  return (
    <Card className={`bg-gradient-to-br ${signalColor}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Badge
            variant="outline"
            className={`px-3 py-1 ${
              signal.signal === "BUY"
                ? "bg-green-500/10 text-green-500 border-green-500/30"
                : signal.signal === "SELL"
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-gray-500/10 text-gray-500 border-gray-500/30"
            }`}
          >
            {signal.timeframe} • {signal.market}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-purple-500/10 text-purple-500 border-purple-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            ETHEREAL
          </Badge>
        </div>
        <CardTitle className="text-center mt-2 flex items-center justify-center">
          <span className={`text-2xl font-bold ${signalTextColor} mr-2`}>{signal.symbol}</span>
          {signalIcon}
          <span className={`text-2xl font-bold ${signalTextColor} ml-2`}>{signal.signal}</span>
        </CardTitle>
        <CardDescription className="text-center">
          Quantum Resonance: {signal.quantumResonance?.toFixed(15) || "0.999999999999999"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-black/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white">Signal Details</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
