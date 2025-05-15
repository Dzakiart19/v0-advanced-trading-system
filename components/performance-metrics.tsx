"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

// Generate mock performance data
const generateDailyPerformance = (days: number) => {
  const data = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const wins = Math.floor(Math.random() * 30) + 20
    const losses = Math.floor(Math.random() * 15) + 5
    const total = wins + losses
    const winRate = (wins / total) * 100

    data.push({
      date: date.toISOString().split("T")[0],
      wins,
      losses,
      total,
      winRate: Math.round(winRate),
      profit: Math.round((wins * 0.85 - losses) * 10) / 10,
    })
  }

  return data
}

const generateHourlyPerformance = () => {
  const data = []

  for (let hour = 0; hour < 24; hour++) {
    const wins = Math.floor(Math.random() * 8) + 2
    const losses = Math.floor(Math.random() * 4) + 1
    const total = wins + losses
    const winRate = (wins / total) * 100

    data.push({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      wins,
      losses,
      total,
      winRate: Math.round(winRate),
      profit: Math.round((wins * 0.85 - losses) * 10) / 10,
    })
  }

  return data
}

const generateSymbolPerformance = () => {
  const symbols = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY"]
  const data = []

  for (const symbol of symbols) {
    const wins = Math.floor(Math.random() * 50) + 30
    const losses = Math.floor(Math.random() * 30) + 10
    const total = wins + losses
    const winRate = (wins / total) * 100

    data.push({
      symbol,
      wins,
      losses,
      total,
      winRate: Math.round(winRate),
      profit: Math.round((wins * 0.85 - losses) * 10) / 10,
    })
  }

  return data.sort((a, b) => b.winRate - a.winRate)
}

export default function PerformanceMetrics() {
  const dailyData = generateDailyPerformance(30)
  const hourlyData = generateHourlyPerformance()
  const symbolData = generateSymbolPerformance()

  // Calculate overall metrics
  const totalWins = dailyData.reduce((sum, day) => sum + day.wins, 0)
  const totalLosses = dailyData.reduce((sum, day) => sum + day.losses, 0)
  const totalTrades = totalWins + totalLosses
  const overallWinRate = Math.round((totalWins / totalTrades) * 100)
  const totalProfit = dailyData.reduce((sum, day) => sum + day.profit, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTrades}</div>
            <div className="text-sm text-gray-500">Total Trades</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{overallWinRate}%</div>
            <div className="text-sm text-gray-500">Win Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalWins}</div>
            <div className="text-sm text-gray-500">Wins</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{totalLosses}</div>
            <div className="text-sm text-gray-500">Losses</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="hourly">Hourly</TabsTrigger>
            <TabsTrigger value="symbol">By Symbol</TabsTrigger>
          </TabsList>

          <Select defaultValue="30">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="daily" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Win Rate</h3>
                <ChartContainer
                  config={{
                    winRate: {
                      label: "Win Rate",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart accessibilityLayer data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
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
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="winRate" stroke="var(--color-winRate)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Profit</h3>
                <ChartContainer
                  config={{
                    profit: {
                      label: "Profit",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart accessibilityLayer data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
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
                    <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Trades</h3>
                <ChartContainer
                  config={{
                    wins: {
                      label: "Wins",
                      color: "hsl(142, 76%, 36%)",
                    },
                    losses: {
                      label: "Losses",
                      color: "hsl(346, 84%, 61%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart accessibilityLayer data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="wins" fill="var(--color-wins)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" fill="var(--color-losses)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hourly" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Hourly Win Rate</h3>
                <ChartContainer
                  config={{
                    winRate: {
                      label: "Win Rate",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart accessibilityLayer data={hourlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="winRate" stroke="var(--color-winRate)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Hourly Trades</h3>
                <ChartContainer
                  config={{
                    wins: {
                      label: "Wins",
                      color: "hsl(142, 76%, 36%)",
                    },
                    losses: {
                      label: "Losses",
                      color: "hsl(346, 84%, 61%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart accessibilityLayer data={hourlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="wins" fill="var(--color-wins)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" fill="var(--color-losses)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="symbol" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Performance by Symbol</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Symbol</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Win Rate</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Wins</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Losses</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{item.symbol}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-purple-600 h-2.5 rounded-full"
                                style={{ width: `${item.winRate}%` }}
                              ></div>
                            </div>
                            <span>{item.winRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-green-600">{item.wins}</td>
                        <td className="py-3 px-4 text-center text-red-600">{item.losses}</td>
                        <td className="py-3 px-4 text-center">{item.total}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          <span className={item.profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {item.profit >= 0 ? "+" : ""}
                            {item.profit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
