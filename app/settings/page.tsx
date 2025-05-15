"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import TelegramBot from "@/components/telegram-bot"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import TelegramNotificationSettings from "@/components/telegram-notification-settings"

export default function SettingsPage() {
  const [riskPerTrade, setRiskPerTrade] = useState(2)
  const [autoTrade, setAutoTrade] = useState(false)
  const [signalDelay, setSignalDelay] = useState(15)
  const [apiKey, setApiKey] = useState("")
  const [dataProvider, setDataProvider] = useState("alpha-vantage")
  const [indicatorSettings, setIndicatorSettings] = useState({
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    emaPeriod: 50,
    bollingerPeriod: 20,
    bollingerDeviation: 2,
  })

  const handleSaveGeneralSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your general settings have been saved successfully",
      variant: "success",
    })
  }

  const handleSaveIndicatorSettings = () => {
    toast({
      title: "Indicator Settings Saved",
      description: "Your technical indicator settings have been saved successfully",
      variant: "success",
    })
  }

  const handleSaveAPISettings = () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key for the selected data provider",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "API Settings Saved",
      description: "Your API settings have been saved successfully",
      variant: "success",
    })
  }

  const handleIndicatorChange = (key: keyof typeof indicatorSettings, value: number) => {
    setIndicatorSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-900">System Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="api">API & Data</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="risk-per-trade">Risk Per Trade (%)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        id="risk-per-trade"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={[riskPerTrade]}
                        onValueChange={(value) => setRiskPerTrade(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-center font-medium">{riskPerTrade}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Percentage of account balance to risk on each trade</p>
                  </div>

                  <div>
                    <Label htmlFor="signal-delay">Signal Notification Delay (seconds)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        id="signal-delay"
                        min={5}
                        max={30}
                        step={5}
                        value={[signalDelay]}
                        onValueChange={(value) => setSignalDelay(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-center font-medium">{signalDelay}s</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Time before the minute to send signal notifications</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-trade">Auto Trading</Label>
                      <p className="text-xs text-gray-500">Automatically execute trades based on signals</p>
                    </div>
                    <Switch id="auto-trade" checked={autoTrade} onCheckedChange={setAutoTrade} />
                  </div>

                  <div>
                    <Label htmlFor="default-market">Default Market</Label>
                    <Select defaultValue="OTC">
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select default market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OTC">OTC Market</SelectItem>
                        <SelectItem value="Forex">Forex</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                        <SelectItem value="Stocks">Stocks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="default-timeframe">Default Timeframe</Label>
                    <Select defaultValue="M1">
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select default timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M1">M1 (1 Minute)</SelectItem>
                        <SelectItem value="M5">M5 (5 Minutes)</SelectItem>
                        <SelectItem value="M15">M15 (15 Minutes)</SelectItem>
                        <SelectItem value="M30">M30 (30 Minutes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveGeneralSettings} className="bg-purple-600 hover:bg-purple-700">
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indicators" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Technical Indicator Settings</CardTitle>
                <CardDescription>Configure parameters for technical indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">RSI Settings</h3>
                    <div>
                      <Label htmlFor="rsi-period">RSI Period</Label>
                      <Input
                        id="rsi-period"
                        type="number"
                        value={indicatorSettings.rsiPeriod}
                        onChange={(e) => handleIndicatorChange("rsiPeriod", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rsi-overbought">Overbought Level</Label>
                      <Input
                        id="rsi-overbought"
                        type="number"
                        value={indicatorSettings.rsiOverbought}
                        onChange={(e) => handleIndicatorChange("rsiOverbought", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rsi-oversold">Oversold Level</Label>
                      <Input
                        id="rsi-oversold"
                        type="number"
                        value={indicatorSettings.rsiOversold}
                        onChange={(e) => handleIndicatorChange("rsiOversold", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">MACD Settings</h3>
                    <div>
                      <Label htmlFor="macd-fast">Fast Period</Label>
                      <Input
                        id="macd-fast"
                        type="number"
                        value={indicatorSettings.macdFast}
                        onChange={(e) => handleIndicatorChange("macdFast", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="macd-slow">Slow Period</Label>
                      <Input
                        id="macd-slow"
                        type="number"
                        value={indicatorSettings.macdSlow}
                        onChange={(e) => handleIndicatorChange("macdSlow", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="macd-signal">Signal Period</Label>
                      <Input
                        id="macd-signal"
                        type="number"
                        value={indicatorSettings.macdSignal}
                        onChange={(e) => handleIndicatorChange("macdSignal", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">EMA Settings</h3>
                    <div>
                      <Label htmlFor="ema-period">EMA Period</Label>
                      <Input
                        id="ema-period"
                        type="number"
                        value={indicatorSettings.emaPeriod}
                        onChange={(e) => handleIndicatorChange("emaPeriod", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bollinger Bands Settings</h3>
                    <div>
                      <Label htmlFor="bollinger-period">Period</Label>
                      <Input
                        id="bollinger-period"
                        type="number"
                        value={indicatorSettings.bollingerPeriod}
                        onChange={(e) => handleIndicatorChange("bollingerPeriod", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bollinger-deviation">Standard Deviation</Label>
                      <Input
                        id="bollinger-deviation"
                        type="number"
                        value={indicatorSettings.bollingerDeviation}
                        onChange={(e) => handleIndicatorChange("bollingerDeviation", Number.parseInt(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveIndicatorSettings} className="bg-purple-600 hover:bg-purple-700">
                  Save Indicator Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>API & Data Settings</CardTitle>
                <CardDescription>Configure market data providers and API keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="data-provider">Market Data Provider</Label>
                    <Select value={dataProvider} onValueChange={setDataProvider}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select data provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alpha-vantage">Alpha Vantage</SelectItem>
                        <SelectItem value="twelve-data">Twelve Data</SelectItem>
                        <SelectItem value="finnhub">Finnhub</SelectItem>
                        <SelectItem value="polygon">Polygon.io</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">API key for the selected market data provider</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Real-time Data</Label>
                      <p className="text-xs text-gray-500">Use real-time data instead of delayed data</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div>
                    <Label htmlFor="update-frequency">Data Update Frequency</Label>
                    <Select defaultValue="1s">
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select update frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1s">Every Second</SelectItem>
                        <SelectItem value="5s">Every 5 Seconds</SelectItem>
                        <SelectItem value="10s">Every 10 Seconds</SelectItem>
                        <SelectItem value="30s">Every 30 Seconds</SelectItem>
                        <SelectItem value="1m">Every Minute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveAPISettings} className="bg-purple-600 hover:bg-purple-700">
                  Save API Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TelegramBot />
              <TelegramNotificationSettings />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
