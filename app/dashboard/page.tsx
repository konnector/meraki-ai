"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Bookmark, Clock, FileSpreadsheet, Search, MoreHorizontal, X, Trash2, RefreshCcw, FolderClosed, AlignJustify } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useSpreadsheetApi } from "@/lib/supabase/secure-api"
import { SpreadsheetProvider, useSpreadsheet } from "@/context/spreadsheet-context"
import { useFolder } from "@/context/folder-context"
import type { Spreadsheet } from "@/lib/supabase/types"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import React from "react"
import { MessageLoading } from "@/components/ui/message-loading"
import RecentSpreadsheets from "@/components/Dashboard/RecentSpreadsheets"
import { MoveFolderModal } from "@/components/move-folder-modal"
import SpreadsheetPreview from "@/components/SpreadSheet/spreadsheet-preview"
import { useUser } from "@clerk/nextjs"
import { TagSelector } from "@/components/TagSelector"
import { SpreadsheetTags } from "@/components/SpreadsheetTags"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { type Folder } from "@/lib/supabase/folder-api"
import { useTag } from "@/context/tag-context"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

// Extended spreadsheet type for UI operations
interface UISpreadsheet extends Spreadsheet {
  _deleted?: boolean;
  deleted_at?: string;
}

// Extended folder type with trash properties
interface TrashedFolder extends Folder {
  deleted_at?: string;
}

interface Filter {
  type: 'tag' | 'folder';
  id: string;
  name: string;
  color?: string;
}

function SpreadsheetCard({ sheet, onUpdate }: { sheet: UISpreadsheet, onUpdate: (updatedSheet: UISpreadsheet) => void }) {
  return (
    <SpreadsheetProvider spreadsheetId={sheet.id}>
      <SpreadsheetCardContent sheet={sheet} onUpdate={onUpdate} />
    </SpreadsheetProvider>
  )
}

const MemoizedSpreadsheetCard = React.memo(SpreadsheetCard)

