"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Clock, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SignalTableProps = {
  signals: any[]
  onSelectSignal: (signal: any) => void
}

export default function SignalTable({ signals, onSelectSignal }: SignalTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMarket, setFilterMarket] = useState("all")
  const [filterResult, setFilterResult] = useState("all")

  const itemsPerPage = 10

  // Filter signals based on search and filters
  const filteredSignals = signals.filter((signal) => {
    const matchesSearch = signal.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMarket = filterMarket === "all" || signal.market === filterMarket
    const matchesResult = filterResult === "all" || signal.result === filterResult

    return matchesSearch && matchesMarket && matchesResult
  })

  // Paginate signals
  const totalPages = Math.ceil(filteredSignals.length / itemsPerPage)
  const paginatedSignals = filteredSignals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search symbol..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Select value={filterMarket} onValueChange={setFilterMarket}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="OTC">OTC</SelectItem>
              <SelectItem value="Forex">Forex</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="WIN">Wins</SelectItem>
              <SelectItem value="LOSS">Losses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeframe
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSignals.map((signal, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{formatTime(signal.timestamp)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium">{signal.symbol}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm">{signal.market}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        signal.signal === "BUY"
                          ? "bg-green-100 text-green-800"
                          : signal.signal === "SELL"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {signal.signal === "BUY" ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : signal.signal === "SELL" ? (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {signal.signal}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm">{signal.timeframe}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            signal.confidence > 75
                              ? "bg-green-600"
                              : signal.confidence > 50
                                ? "bg-yellow-500"
                                : "bg-red-600"
                          }`}
                          style={{ width: `${signal.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{signal.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        signal.result === "WIN"
                          ? "bg-green-100 text-green-800"
                          : signal.result === "LOSS"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {signal.result === "WIN" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : signal.result === "LOSS" ? (
                        <X className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {signal.result || "PENDING"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => onSelectSignal(signal)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}

              {paginatedSignals.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No signals found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
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
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSignals.length)}</span> of{" "}
                  <span className="font-medium">{filteredSignals.length}</span> results
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
    </div>
  )
}
