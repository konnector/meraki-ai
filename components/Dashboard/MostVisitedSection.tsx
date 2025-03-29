"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSpreadsheetApi } from "@/lib/supabase/secure-api"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface MostVisitedItem {
  spreadsheet_id: string
  visit_count: number
  last_visited: string
  spreadsheets: {
    id: string
    title: string
  }
}

export function MostVisitedSection() {
  const { getMostVisitedSpreadsheets, isLoaded, isSignedIn } = useSpreadsheetApi()
  const [mostVisited, setMostVisited] = useState<MostVisitedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [attemptedLoad, setAttemptedLoad] = useState(false)

  useEffect(() => {
    // Only attempt to load data when auth is ready and only once
    if (isLoaded && isSignedIn && !attemptedLoad) {
      setAttemptedLoad(true) // Prevent infinite loop
      
      async function loadMostVisited() {
        setIsLoading(true)
        try {
          const { data: mostVisitedData, error: mostVisitedError } = await getMostVisitedSpreadsheets(5)
          
          if (mostVisitedError) {
            console.error('Error fetching most visited:', mostVisitedError)
            setError(new Error(mostVisitedError.message || 'Error fetching data'))
            return
          }
          
          setMostVisited((mostVisitedData as unknown as MostVisitedItem[]) || [])
        } catch (err) {
          console.error('Failed to load most visited spreadsheets:', err)
          setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
          setIsLoading(false)
        }
      }
      
      loadMostVisited()
    }
  }, [getMostVisitedSpreadsheets, isLoaded, isSignedIn, attemptedLoad])
  
  // Don't show anything until auth is loaded
  if (!isLoaded) {
    return null
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-medium">Most Visited</h3>
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full mb-2" />
        ))}
      </div>
    )
  }
  
  // Don't show the section if there's an error or no data
  if (error || mostVisited.length === 0) {
    return null
  }
  
  return (
    <div className="mb-6">
      <ul className="space-y-1">
        {mostVisited.map((item) => (
          <li key={item.spreadsheet_id}>
            <Link 
              href={`/spreadsheet/${item.spreadsheets.id}`}
              className="block text-sm text-gray-700 hover:text-gray-900 truncate py-1 px-2 hover:bg-gray-100 rounded"
            >
              {item.spreadsheets.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
} 