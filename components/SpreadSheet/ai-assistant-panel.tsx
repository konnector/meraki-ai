"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Sparkles, Maximize2, Minimize2 } from "lucide-react"
import { useSpreadsheet } from "@/context/spreadsheet-context"


export default function AIAssistantPanel() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { cells, updateCell } = useSpreadsheet()

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setResponse("")

    // Simulate AI response
    setTimeout(() => {
      // Example response - in a real app, this would come from an API call
      const aiResponse =
        "I've analyzed your spreadsheet and created a basic budget template. I've added income categories in column A, expense categories in column B, and formulas to calculate totals in column C."
      setResponse(aiResponse)

      // Example of AI modifying the spreadsheet
      updateCell("A1", "Category")
      updateCell("B1", "Amount")
      updateCell("C1", "Total")
      updateCell("A2", "Income")
      updateCell("A3", "Salary")
      updateCell("A4", "Investments")
      updateCell("A5", "Other")
      updateCell("A7", "Expenses")
      updateCell("A8", "Housing")
      updateCell("A9", "Food")
      updateCell("A10", "Transportation")
      updateCell("A11", "Entertainment")
      updateCell("B3", "5000")
      updateCell("B4", "1000")
      updateCell("B5", "500")
      updateCell("B8", "1500")
      updateCell("B9", "800")
      updateCell("B10", "400")
      updateCell("B11", "300")
      updateCell("C3", "=B3")
      updateCell("C4", "=B4")
      updateCell("C5", "=B5")
      updateCell("C6", "=SUM(C3:C5)")
      updateCell("C8", "=B8")
      updateCell("C9", "=B9")
      updateCell("C10", "=B10")
      updateCell("C11", "=B11")
      updateCell("C12", "=SUM(C8:C11)")
      updateCell("A14", "Net Income")
      updateCell("C14", "=C6-C12")

      setIsLoading(false)
    }, 2000)
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-md bg-white">
          <Sparkles className="h-5 w-5 text-gray-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className={`p-0 ${isExpanded ? "w-[600px] sm:w-[600px]" : "w-[350px] sm:w-[350px]"}`}>
        <SheetHeader className="px-4 py-3 border-b border-gray-200 flex flex-row items-center justify-between">
          <SheetTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-700" />
            AI Assistant
          </SheetTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleExpand}>
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-56px)]">
          <div className="flex-1 overflow-auto p-4">
            {response && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700">{response}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Ask AI to help with your spreadsheet..."
                className="min-h-[80px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                {isLoading ? "Processing..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

