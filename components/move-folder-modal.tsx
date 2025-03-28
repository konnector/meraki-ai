import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useFolder } from "@/context/folder-context"
import { Checkbox } from "@/components/ui/checkbox"
import { FolderClosed } from "lucide-react"
import { cn } from "@/lib/utils"

interface MoveFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spreadsheetId: string
  currentFolderId: string | null
}

export function MoveFolderModal({ open, onOpenChange, spreadsheetId, currentFolderId }: MoveFolderModalProps) {
  const { folders, moveSpreadsheet } = useFolder()
  const [selectedFolders, setSelectedFolders] = React.useState<string[]>([])
  const [isMoving, setIsMoving] = React.useState(false)

  // Reset selected folders when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedFolders(currentFolderId ? [currentFolderId] : [])
    }
  }, [open, currentFolderId])

  const handleToggleFolder = (folderId: string) => {
    setSelectedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId)
      } else {
        return [...prev, folderId]
      }
    })
  }

  const handleMove = async () => {
    try {
      setIsMoving(true)
      // If no folders are selected, move to "All Spreadsheets"
      const targetFolderId = selectedFolders.length === 0 ? null : selectedFolders[0]
      await moveSpreadsheet(spreadsheetId, targetFolderId)
      onOpenChange(false)
    } catch (err) {
      // Error is handled by the context
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
          <DialogDescription>
            Choose a folder to move this spreadsheet to
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 py-4">
          {/* All Spreadsheets option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-spreadsheets"
              checked={selectedFolders.length === 0}
              onCheckedChange={() => setSelectedFolders([])}
            />
            <label
              htmlFor="all-spreadsheets"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              <FolderClosed className="h-4 w-4" />
              All Spreadsheets
            </label>
          </div>

          {/* Folder list */}
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center space-x-2">
              <Checkbox
                id={folder.id}
                checked={selectedFolders.includes(folder.id)}
                onCheckedChange={() => handleToggleFolder(folder.id)}
              />
              <label
                htmlFor={folder.id}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2",
                  selectedFolders.includes(folder.id) && "text-primary"
                )}
              >
                <FolderClosed className="h-4 w-4" />
                {folder.name}
              </label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={isMoving}
          >
            {isMoving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 