function SpreadsheetCardContent({ sheet, onUpdate }: { sheet: UISpreadsheet, onUpdate: (updatedSheet: UISpreadsheet) => void }) {
  const { toggleStar: toggleBookmark, isStarred: isBookmarked } = useSpreadsheet()
  const spreadsheetApi = useSpreadsheetApi()
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(sheet.title)
  const [isLoading, setIsLoading] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const { updateTitle, deleteSpreadsheet, trashSpreadsheet } = useSpreadsheetApi()
  const router = useRouter()

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    try {
      const newIsStarred = !sheet.data?.isStarred
      const response = await spreadsheetApi.updateSpreadsheet(sheet.id, {
        ...sheet.data,
        isStarred: newIsStarred,
        meta: {
          rowCount: 100,
          columnCount: 26,
          lastModified: new Date().toISOString(),
        }
      })
      
      if (response.error) {
        throw response.error
      }
      
      onUpdate({
        ...sheet,
        data: {
          ...(sheet.data || {}),
          isStarred: newIsStarred
        }
      } as UISpreadsheet)
    } catch (e) {
      console.error("Failed to toggle bookmark:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRename = async () => {
    if (newTitle.trim() === '') return
    
    setIsLoading(true)
    try {
      const response = await spreadsheetApi.updateTitle(sheet.id, newTitle)
      if (response.error) {
        throw response.error
      }
      setIsRenaming(false)
      
      onUpdate({
        ...sheet,
        title: newTitle
      } as UISpreadsheet)
    } catch (e) {
      console.error("Failed to rename spreadsheet:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setIsLoading(true)
    try {
      const response = await spreadsheetApi.createSpreadsheet(`${sheet.title} (Copy)`)
      if (response.error) {
        throw response.error
      }
      if (response.data?.[0]?.id) {
        await spreadsheetApi.updateSpreadsheet(response.data[0].id, sheet.data || {})
        window.location.reload()
      }
    } catch (e) {
      console.error("Failed to duplicate spreadsheet:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/spreadsheet/${sheet.id}`
    navigator.clipboard.writeText(url)
    alert("Spreadsheet URL copied to clipboard!")
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this spreadsheet? This action cannot be undone.")) return;
    
    setIsLoading(true);
    try {
      const response = await deleteSpreadsheet(sheet.id);
      if (response.error) {
        throw response.error;
      }
      // Mark spreadsheet for deletion in the UI
      onUpdate({ ...sheet, _deleted: true });
    } catch (error) {
      console.error("Error deleting spreadsheet:", error);
      alert("Failed to delete spreadsheet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrash = async () => {
    setIsLoading(true);
    try {
      const response = await trashSpreadsheet(sheet.id);
      if (response.error) {
        throw response.error;
      }
      // Mark spreadsheet for deletion in the UI
      onUpdate({ ...sheet, _deleted: true });
    } catch (error) {
      console.error("Error trashing spreadsheet:", error);
      alert("Failed to move spreadsheet to trash");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      className="group relative"
      layout
    >
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute right-2 top-2 z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleBookmark(e);
          }}
          disabled={isLoading}
        >
          <Bookmark
            className={`h-4 w-4 transition-colors ${
              isLoading ? "text-gray-300" : sheet.data?.isStarred ? "fill-gray-900 text-gray-900" : "text-gray-400"
            }`}
          />
        </Button>
        <Link href={`/spreadsheet/${sheet.id}`} className="block" onClick={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Thumbnail */}
            <div className="h-36 bg-white border-b border-gray-200 flex items-center justify-center p-4">
              <div className="w-full h-full bg-white" />
            </div>
            
            {/* Metadata */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {isRenaming ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleRename()
                      }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        disabled={isLoading}
                      />
                      <Button type="submit" size="sm" variant="ghost" disabled={isLoading}>
                        {isLoading ? <MessageLoading /> : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsRenaming(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {sheet.title}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {isLoading ? (
                          <MessageLoading />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsRenaming(true);
                      }}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDuplicate();
                      }}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShare();
                      }}>
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMoveModalOpen(true);
                      }}>
                        Move to
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <TagSelector 
                        spreadsheetId={sheet.id} 
                        onOpenChange={(open) => {
                          // Close dropdown menu when tag selector is closed
                          if (!open) {
                            const event = new MouseEvent('click', {
                              bubbles: true,
                              cancelable: true,
                              view: window
                            });
                            document.dispatchEvent(event);
                          }
                        }}
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTrash();
                        }}
                      >
                        Move to Trash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="min-h-[24px]">
                  <SpreadsheetTags spreadsheetId={sheet.id} className="mb-2" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <MoveFolderModal
        open={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
        spreadsheetId={sheet.id}
        currentFolderId={sheet.folder_id || null}
      />
    </motion.div>
  )
}

function FilterButton({ activeFilters, onFilterChange }: { 
  activeFilters: Filter[];
  onFilterChange: (filters: Filter[]) => void;
}) {
  const [open, setOpen] = useState(false)
  const [commandInput, setCommandInput] = useState("")
  const commandInputRef = useRef<HTMLInputElement>(null)
  const { tags } = useTag()
  const { folders } = useFolder()

  const handleTagSelect = (tagId: string, tagName: string, tagColor: string) => {
    // Check if tag is already selected
    if (!activeFilters.some(f => f.type === 'tag' && f.id === tagId)) {
      onFilterChange([...activeFilters, { 
        type: 'tag', 
        id: tagId, 
        name: tagName, 
        color: tagColor 
      }])
    }
    setOpen(false)
  }

  const handleFolderSelect = (folderId: string, folderName: string) => {
    // Check if folder is already selected
    if (!activeFilters.some(f => f.type === 'folder' && f.id === folderId)) {
      onFilterChange([...activeFilters, { 
        type: 'folder', 
        id: folderId, 
        name: folderName 
      }])
    }
    setOpen(false)
  }

  const handleRemoveFilter = (filterToRemove: Filter) => {
    onFilterChange(activeFilters.filter(f => 
      !(f.type === filterToRemove.type && f.id === filterToRemove.id)
    ))
  }

  const handleClearFilters = () => {
    onFilterChange([])
  }

  const filteredTags = commandInput
    ? tags.filter(tag => 
        tag.name.toLowerCase().includes(commandInput.toLowerCase())
      )
    : tags

  const filteredFolders = commandInput
    ? folders.filter(folder => 
        folder.name.toLowerCase().includes(commandInput.toLowerCase())
      )
    : folders

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <Popover
        open={open}
        onOpenChange={(open) => {
          setOpen(open)
          if (!open) {
            setTimeout(() => {
              setCommandInput("")
            }, 200)
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="default" 
            className={cn(
              "bg-white h-9 w-9 p-0",
              activeFilters.length > 0 && "ring-2 ring-primary/20"
            )}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={cn(
                "text-gray-600",
                activeFilters.length > 0 && "text-primary"
              )}
            >
              <path
                d="M2 4h12M4 8h8M6 12h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="Filter by tags or folders..."
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value)
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Tags">
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    className={cn(
                      "group text-muted-foreground flex gap-2 items-center",
                      activeFilters.some(f => f.type === 'tag' && f.id === tag.id) && 
                      "bg-primary/5 text-primary"
                    )}
                    onSelect={() => handleTagSelect(tag.id, tag.name, tag.color)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-accent-foreground truncate">{tag.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Folders">
                {filteredFolders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    className={cn(
                      "group text-muted-foreground flex gap-2 items-center",
                      activeFilters.some(f => f.type === 'folder' && f.id === folder.id) && 
                      "bg-primary/5 text-primary"
                    )}
                    onSelect={() => handleFolderSelect(folder.id, folder.name)}
                  >
                    <FolderClosed className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-accent-foreground truncate">{folder.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {activeFilters.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          {activeFilters.map((filter, index) => (
            <div 
              key={`${filter.type}-${filter.id}`}
              className="flex items-center gap-1 bg-primary/5 text-primary px-2 py-1 rounded-md text-xs"
            >
              {filter.type === 'tag' && (
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: filter.color }}
                />
              )}
              {filter.type === 'folder' && (
                <FolderClosed className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{filter.name}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-primary/80" 
                onClick={() => handleRemoveFilter(filter)}
              />
            </div>
          ))}
          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleClearFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const { getSpreadsheets, getTrashedSpreadsheets, createSpreadsheet, restoreSpreadsheet, isLoaded, isSignedIn } = useSpreadsheetApi()
  const { activeFolder, folders, setActiveFolder, moveSpreadsheet, getTrashedFolders, restoreFolder } = useFolder()
  const { activeTag, tags, setActiveTag, getSpreadsheetTags } = useTag()
  const { user } = useUser()
  const [spreadsheets, setSpreadsheets] = useState<UISpreadsheet[]>([])
  const [trashedSpreadsheets, setTrashedSpreadsheets] = useState<UISpreadsheet[]>([])
  const [trashedFolders, setTrashedFolders] = useState<TrashedFolder[]>([])
  const [spreadsheetTags, setSpreadsheetTags] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const router = useRouter()
  const dataFetchedRef = useRef(false)
  const visibilityRef = useRef(true)
  const lastLoadRef = useRef(Date.now())
  
  const isTrashView = searchParams.get('trash') === 'true'

  // Get current folder or tag name for display
  const currentTitle = React.useMemo(() => {
    if (isTrashView) return "Trash"
    if (activeTag) {
      const tag = tags.find(t => t.id === activeTag)
      return tag ? tag.name : "All Spreadsheets"
    }
    if (activeFolder) {
      const folder = folders.find(f => f.id === activeFolder)
      return folder ? folder.name : "All Spreadsheets"
    }
    return "All Spreadsheets"
  }, [isTrashView, activeTag, activeFolder, tags, folders])

  // Sync activeFolder and activeTag with URL parameters
  useEffect(() => {
    const folderParam = searchParams.get('folder')
    const tagParam = searchParams.get('tag')
    const trashParam = searchParams.get('trash')
    
    // If viewing trash, clear active folder and tag
    if (trashParam === 'true') {
      setActiveFolder(null)
      setActiveTag(null)
      return
    } 
    
    // Handle tag parameter
    if (tagParam !== null) {
      if (tagParam !== activeTag) {
        setActiveTag(tagParam)
        if (activeFolder !== null) {
          setActiveFolder(null) // Clear folder filter when tag is selected
        }
      }
      return
    } else if (activeTag !== null) {
      // If there's no tag in URL but there's an active tag, clear it
      setActiveTag(null)
    }
    
    // Handle folder parameter
    if (folderParam !== null) {
      if (folderParam !== activeFolder) {
        setActiveFolder(folderParam)
      }
    } else if (activeFolder !== null) {
      setActiveFolder(null)
    }
  }, [searchParams, activeFolder, activeTag, setActiveFolder, setActiveTag])

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      // Only trigger reload if visibility changes from hidden to visible
      // and it's been more than 5 minutes since last load
      if (isVisible && !visibilityRef.current && Date.now() - lastLoadRef.current > 5 * 60 * 1000) {
        loadSpreadsheets();
      }
      visibilityRef.current = isVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initial load
  useEffect(() => {
    if (isLoaded && isSignedIn && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      if (isTrashView) {
        loadTrashedItems();
      } else {
        loadSpreadsheets();
      }
    }
  }, [isLoaded, isSignedIn, isTrashView]);

  // Handle filter changes
  useEffect(() => {
    if (dataFetchedRef.current && (activeFolder || activeTag)) {
      loadSpreadsheets();
    }
  }, [activeFolder, activeTag]);

  async function loadSpreadsheets() {
    if (!isLoaded || !isSignedIn) return;
    
    setLoading(true);
    setError(null);
    try {
      // Load spreadsheets first
      const { data: spreadsheetsData, error: spreadsheetsError } = await getSpreadsheets();
      
      if (spreadsheetsError) {
        console.error('Error loading spreadsheets:', spreadsheetsError);
        return;
      }

      if (spreadsheetsData) {
        setSpreadsheets(spreadsheetsData as UISpreadsheet[]);
        lastLoadRef.current = Date.now();

        // Load tags for all spreadsheets
        const tagsMap: Record<string, string[]> = {};
        
        // Load tags in parallel batches of 5 to avoid overwhelming the server
        const batchSize = 5;
        for (let i = 0; i < spreadsheetsData.length; i += batchSize) {
          const batch = spreadsheetsData.slice(i, i + batchSize);
          const promises = batch.map(async (sheet) => {
            try {
              const tags = await getSpreadsheetTags(sheet.id);
              return { sheetId: sheet.id, tags };
            } catch (error) {
              console.error(`Failed to load tags for sheet ${sheet.id}:`, error);
              return { sheetId: sheet.id, tags: [] };
            }
          });
          
          const results = await Promise.all(promises);
          results.forEach(({ sheetId, tags }) => {
            tagsMap[sheetId] = tags.map((tag: { id: string }) => tag.id);
          });
        }

        // Update tags map after loading all tags
        setSpreadsheetTags(tagsMap);
      }
    } catch (error) {
      console.error('Failed to load spreadsheets:', error);
      setError(error instanceof Error ? error.message : 'Failed to load spreadsheets');
    } finally {
      setLoading(false);
    }
  }

  async function loadTrashedItems() {
    setLoading(true)
    setError(null)
    try {
      // Load trashed spreadsheets
      const sheetsResponse = await getTrashedSpreadsheets()
      setTrashedSpreadsheets(sheetsResponse.data || [])

      // Load trashed folders
      const folders = await getTrashedFolders()
      setTrashedFolders(folders || [])
    } catch (e) {
      console.error("Failed to load trashed items:", e)
      setError(e instanceof Error ? e.message : "Failed to load trashed items")
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreSpreadsheet = async (id: string) => {
    try {
      await restoreSpreadsheet(id)
      // Remove from the list
      setTrashedSpreadsheets(prev => prev.filter(sheet => sheet.id !== id))
      toast.success("Spreadsheet restored")
    } catch (error) {
      console.error("Error restoring spreadsheet:", error)
      toast.error("Failed to restore spreadsheet")
    }
  }

  const handleRestoreFolder = async (id: string) => {
    try {
      await restoreFolder(id)
      // Remove from the list
      setTrashedFolders(prev => prev.filter(folder => folder.id !== id))
      toast.success("Folder restored")
    } catch (error) {
      console.error("Error restoring folder:", error)
      toast.error("Failed to restore folder")
    }
  }

  async function handleCreateSpreadsheet() {
    setIsCreatingSheet(true)
    try {
      const response = await createSpreadsheet("Untitled Spreadsheet", activeFolder)
      console.log("Create spreadsheet response:", response) // Debug log
      
      if (response.error) {
        throw response.error
      }
      
      // Check if response and data exist
      if (!response || !response.data) {
        throw new Error("Invalid response format")
      }

      // Get the spreadsheet data - it's a single object, not an array
      const spreadsheet = response.data
      
      if (!spreadsheet?.id) {
        throw new Error("Created spreadsheet has no ID")
      }

      router.push(`/spreadsheet/${spreadsheet.id}`)
    } catch (e) {
      console.error("Failed to create spreadsheet:", e)
      toast.error(e instanceof Error ? e.message : "Failed to create spreadsheet")
      setIsCreatingSheet(false)
    }
  }

  // Function to update a spreadsheet in the state
  const handleUpdateSpreadsheet = (updatedSheet: UISpreadsheet) => {
    setSpreadsheets(prevSheets => {
      // If sheet is marked for deletion, filter it out
      if (updatedSheet._deleted) {
        return prevSheets.filter(s => s.id !== updatedSheet.id)
      }
      
      // Otherwise update the sheet
      return prevSheets.map(s => 
        s.id === updatedSheet.id ? updatedSheet : s
      )
    })
  }

  // Filter spreadsheets based on URL parameters and active filters
  const filteredSpreadsheets = React.useMemo(() => {
    let filtered = spreadsheets;

    // Apply URL-based filters (sidebar)
    if (activeTag) {
      filtered = filtered.filter(sheet => {
        const sheetTags = spreadsheetTags[sheet.id] || [];
        return sheetTags.includes(activeTag);
      });
    }

    if (activeFolder) {
      filtered = filtered.filter(sheet => sheet.folder_id === activeFolder);
    }

    // Apply additional filters from filter button
    if (activeFilters.length > 0) {
      const tagFilters = activeFilters.filter(f => f.type === 'tag').map(f => f.id);
      const folderFilters = activeFilters.filter(f => f.type === 'folder').map(f => f.id);

      filtered = filtered.filter(sheet => {
        // Check folder filters
        if (folderFilters.length > 0) {
          if (!folderFilters.includes(sheet.folder_id || '')) {
            return false;
          }
        }

        // Check tag filters
        if (tagFilters.length > 0) {
          const sheetTags = spreadsheetTags[sheet.id] || [];
          // Sheet must have ALL selected tags (AND operation)
          return tagFilters.every(tagId => sheetTags.includes(tagId));
        }

        return true;
      });
    }

    // Apply search filter if exists
    if (searchQuery) {
      filtered = filtered.filter(sheet =>
        sheet.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [spreadsheets, activeTag, activeFolder, activeFilters, spreadsheetTags, searchQuery]);

  // Filter starred and recent spreadsheets from filtered results
  const starredSpreadsheets = React.useMemo(() => 
    filteredSpreadsheets.filter(sheet => sheet.data?.isStarred),
    [filteredSpreadsheets]
  )
  
  const recentSpreadsheets = React.useMemo(() => 
    filteredSpreadsheets
      .filter(sheet => !sheet.data?.isStarred)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [filteredSpreadsheets]
  )

  // Create a lazy loaded spreadsheet card component
  const LazySpreadsheetCard = React.memo(({ sheet, onUpdate }: { sheet: UISpreadsheet, onUpdate: (updatedSheet: UISpreadsheet) => void }) => {
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef(null)

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { rootMargin: '100px' }
      )

      if (cardRef.current) {
        observer.observe(cardRef.current)
      }

      return () => observer.disconnect()
    }, [])

    return (
      <div ref={cardRef}>
        {isVisible ? (
          <MemoizedSpreadsheetCard sheet={sheet} onUpdate={onUpdate} />
        ) : (
          <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse" />
        )}
      </div>
    )
  })

  const renderContent = () => {
    if (!isLoaded || loading) {
      return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <MessageLoading />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center flex-col">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading {isTrashView ? "trashed items" : "spreadsheets"}</p>
            <Button onClick={isTrashView ? loadTrashedItems : loadSpreadsheets}>Try Again</Button>
          </div>
        </div>
      )
    }

    if (isTrashView) {
      return (
        <div className="p-6">
          <Tabs defaultValue="spreadsheets" className="space-y-4">
            <TabsList>
              <TabsTrigger value="spreadsheets">
                Spreadsheets ({trashedSpreadsheets.length})
              </TabsTrigger>
              <TabsTrigger value="folders">
                Folders ({trashedFolders.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="spreadsheets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trashedSpreadsheets.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Trash2 className="h-12 w-12 mb-4" />
                    <p>No trashed spreadsheets</p>
                  </div>
                ) : (
                  trashedSpreadsheets.map(sheet => (
                    <Card key={sheet.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-base">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          {sheet.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <CardDescription>
                          Deleted {sheet.deleted_at ? formatDistanceToNow(new Date(sheet.deleted_at)) : 'recently'} ago
                        </CardDescription>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleRestoreSpreadsheet(sheet.id)}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="folders" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trashedFolders.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Trash2 className="h-12 w-12 mb-4" />
                    <p>No trashed folders</p>
                  </div>
                ) : (
                  trashedFolders.map(folder => (
                    <Card key={folder.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-base">
                          <FolderClosed className="h-4 w-4 mr-2" />
                          {folder.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <CardDescription>
                          Deleted {folder.deleted_at ? formatDistanceToNow(new Date(folder.deleted_at)) : 'recently'} ago
                        </CardDescription>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleRestoreFolder(folder.id)}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    return (
      <div className="p-6">
        {searchQuery && filteredSpreadsheets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No spreadsheets found matching "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {/* Defer non-critical rendering */}
            <React.Suspense fallback={<div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>}>
              {/* Starred Spreadsheets - Only show if there are bookmarked items */}
              {starredSpreadsheets.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-gray-900" />
                    <h3 className="text-xl font-semibold text-gray-900">Bookmarked</h3>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {starredSpreadsheets.map((sheet) => (
                      <LazySpreadsheetCard 
                        key={sheet.id} 
                        sheet={sheet} 
                        onUpdate={handleUpdateSpreadsheet}
                      />
                    ))}
                  </div>
                </div>
              )}
            </React.Suspense>

            {/* Lazy load recent spreadsheets */}
            <React.Suspense fallback={<div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>}>
              {/* Recent Spreadsheets */}
              <RecentSpreadsheets 
                spreadsheets={recentSpreadsheets} 
                onUpdate={handleUpdateSpreadsheet} 
                SpreadsheetCard={MemoizedSpreadsheetCard} 
              />
            </React.Suspense>
          </>
        )}
      </div>
    )
  }

  return (
    <SidebarProvider>
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <header className="sticky top-0 z-10 bg-background">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
              <h2 
                className="text-3xl font-bold text-gray-900 flex items-center gap-2"
                style={{ fontVariationSettings: "'wght' 700" }}
              >
                {activeFilters.length > 0 || activeTag || activeFolder ? (
                  <>
                    {currentTitle}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({filteredSpreadsheets.length} items)
                    </span>
                  </>
                ) : (
                  currentTitle
                )}
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {!isTrashView && (
                  <>
                    <FilterButton 
                      activeFilters={activeFilters} 
                      onFilterChange={setActiveFilters} 
                    />
                    <div className="relative w-full sm:w-[400px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Search spreadsheets..."
                        className="w-full bg-gray-100 pl-9 focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button 
                      onClick={handleCreateSpreadsheet} 
                      className="w-full sm:w-auto flex items-center gap-2"
                      disabled={isCreatingSheet}
                    >
                      {isCreatingSheet ? (
                        <MessageLoading />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      New Spreadsheet
                    </Button>
                  </>
                )}
                {isTrashView && (
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </header>
          
          {renderContent()}
        </div>
      </DashboardLayout>
    </SidebarProvider>
  )
}