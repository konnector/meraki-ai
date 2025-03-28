"use client"

import { useRouter } from "next/navigation"
import { Tag, MoreHorizontal, Trash2, Loader2, Pencil, X } from "lucide-react"
import { useTag } from "@/context/tag-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function TagsSection() {
  const router = useRouter()
  const { 
    tags, 
    isLoading, 
    activeTag, 
    setActiveTag,
    deleteTag,
    updateTag
  } = useTag()
  const [renamingTagId, setRenamingTagId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")

  const handleTagClick = async (tagId: string | null) => {
    // First update the state
    setActiveTag(tagId)
    
    // Then update the URL
    if (tagId) {
      await router.push(`/dashboard?tag=${tagId}`)
    } else {
      await router.push('/dashboard')
    }
  }

  const handleRename = async (tagId: string) => {
    try {
      await updateTag(tagId, { name: newTagName.trim() })
      setRenamingTagId(null)
      setNewTagName("")
    } catch (err) {
      // Error is handled by the context
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag? This action cannot be undone.")) return;
    
    try {
      await deleteTag(tagId)
    } catch (err) {
      // Error is handled by the context
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-1">
      {/* All Spreadsheets */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleTagClick(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleTagClick(null)
          }
        }}
        className={cn(
          "inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full justify-between relative cursor-pointer",
          activeTag === null && "bg-secondary text-secondary-foreground"
        )}
      >
        <div className="flex items-center text-xs">
          <Tag className="h-4 w-4 mr-2" />
          All Tags
        </div>
      </div>

      {/* User Created Tags */}
      {tags.map((tag) => (
        <li key={tag.id} className="list-none">
          {renamingTagId === tag.id ? (
            <div className="flex items-center w-full gap-2 pr-8">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename(tag.id)
                  } else if (e.key === 'Escape') {
                    setRenamingTagId(null)
                    setNewTagName("")
                  }
                }}
                placeholder="Enter tag name"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setRenamingTagId(null)
                  setNewTagName("")
                }}
                className="h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center absolute right-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleTagClick(tag.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTagClick(tag.id)
                }
              }}
              className={cn(
                "inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full justify-between relative cursor-pointer group",
                activeTag === tag.id && "bg-secondary text-secondary-foreground"
              )}
            >
              <div className="flex items-center text-xs gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </div>
              <div className="flex items-center">
                <small className="font-medium text-muted-foreground text-xs ml-1">
                  {tag.spreadsheet_count || 0}
                </small>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRenamingTagId(tag.id);
                      setNewTagName(tag.name);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(tag.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </li>
      ))}
    </div>
  )
} 