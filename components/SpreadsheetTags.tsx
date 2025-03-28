"use client"

import { useEffect, useState } from "react"
import { useTag } from "@/context/tag-context"
import { Tag as TagIcon } from "lucide-react"

interface SpreadsheetTagsProps {
  spreadsheetId: string
  className?: string
}

export function SpreadsheetTags({ spreadsheetId, className = "" }: SpreadsheetTagsProps) {
  const { getSpreadsheetTags } = useTag()
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([])

  useEffect(() => {
    const loadTags = async () => {
      try {
        const spreadsheetTags = await getSpreadsheetTags(spreadsheetId)
        setTags(spreadsheetTags)
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }

    loadTags()
  }, [spreadsheetId, getSpreadsheetTags])

  if (tags.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
          style={{ 
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            border: `1px solid ${tag.color}40`
          }}
        >
          <TagIcon className="h-3 w-3" />
          <span>{tag.name}</span>
        </div>
      ))}
    </div>
  )
} 