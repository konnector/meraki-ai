"use client"

import type React from "react"
import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import SpreadsheetGrid from "@/components/SpreadSheet/spreadsheet-grid"
import AIAssistantPanel from "@/components/SpreadSheet/ai-assistant-panel"
import Toolbar from "@/components/SpreadSheet/toolbar"
import { FormulaBar } from "@/components/SpreadSheet/formula-bar"
import KeyboardShortcutsHelp from "@/components/SpreadSheet/keyboard-shortcuts-help"
import { ArrowLeft, Star, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SpreadsheetProvider, useSpreadsheet } from "@/context/spreadsheet-context"
import { Button } from "@/components/ui/button"
import { useSpreadsheetApi } from "@/lib/supabase/secure-api"

function LoadingSpinner() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  )
}

function SpreadsheetContent() {
  const { title, setTitle, isStarred, toggleStar, isLoading } = useSpreadsheet()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { isLoaded } = useSpreadsheetApi()

  const handleTitleClick = () => {
    setIsEditingTitle(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleTitleBlur = async () => {
    setIsEditingTitle(false)
    setIsSaving(true)
    try {
      await setTitle(title)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false)
      setIsSaving(true)
      try {
        await setTitle(title)
      } finally {
        setIsSaving(false)
      }
    } else if (e.key === "Escape") {
      setIsEditingTitle(false)
    }
  }

  if (!isLoaded || isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>

            {isEditingTitle ? (
              <Input
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="h-8 text-xl font-semibold text-gray-900 w-auto min-w-[200px]"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                onClick={handleTitleClick}
              >
                {title}
              </h1>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleStar}
              className={isStarred ? "text-yellow-400" : "text-gray-400"}
            >
              <Star className="h-5 w-5" />
            </Button>

            <span className={`text-xs ${isSaving ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 rounded-full`}>
              {isSaving ? 'Saving...' : 'Saved'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
          </div>
        </div>
        <Toolbar />
        <FormulaBar />
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <SpreadsheetGrid />
        </div>
        <AIAssistantPanel />
      </main>
    </div>
  )
}

export default function SpreadsheetPage() {
  const params = useParams()
  const spreadsheetId = typeof params?.id === 'string' ? params.id : null
  const { isLoaded } = useSpreadsheetApi()

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!spreadsheetId) {
    return <div>Invalid spreadsheet ID</div>
  }

  return (
    <SpreadsheetProvider spreadsheetId={spreadsheetId}>
      <SpreadsheetContent />
    </SpreadsheetProvider>
  )
}

