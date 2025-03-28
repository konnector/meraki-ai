"use client"

import { useState } from "react"
import { Check, Plus, Tag } from "lucide-react"
import { useTag } from "@/context/tag-context"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TagSelectorProps {
  spreadsheetId: string
  onOpenChange?: (open: boolean) => void
}

export function TagSelector({ spreadsheetId, onOpenChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [newTagOpen, setNewTagOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState("#3B82F6")
  const [newTagName, setNewTagName] = useState("")
  const {
    tags,
    isLoading,
    createTag,
    addTagToSpreadsheet,
    removeTagFromSpreadsheet,
    getSpreadsheetTags,
  } = useTag()
  const [spreadsheetTags, setSpreadsheetTags] = useState<string[]>([])

  // Load spreadsheet tags when opened
  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      const tags = await getSpreadsheetTags(spreadsheetId)
      setSpreadsheetTags(tags.map(tag => tag.id))
    }
    onOpenChange?.(isOpen)
  }

  // Handle tag selection/deselection
  const toggleTag = async (tagId: string) => {
    try {
      if (spreadsheetTags.includes(tagId)) {
        await removeTagFromSpreadsheet(spreadsheetId, tagId)
        setSpreadsheetTags(prev => prev.filter(id => id !== tagId))
      } else {
        await addTagToSpreadsheet(spreadsheetId, tagId)
        setSpreadsheetTags(prev => [...prev, tagId])
      }
    } catch (error) {
      console.error('Failed to toggle tag:', error)
    }
  }

  // Handle new tag creation
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      await createTag(newTagName.trim(), selectedColor)
      setNewTagName("")
      setNewTagOpen(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const predefinedColors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6B7280", // Gray
  ]

  return (
    <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto p-2 text-sm justify-start font-normal"
          >
            <Tag className="mr-2 h-4 w-4" />
            Add tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" side="right" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup heading="Your tags">
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => toggleTag(tag.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                    {spreadsheetTags.includes(tag.id) && (
                      <Check className="h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem onSelect={() => setNewTagOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create new tag
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new tag</DialogTitle>
          <DialogDescription>
            Add a new tag to organize your spreadsheets.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Tag name</Label>
            <Input
              id="name"
              placeholder="Enter tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNewTagOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTag}>Create tag</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 