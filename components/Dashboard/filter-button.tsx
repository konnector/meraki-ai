import { Button } from "@/components/ui/button"
import { Filter, Tag } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTag } from "@/context/tag-context"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface FilterButtonProps {
  className?: string
  activeFilters?: number
  onFilterChange?: (filters: { bookmarked: boolean, selectedTags: string[] }) => void
}

export function FilterButton({ 
  className, 
  activeFilters = 0,
  onFilterChange 
}: FilterButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { tags, isLoading } = useTag()

  const handleBookmarkChange = (checked: boolean) => {
    setIsBookmarked(checked)
    onFilterChange?.({ 
      bookmarked: checked,
      selectedTags 
    })
  }

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId]
    
    setSelectedTags(newSelectedTags)
    onFilterChange?.({ 
      bookmarked: isBookmarked,
      selectedTags: newSelectedTags
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (isBookmarked) count++
    count += selectedTags.length
    return count
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "relative h-9 w-9 border-gray-200",
            getActiveFiltersCount() > 0 && "border-gray-900",
            className
          )}
        >
          <Filter className="h-4 w-4" />
          {getActiveFiltersCount() > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-medium text-white">
              {getActiveFiltersCount()}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filters</h4>
            <p className="text-sm text-muted-foreground">
              Filter your spreadsheets by various criteria.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bookmarked"
                checked={isBookmarked}
                onCheckedChange={handleBookmarkChange}
              />
              <label
                htmlFor="bookmarked"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show only bookmarked
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by tags</label>
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {tags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => handleTagToggle(tag.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({tag.spreadsheet_count})
                          </span>
                        </div>
                        {selectedTags.includes(tag.id) && (
                          <Checkbox checked />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 