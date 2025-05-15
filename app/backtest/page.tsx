"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Clock, Loader2, X } from "lucide-react"

export default function BacktestPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [formData, setFormData] = useState({
    symbol: "EUR/USD",
    timeframe: "M1",
    market: "OTC",
    period: 30,
    initialBalance: 1000,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const runBacktest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setResults(data.results)
      } else {
        console.error("Backtest failed:", data.error)
      }
    } catch (error) {
      console.error("Error running backtest:", error)
    } finally {
      setLoading(false)
    }
  }

  // Paginate trades
  const totalPages = results?.tradeSummary ? Math.ceil(results.tradeSummary.length / itemsPerPage) : 0
  const paginatedTrades = results?.tradeSummary
    ? results.tradeSummary.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : []

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-900">Backtest Trading Strategy</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Backtest Parameters</CardTitle>
              <CardDescription>Configure your backtest settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select value={formData.symbol} onValueChange={(value) => handleSelectChange("symbol", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                      <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                      <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                      <SelectItem value="AUD/USD">AUD/USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={formData.timeframe} onValueChange={(value) => handleSelectChange("timeframe", value)}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="market">Market</Label>
                  <Select value={formData.market} onValueChange={(value) => handleSelectChange("market", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OTC">OTC Market</SelectItem>
                      <SelectItem value="Forex">Forex</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period (Days)</Label>
                  <Input id="period" name="period" type="number" value={formData.period} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Initial Balance ($)</Label>
                  <Input
                    id="initialBalance"
                    name="initialBalance"
                    type="number"
                    value={formData.initialBalance}
                    onChange={handleInputChange}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={runBacktest}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Backtest...
                    </>
                  ) : (
                    "Run Backtest"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {results && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Backtest Results</CardTitle>
                <CardDescription>
                  Performance summary for {formData.symbol} on {formData.timeframe}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Final Balance</p>
                    <p className="text-xl font-bold">${results.finalBalance.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Profit/Loss</p>
                    <p className={`text-xl font-bold ${results.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {results.profit >= 0 ? "+" : ""}
                      {results.profit.toFixed(2)} ({results.profitPercentage.toFixed(2)}%)
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Win Rate</p>
                    <p className="text-xl font-bold">{results.winRate.toFixed(2)}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Max Drawdown</p>
                    <p className="text-xl font-bold text-red-600">{results.maxDrawdown.toFixed(2)}%</p>
                  </div>
                </div>

                <Tabs defaultValue="equity">
                  <TabsList className="mb-4">
                    <TabsTrigger value="equity">Equity Curve</TabsTrigger>
                    <TabsTrigger value="trades">Trade History</TabsTrigger>
                    <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
                  </TabsList>

                  <TabsContent value="equity" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        <ChartContainer
                          config={{
                            value: {
                              label: "Account Balance",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[300px]"
                        >
                          <AreaChart
                            accessibilityLayer
                            data={results.equity}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              }}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `$${value}`}
                              tick={{ fontSize: 12 }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="var(--color-value)"
                              fill="var(--color-value)"
                              fillOpacity={0.2}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="trades" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50 border-b">
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entry Time
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exit Time
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entry Price
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exit Price
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Profit
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Result
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedTrades.map((trade, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          trade.type === "BUY"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {trade.type === "BUY" ? (
                                          <ArrowUp className="h-3 w-3 mr-1" />
                                        ) : (
                                          <ArrowDown className="h-3 w-3 mr-1" />
                                        )}
                                        {trade.type}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm">{new Date(trade.entryTime).toLocaleString()}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm">{new Date(trade.exitTime).toLocaleString()}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="text-sm font-medium">{trade.entryPrice.toFixed(5)}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="text-sm font-medium">{trade.exitPrice.toFixed(5)}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span
                                        className={`text-sm font-medium ${trade.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                      >
                                        {trade.profit >= 0 ? "+" : ""}
                                        {trade.profit.toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          trade.result === "WIN"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {trade.result === "WIN" ? (
                                          <Check className="h-3 w-3 mr-1" />
                                        ) : (
                                          <X className="h-3 w-3 mr-1" />
                                        )}
                                        {trade.result}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
                              <div className="flex-1 flex justify-between sm:hidden">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </Button>
                              </div>

                              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                      {Math.min(currentPage * itemsPerPage, results.tradeSummary.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{results.tradeSummary.length}</span> results
                                  </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>

                                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                    let pageNumber

                                    if (totalPages <= 5) {
                                      pageNumber = i + 1
                                    } else if (currentPage <= 3) {
                                      pageNumber = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNumber = totalPages - 4 + i
                                    } else {
                                      pageNumber = currentPage - 2 + i
                                    }

                                    return (
                                      <Button
                                        key={i}
                                        variant={currentPage === pageNumber ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={currentPage === pageNumber ? "bg-purple-600" : ""}
                                      >
                                        {pageNumber}
                                      </Button>
                                    )
                                  })}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Metrics</h3>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Initial Balance</span>
                                  <span className="text-sm font-medium">${results.initialBalance.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Final Balance</span>
                                  <span className="text-sm font-medium">${results.finalBalance.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Net Profit</span>
                                  <span
                                    className={`text-sm font-medium ${results.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {results.profit >= 0 ? "+" : ""}${results.profit.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Return</span>
                                  <span
                                    className={`text-sm font-medium ${results.profitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {results.profitPercentage >= 0 ? "+" : ""}
                                    {results.profitPercentage.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Max Drawdown</span>
                                  <span className="text-sm font-medium text-red-600">
                                    {results.maxDrawdown.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Profit Factor</span>
                                  <span className="text-sm font-medium">{results.profitFactor.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Trade Statistics</h3>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Trades</span>
                                  <span className="text-sm font-medium">{results.trades}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Winning Trades</span>
                                  <span className="text-sm font-medium text-green-600">{results.wins}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Losing Trades</span>
                                  <span className="text-sm font-medium text-red-600">{results.losses}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Win Rate</span>
                                  <span className="text-sm font-medium">{results.winRate.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Average Win</span>
                                  <span className="text-sm font-medium text-green-600">
                                    $
                                    {(
                                      results.tradeSummary
                                        .filter((t) => t.result === "WIN")
                                        .reduce((sum, t) => sum + t.profit, 0) / results.wins
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Average Loss</span>
                                  <span className="text-sm font-medium text-red-600">
                                    $
                                    {Math.abs(
                                      results.tradeSummary
                                        .filter((t) => t.result === "LOSS")
                                        .reduce((sum, t) => sum + t.profit, 0) / results.losses,
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Trade Distribution</h3>
                            <div className="bg-gray-50 rounded-lg p-4 h-[calc(100%-24px)]">
                              <div className="flex flex-col h-full justify-center">
                                <div className="mb-4">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Buy Trades</span>
                                    <span className="text-sm font-medium">
                                      {results.tradeSummary.filter((t) => t.type === "BUY").length}(
                                      {(
                                        (results.tradeSummary.filter((t) => t.type === "BUY").length / results.trades) *
                                        100
                                      ).toFixed(1)}
                                      %)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="bg-green-600 h-2.5 rounded-full"
                                      style={{
                                        width: `${(results.tradeSummary.filter((t) => t.type === "BUY").length / results.trades) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Sell Trades</span>
                                    <span className="text-sm font-medium">
                                      {results.tradeSummary.filter((t) => t.type === "SELL").length}(
                                      {(
                                        (results.tradeSummary.filter((t) => t.type === "SELL").length /
                                          results.trades) *
                                        100
                                      ).toFixed(1)}
                                      %)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="bg-red-600 h-2.5 rounded-full"
                                      style={{
                                        width: `${(results.tradeSummary.filter((t) => t.type === "SELL").length / results.trades) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Winning Trades</span>
                                    <span className="text-sm font-medium">
                                      {results.wins}({results.winRate.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="bg-green-600 h-2.5 rounded-full"
                                      style={{ width: `${results.winRate}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Losing Trades</span>
                                    <span className="text-sm font-medium">
                                      {results.losses}({(100 - results.winRate).toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="bg-red-600 h-2.5 rounded-full"
                                      style={{ width: `${100 - results.winRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
