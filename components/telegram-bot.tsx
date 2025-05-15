"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function TelegramBot() {
  // Update the initial state to include the provided credentials
  const [botToken] = useState("7917653006:AAGB-KQZeI5E_CcQxvu67eMCfeI92byuh58")
  const [chatId] = useState("7390867903")
  const [isConnected] = useState(true) // Always connected
  const [notifications, setNotifications] = useState({
    signals: true,
    performance: true,
    marketAlerts: true,
    systemStatus: true,
  })
  const [testMessage, setTestMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting">("connected")

  // Auto-connect on component mount
  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout

    const verifyConnection = async () => {
      try {
        const response = await fetch("/api/telegram/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            botToken,
            chatId,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setConnectionStatus("connected")
          console.log("Telegram connection verified")
        } else {
          setConnectionStatus("reconnecting")
          console.error("Telegram connection verification failed:", data.error)
        }
      } catch (error) {
        setConnectionStatus("reconnecting")
        console.error("Error verifying Telegram connection:", error)
      }
    }

    // Verify connection immediately
    verifyConnection()

    // Set up periodic connection verification
    reconnectInterval = setInterval(verifyConnection, 60000) // Check every minute

    // Send initial connection message
    fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          "🤖 *Trading Signal Bot Connected*\n\nYour Auto Signal Trading system is now connected to Telegram. You will receive real-time trading signals and notifications.\n\nType /help to see available commands.",
        chatId: chatId,
        botToken: botToken,
      }),
    })

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval)
      }
    }
  }, [botToken, chatId])

  const handleSendTestMessage = async () => {
    if (!testMessage) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: testMessage,
          chatId: chatId,
          botToken: botToken,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Test Message Sent",
          description: "Your test message has been sent successfully",
          variant: "success",
        })
        setTestMessage("")
      } else {
        toast({
          title: "Failed to Send Message",
          description: data.error || "An error occurred while sending the message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending test message:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const toggleNotification = (type: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Bot Integration</CardTitle>
        <CardDescription>Configure your Telegram bot for signal notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Connection Status</h3>
                <p className="text-sm text-gray-500">Your Telegram bot is automatically connected</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">
                  {connectionStatus === "connected" ? "Connected" : "Reconnecting..."}
                </span>
              </div>
            </div>

            <div className="rounded-md bg-green-50 p-4 border border-green-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Bot Credentials</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Bot Token: •••••••••••••••••••••••••••••••</p>
                    <p>Chat ID: {chatId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Notification Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="signals-notification" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Trading Signals</span>
                </Label>
                <Switch
                  id="signals-notification"
                  checked={notifications.signals}
                  onCheckedChange={() => toggleNotification("signals")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="performance-notification" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Performance Reports</span>
                </Label>
                <Switch
                  id="performance-notification"
                  checked={notifications.performance}
                  onCheckedChange={() => toggleNotification("performance")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="market-notification" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Market Alerts</span>
                </Label>
                <Switch
                  id="market-notification"
                  checked={notifications.marketAlerts}
                  onCheckedChange={() => toggleNotification("marketAlerts")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="system-notification" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>System Status</span>
                </Label>
                <Switch
                  id="system-notification"
                  checked={notifications.systemStatus}
                  onCheckedChange={() => toggleNotification("systemStatus")}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Send Test Message</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter a test message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
              <Button onClick={handleSendTestMessage} disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
