"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Bell, Clock, DollarSign, LineChart, MessageSquare, Settings } from "lucide-react"

export default function TelegramNotificationSettings() {
  const [notificationSettings, setNotificationSettings] = useState({
    tradingSignals: true,
    performanceReports: true,
    systemAlerts: true,
    marketUpdates: false,
    riskAlerts: true,
    dailySummary: true,
  })

  const [reportFrequency, setReportFrequency] = useState("daily")
  const [signalThreshold, setSignalThreshold] = useState(70)
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: "22:00",
    end: "08:00",
  })

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleQuietHoursToggle = () => {
    setQuietHours((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }))
  }

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, you would save these settings to a database
      // and update the Telegram bot configuration

      // For demonstration, we'll just show a success toast
      toast({
        title: "Notification Settings Saved",
        description: "Your Telegram notification preferences have been updated",
        variant: "success",
      })

      // Send a notification to Telegram about the updated settings
      await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `
📱 *Notification Settings Updated*

Your notification preferences have been updated:

- Trading Signals: ${notificationSettings.tradingSignals ? "✅" : "❌"}
- Performance Reports: ${notificationSettings.performanceReports ? "✅" : "❌"}
- System Alerts: ${notificationSettings.systemAlerts ? "✅" : "❌"}
- Market Updates: ${notificationSettings.marketUpdates ? "✅" : "❌"}
- Risk Alerts: ${notificationSettings.riskAlerts ? "✅" : "❌"}
- Daily Summary: ${notificationSettings.dailySummary ? "✅" : "❌"}

Report Frequency: ${reportFrequency.charAt(0).toUpperCase() + reportFrequency.slice(1)}
Signal Confidence Threshold: ${signalThreshold}%
Quiet Hours: ${quietHours.enabled ? `${quietHours.start} - ${quietHours.end}` : "Disabled"}
          `,
          chatId: "7390867903",
          botToken: "7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58",
        }),
      })
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Notification Settings</CardTitle>
        <CardDescription>Customize your Telegram notifications and alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="trading-signals" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span>Trading Signals</span>
              </Label>
              <Switch
                id="trading-signals"
                checked={notificationSettings.tradingSignals}
                onCheckedChange={() => handleNotificationToggle("tradingSignals")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="performance-reports" className="flex items-center space-x-2">
                <LineChart className="h-4 w-4 text-purple-600" />
                <span>Performance Reports</span>
              </Label>
              <Switch
                id="performance-reports"
                checked={notificationSettings.performanceReports}
                onCheckedChange={() => handleNotificationToggle("performanceReports")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="system-alerts" className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-purple-600" />
                <span>System Alerts</span>
              </Label>
              <Switch
                id="system-alerts"
                checked={notificationSettings.systemAlerts}
                onCheckedChange={() => handleNotificationToggle("systemAlerts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="market-updates" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span>Market Updates</span>
              </Label>
              <Switch
                id="market-updates"
                checked={notificationSettings.marketUpdates}
                onCheckedChange={() => handleNotificationToggle("marketUpdates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="risk-alerts" className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-purple-600" />
                <span>Risk Alerts</span>
              </Label>
              <Switch
                id="risk-alerts"
                checked={notificationSettings.riskAlerts}
                onCheckedChange={() => handleNotificationToggle("riskAlerts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="daily-summary" className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span>Daily Summary</span>
              </Label>
              <Switch
                id="daily-summary"
                checked={notificationSettings.dailySummary}
                onCheckedChange={() => handleNotificationToggle("dailySummary")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Preferences</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-frequency">Report Frequency</Label>
              <Select value={reportFrequency} onValueChange={setReportFrequency}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="signal-threshold">Signal Confidence Threshold (%)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Slider
                  id="signal-threshold"
                  min={0}
                  max={100}
                  step={5}
                  value={[signalThreshold]}
                  onValueChange={(value) => setSignalThreshold(value[0])}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">{signalThreshold}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Only receive signals with confidence above this threshold</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours">Quiet Hours</Label>
                <Switch id="quiet-hours" checked={quietHours.enabled} onCheckedChange={handleQuietHoursToggle} />
              </div>

              {quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={quietHours.start}
                      onChange={(e) => setQuietHours((prev) => ({ ...prev, start: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={quietHours.end}
                      onChange={(e) => setQuietHours((prev) => ({ ...prev, end: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">No notifications will be sent during quiet hours</p>
            </div>
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="w-full bg-purple-600 hover:bg-purple-700">
          Save Notification Settings
        </Button>
      </CardContent>
    </Card>
  )
}
