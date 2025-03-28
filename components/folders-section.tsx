"use client"

import { useRouter } from "next/navigation"
import { FolderOpen, FolderClosed, MoreHorizontal, Trash2, Loader2, Pencil, X } from "lucide-react"
import { useFolder } from "@/context/folder-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"

export function FoldersSection() {
  const router = useRouter()
  const { 
    folders, 
    totalSpreadsheetCount,
    isLoading, 
    activeFolder, 
    setActiveFolder,
    deleteFolder,
    trashFolder,
    updateFolder,
    moveSpreadsheet
  } = useFolder()
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")

  const handleFolderClick = async (folderId: string | null) => {
    // First update the URL
    if (folderId) {
      await router.push(`/dashboard?folder=${folderId}`)
    } else {
      await router.push('/dashboard')
    }
    // Then update the state
    setActiveFolder(folderId)
  }

  const handleRename = async (folderId: string) => {
    try {
      await updateFolder(folderId, newFolderName.trim())
      setRenamingFolderId(null)
      setNewFolderName("")
    } catch (err) {
      // Error is handled by the context
    }
  }

  const handleTrash = async (folderId: string) => {
    try {
      await trashFolder(folderId)
    } catch (err) {
      // Error is handled by the context
    }
  }

  const handleDelete = async (folderId: string) => {
    if (!confirm("Are you sure you want to permanently delete this folder? This action cannot be undone.")) return;
    
    try {
      await deleteFolder(folderId)
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
      <DroppableFolder folderId={null} isActive={activeFolder === null} onClick={() => handleFolderClick(null)}>
        <div className="flex items-center text-xs">
          <FolderOpen className="h-4 w-4 mr-2" />
          All Spreadsheets
        </div>
        <small className="font-medium text-muted-foreground text-xs ml-4">
          {totalSpreadsheetCount}
        </small>
      </DroppableFolder>

      {/* User Created Folders */}
      {folders.map((folder) => (
        <li key={folder.id} className="list-none">
          {renamingFolderId === folder.id ? (
            <div className="flex items-center w-full gap-2 pr-8">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename(folder.id)
                  } else if (e.key === 'Escape') {
                    setRenamingFolderId(null)
                    setNewFolderName("")
                  }
                }}
                placeholder="Enter folder name"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setRenamingFolderId(null)
                  setNewFolderName("")
                }}
                className="h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center absolute right-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <DroppableFolder folderId={folder.id} isActive={activeFolder === folder.id} onClick={() => handleFolderClick(folder.id)}>
              <div className="flex items-center text-xs">
                <FolderClosed className="h-4 w-4 mr-2" />
                {folder.name}
              </div>
              <div className="flex items-center">
                <small className="font-medium text-muted-foreground text-xs ml-1">
                  {folder.spreadsheet_count || 0}
                </small>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRenamingFolderId(folder.id);
                      setNewFolderName(folder.name);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTrash(folder.id);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Move to Trash
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(folder.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DroppableFolder>
          )}
        </li>
      ))}
    </div>
  )
}

interface DroppableFolderProps {
  folderId: string | null
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

function DroppableFolder({ folderId, isActive, onClick, children }: DroppableFolderProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: folderId || 'root',
    data: {
      type: 'folder',
      folderId
    }
  })

  return (
    <div 
      ref={setNodeRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className={cn(
        "inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full justify-between relative cursor-pointer",
        isActive && "bg-secondary text-secondary-foreground",
        isOver && "bg-blue-50"
      )}
    >
      {children}
    </div>
  )
} 