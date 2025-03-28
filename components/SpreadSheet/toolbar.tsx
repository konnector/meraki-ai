"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Calculator,
  Palette,
  PaintBucket,
  Undo2,
  Redo2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSpreadsheet } from "@/context/spreadsheet-context"

export default function Toolbar() {
  const { 
    activeCell, 
    cells, 
    updateCellFormat, 
    updateMultipleCellsFormat,
    selection,
    getSelectedCells,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSpreadsheet()

  const handleFormatChange = (format: string, value: any) => {
    if (!activeCell) return
    
    // If there's a selection with multiple cells, apply to all selected cells
    if (selection) {
      const selectedCells = getSelectedCells()
      if (selectedCells.length > 0) {
        updateMultipleCellsFormat(selectedCells, { [format]: value })
      } else {
        // Otherwise, just update the active cell
        updateCellFormat(activeCell, { [format]: value })
      }
    } else {
      // No selection, just update the active cell
      updateCellFormat(activeCell, { [format]: value })
    }
  }

  const currentCell = activeCell ? cells[activeCell] : null

  // Font families
  const fontFamilies = [
    { value: "sans", label: "Sans Serif" },
    { value: "serif", label: "Serif" },
    { value: "mono", label: "Monospace" },
    { value: "inter", label: "Inter" },
    { value: "roboto", label: "Roboto" },
    { value: "poppins", label: "Poppins" },
  ]

  // Font sizes
  const fontSizes = [
    { value: "xs", label: "10px" },
    { value: "sm", label: "12px" },
    { value: "normal", label: "14px" },
    { value: "lg", label: "16px" },
    { value: "xl", label: "18px" },
    { value: "2xl", label: "20px" },
    { value: "3xl", label: "24px" },
  ]

  // Color presets
  const colorPresets = [
    "#000000",
    "#FFFFFF",
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
    "#795548",
    "#9E9E9E",
  ]

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-b">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo()}
              className="h-8 w-8"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo()}
              className="h-8 w-8"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1" />

        <div className="flex items-center gap-2 px-4 py-1 border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.bold ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("bold", !currentCell?.format?.bold)}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bold</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.italic ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("italic", !currentCell?.format?.italic)}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Italic</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.underline ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("underline", !currentCell?.format?.underline)}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Underline</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.align === "left" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("align", "left")}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align left</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.align === "center" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("align", "center")}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align center</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.align === "right" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("align", "right")}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align right</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Color Picker */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                      <Palette className="h-4 w-4" />
                      <div
                        className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: currentCell?.format?.textColor || "#000000" }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Text Color</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center"
                            style={{ backgroundColor: color }}
                            onClick={() => handleFormatChange("textColor", color)}
                          >
                            {currentCell?.format?.textColor === color && (
                              <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Text color</p>
            </TooltipContent>
          </Tooltip>

          {/* Fill Color Picker */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                      <PaintBucket className="h-4 w-4" />
                      <div
                        className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: currentCell?.format?.fillColor || "transparent" }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Fill Color</h4>
                      <div className="grid grid-cols-5 gap-2">
                        <button
                          className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center bg-white"
                          onClick={() => handleFormatChange("fillColor", "transparent")}
                        >
                          {(!currentCell?.format?.fillColor || currentCell?.format?.fillColor === "transparent") && (
                            <div className="w-2 h-2 bg-gray-400 rounded-full shadow-sm" />
                          )}
                        </button>
                        {colorPresets.slice(1).map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center"
                            style={{ backgroundColor: color }}
                            onClick={() => handleFormatChange("fillColor", color)}
                          >
                            {currentCell?.format?.fillColor === color && (
                              <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fill color</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.type === "text" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("type", "text")}
                >
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Format as text</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.type === "number" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange("type", "number")}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Format as number</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

