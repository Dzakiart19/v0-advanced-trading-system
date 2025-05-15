"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from "lucide-react"

// Generate mock market data
const generateMarketData = () => {
  const symbols = [
    { name: "EUR/USD", market: "OTC", category: "Major" },
    { name: "GBP/USD", market: "OTC", category: "Major" },
    { name: "USD/JPY", market: "OTC", category: "Major" },
    { name: "AUD/USD", market: "OTC", category: "Major" },
    { name: "USD/CAD", market: "OTC", category: "Major" },
    { name: "NZD/USD", market: "OTC", category: "Major" },
    { name: "EUR/GBP", market: "OTC", category: "Cross" },
    { name: "EUR/JPY", market: "OTC", category: "Cross" },
    { name: "GBP/JPY", market: "OTC", category: "Cross" },
    { name: "AUD/JPY", market: "OTC", category: "Cross" },
    { name: "BTC/USD", market: "Crypto", category: "Crypto" },
    { name: "ETH/USD", market: "Crypto", category: "Crypto" },
  ]

  return symbols.map((symbol) => {
    const price = (Math.random() * 10).toFixed(symbol.name.includes("/JPY") ? 3 : 5)
    const change = (Math.random() * 2 - 1).toFixed(3)
    const changePercent = (Math.random() * 4 - 2).toFixed(2)
    const trend = Math.random() > 0.5 ? "up" : "down"
    const strength = Math.floor(Math.random() * 100)
    const volatility = Math.floor(Math.random() * 100)
    const signalQuality = Math.floor(Math.random() * 100)

    return {
      ...symbol,
      price,
      change,
      changePercent,
      trend,
      strength,
      volatility,
      signalQuality,
    }
  })
}

export default function MarketOverview() {
  const [marketData] = useState(generateMarketData())

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Markets</TabsTrigger>
          <TabsTrigger value="otc">OTC</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData.map((item, index) => (
              <MarketCard key={index} data={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="otc" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData
              .filter((item) => item.market === "OTC")
              .map((item, index) => (
                <MarketCard key={index} data={item} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData
              .filter((item) => item.market === "Crypto")
              .map((item, index) => (
                <MarketCard key={index} data={item} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MarketCard({ data }: { data: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold">{data.name}</h3>
            <p className="text-sm text-gray-500">
              {data.market} • {data.category}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{data.price}</p>
            <p
              className={`text-sm flex items-center justify-end ${
                Number.parseFloat(data.change) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {Number.parseFloat(data.change) >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Number.parseFloat(data.change) >= 0 ? "+" : ""}
              {data.change} ({data.changePercent}%)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500 mb-1">Trend</p>
            <div className="flex items-center">
              {data.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${data.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {data.trend === "up" ? "Bullish" : "Bearish"}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500 mb-1">Strength</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                <div
                  className={`h-1.5 rounded-full ${
                    data.strength > 66 ? "bg-green-600" : data.strength > 33 ? "bg-yellow-500" : "bg-red-600"
                  }`}
                  style={{ width: `${data.strength}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{data.strength}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500 mb-1">Volatility</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                <div
                  className={`h-1.5 rounded-full ${
                    data.volatility > 66 ? "bg-red-600" : data.volatility > 33 ? "bg-yellow-500" : "bg-green-600"
                  }`}
                  style={{ width: `${data.volatility}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{data.volatility}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Signal Quality</p>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
              <div
                className={`h-2 rounded-full ${
                  data.signalQuality > 75
                    ? "bg-green-600"
                    : data.signalQuality > 50
                      ? "bg-yellow-500"
                      : data.signalQuality > 25
                        ? "bg-orange-500"
                        : "bg-red-600"
                }`}
                style={{ width: `${data.signalQuality}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{data.signalQuality}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
