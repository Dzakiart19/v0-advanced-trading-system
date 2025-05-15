import Link from "next/link"
import { ArrowRight, BarChart3, Clock, Cpu, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gradient-to-r from-purple-900 to-indigo-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Advanced AI Trading Signal System</h1>
            <p className="text-xl text-purple-100 max-w-3xl">
              High-precision auto trading signals for Pocket Option with AI-powered analysis and real-time execution
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Link href="/dashboard">
                  Launch Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Cpu className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>AI-Powered Analysis</CardTitle>
                  <CardDescription>
                    Advanced machine learning algorithms analyze market patterns and predict movements with high
                    accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Real-time data processing</li>
                    <li>Adaptive learning from past signals</li>
                    <li>Multi-indicator strategy optimization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>Precision Timing</CardTitle>
                  <CardDescription>
                    Signals delivered with perfect timing for optimal entry at second 00 of each minute
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>High-frequency trading analysis</li>
                    <li>Signals delivered 15 seconds before execution</li>
                    <li>Market-specific timing optimization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>Multi-Timeframe Validation</CardTitle>
                  <CardDescription>
                    Signals validated across multiple timeframes to ensure alignment with broader market trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>M1, M5, M15, and M30 analysis</li>
                    <li>Trend confirmation across timeframes</li>
                    <li>Reduced false signals</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>Advanced Risk Management</CardTitle>
                  <CardDescription>
                    Dynamic risk assessment and position sizing based on market volatility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Dynamic stop loss & take profit</li>
                    <li>Smart position sizing</li>
                    <li>Hedging & scalping strategies</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <svg
                    className="h-10 w-10 text-purple-600 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8V12L15 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <CardTitle>OTC Market Optimization</CardTitle>
                  <CardDescription>Specialized strategies for OTC markets with volatility control</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>OTC-specific pattern recognition</li>
                    <li>Volatility-based signal filtering</li>
                    <li>Trend reversal detection</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <svg
                    className="h-10 w-10 text-purple-600 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 8V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H14C14.5304 21 15.0391 20.7893 15.4142 20.4142C15.7893 20.0391 16 19.5304 16 19V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 12H21M21 12L18 9M21 12L18 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <CardTitle>Telegram Integration</CardTitle>
                  <CardDescription>Secure and instant signal delivery via Telegram</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>End-to-end encrypted communication</li>
                    <li>Real-time signal notifications</li>
                    <li>Performance reports and analytics</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Trading?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Get started with our advanced AI-powered trading signal system and experience the difference that
              precision, speed, and intelligence can make.
            </p>
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Link href="/dashboard">
                Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Advanced Trading Signal System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
