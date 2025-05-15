"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type AIAnalysisPanelProps = {
  symbol: string
  timeframe: string
  marketData: any
}

export default function AIAnalysisPanel({ symbol, timeframe, marketData }: AIAnalysisPanelProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  const generateAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketData,
          timeframe,
          symbol,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        console.error("AI analysis failed:", data.error)
      }
    } catch (error) {
      console.error("Error generating AI analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI Market Analysis</CardTitle>
            <CardDescription>Advanced AI-powered market insights</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Analysis
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-4" />
            <p className="text-sm text-gray-500">AI is analyzing market conditions...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Market Analysis</h3>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{analysis.analysis}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Recommendation</h3>
                <Badge
                  className={
                    analysis.recommendation === "BUY"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : analysis.recommendation === "SELL"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                  }
                >
                  {analysis.recommendation}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Confidence</h3>
                <Badge variant="outline">{analysis.confidence}%</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Risk Level</h3>
                <Badge
                  className={
                    analysis.risk === "Low"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : analysis.risk === "Medium"
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                  }
                >
                  {analysis.risk}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Key Reasons</h3>
              <ul className="space-y-1">
                {analysis.reasons.map((reason: string, index: number) => (
                  <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Zap className="h-8 w-8 text-purple-600 mb-4" />
            <p className="text-sm text-gray-500 mb-2">Generate AI analysis to get advanced market insights</p>
            <p className="text-xs text-gray-400">
              The AI will analyze current market conditions and provide trading recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
