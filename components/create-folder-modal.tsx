"use client"

import * as React from "react"
import { FolderPlus, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFolder } from "@/context/folder-context"

interface CreateFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFolderModal({ open, onOpenChange }: CreateFolderModalProps) {
  const [folderName, setFolderName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const maxLength = 25
  const { createFolder } = useFolder()

  const handleCreateFolder = async () => {
    try {
      setIsCreating(true)
      await createFolder(folderName.trim())
      onOpenChange(false)
      setFolderName("")
    } catch (err) {
      // Error is handled by the context
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle>Create new folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your spreadsheets
          </DialogDescription>
        </DialogHeader>

        <div className="mb-5">
          <label 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" 
            htmlFor="folderName"
          >
            Folder name
          </label>
          <input
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 h-12"
            size={30}
            placeholder="Enter folder name"
            maxLength={maxLength}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            name="folderName"
            disabled={isCreating}
          />
          <div className="flex justify-end mt-2">
            <small className="text-sm font-medium leading-none text-muted-foreground text-end">
              {folderName.length}/{maxLength}
            </small>
          </div>
        </div>

        <div className="h-2" />

        <button
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 w-full"
          type="button"
          disabled={!folderName.trim() || isCreating}
          onClick={handleCreateFolder}
        >
          {isCreating ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <FolderPlus className="h-5 w-5 mr-2" />
          )}
          {isCreating ? "Creating..." : "Create"}
        </button>

        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  )
} 