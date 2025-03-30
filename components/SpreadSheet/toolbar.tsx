import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  PaintBucket,
  Undo2,
  Redo2,
  Hash,
  Calendar,
  Percent,
  DollarSign,
  Clock,
  ZoomIn,
  ZoomOut,
  Combine,
  Split,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSpreadsheet } from "@/context/spreadsheet-context"
import { EnhancedImportExportButtons } from "@/components/enhanced-import-export-buttons"
import { AutoResizeColumns } from "@/components/auto-resize-columns"

// Define number format types and options
const numberFormatOptions = [
  { 
    id: 'general', 
    label: 'General', 
    icon: <Hash className="h-4 w-4 mr-2" />,
    format: { numberFormat: 'general', type: 'number' } 
  },
  { 
    id: 'number', 
    label: 'Number', 
    icon: <Hash className="h-4 w-4 mr-2" />,
    format: { numberFormat: 'number', decimals: 2, type: 'number' },
    subOptions: [
      { id: 'number-0', label: '1234', format: { numberFormat: 'number', decimals: 0, type: 'number' } },
      { id: 'number-1', label: '1234.5', format: { numberFormat: 'number', decimals: 1, type: 'number' } },
      { id: 'number-2', label: '1234.56', format: { numberFormat: 'number', decimals: 2, type: 'number' } },
      { id: 'number-3', label: '1234.567', format: { numberFormat: 'number', decimals: 3, type: 'number' } },
    ]
  },
  { 
    id: 'currency', 
    label: 'Currency', 
    icon: <DollarSign className="h-4 w-4 mr-2" />,
    format: { numberFormat: 'currency', currencySymbol: '$', decimals: 2, type: 'number' },
    subOptions: [
      { id: 'currency-usd', label: '$ USD', format: { numberFormat: 'currency', currencySymbol: '$', decimals: 2, type: 'number' } },
      { id: 'currency-eur', label: '€ EUR', format: { numberFormat: 'currency', currencySymbol: '€', decimals: 2, type: 'number' } },
      { id: 'currency-gbp', label: '£ GBP', format: { numberFormat: 'currency', currencySymbol: '£', decimals: 2, type: 'number' } },
      { id: 'currency-jpy', label: '¥ JPY', format: { numberFormat: 'currency', currencySymbol: '¥', decimals: 0, type: 'number' } },
    ]
  },
  { 
    id: 'percent', 
    label: 'Percent', 
    icon: <Percent className="h-4 w-4 mr-2" />,
    format: { numberFormat: 'percent', decimals: 2, type: 'number' },
    subOptions: [
      { id: 'percent-0', label: '75%', format: { numberFormat: 'percent', decimals: 0, type: 'number' } },
      { id: 'percent-1', label: '75.4%', format: { numberFormat: 'percent', decimals: 1, type: 'number' } },
      { id: 'percent-2', label: '75.44%', format: { numberFormat: 'percent', decimals: 2, type: 'number' } },
    ]
  },
  { 
    id: 'date', 
    label: 'Date', 
    icon: <Calendar className="h-4 w-4 mr-2" />,
    format: { numberFormat: 'date', dateFormat: 'MM/DD/YYYY', type: 'number' },
    subOptions: [
      { id: 'date-mdy', label: 'MM/DD/YYYY', format: { numberFormat: 'date', dateFormat: 'MM/DD/YYYY', type: 'number' } },
      { id: 'date-dmy', label: 'DD/MM/YYYY', format: { numberFormat: 'date', dateFormat: 'DD/MM/YYYY', type: 'number' } },
      { id: 'date-ymd', label: 'YYYY-MM-DD', format: { numberFormat: 'date', dateFormat: 'YYYY-MM-DD', type: 'number' } },
      { id: 'date-md', label: 'MM/DD', format: { numberFormat: 'date', dateFormat: 'MM/DD', type: 'number' } },
    ]
  },
  { 
    id: 'time', 
    label: 'Time', 
    icon: <Clock className="h-4 w-4 mr-2" />,
    format: { numberFormat: 'time', timeFormat: 'HH:MM:SS', type: 'number' },
    subOptions: [
      { id: 'time-hms', label: 'HH:MM:SS', format: { numberFormat: 'time', timeFormat: 'HH:MM:SS', type: 'number' } },
      { id: 'time-hm', label: 'HH:MM', format: { numberFormat: 'time', timeFormat: 'HH:MM', type: 'number' } },
      { id: 'time-hm-am', label: 'HH:MM AM/PM', format: { numberFormat: 'time', timeFormat: 'HH:MM AM/PM', type: 'number' } },
    ]
  },
];

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
    zoomLevel,
    setZoomLevel,
    mergeCells,
    unmergeCells,
    isCellPartOfMerge,
  } = useSpreadsheet()

  const handleFormatChange = (format: Record<string, any>) => {
    if (!activeCell) return
    
    // If there's a selection with multiple cells, apply to all selected cells
    if (selection) {
      const selectedCells = getSelectedCells()
      if (selectedCells.length > 0) {
        updateMultipleCellsFormat(selectedCells, format)
      } else {
        // Otherwise, just update the active cell
        updateCellFormat(activeCell, format)
      }
    } else {
      // No selection, just update the active cell
      updateCellFormat(activeCell, format)
    }
  }

  // Apply a number format setting
  const applyNumberFormat = (formatOptions: Record<string, any>) => {
    handleFormatChange({
      ...formatOptions,
      type: 'number' // Ensure type is set to 'number' for proper formatting
    });
  };

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
        
        {/* Add Enhanced Import/Export buttons */}
        <EnhancedImportExportButtons />
        
        <Separator orientation="vertical" className="mx-1" />

        {/* Add AutoResizeColumns button */}
        <AutoResizeColumns />
        
        <Separator orientation="vertical" className="mx-1" />

        <div className="flex items-center gap-2 px-4 py-1 border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentCell?.format?.bold ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleFormatChange({ bold: !currentCell?.format?.bold })}
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
                  onClick={() => handleFormatChange({ italic: !currentCell?.format?.italic })}
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
                  onClick={() => handleFormatChange({ underline: !currentCell?.format?.underline })}
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
                  onClick={() => handleFormatChange({ align: "left" })}
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
                  onClick={() => handleFormatChange({ align: "center" })}
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
                  onClick={() => handleFormatChange({ align: "right" })}
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

          {/* Number Format Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number Format</p>
              </TooltipContent>
            </Tooltip>
            
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Number Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {numberFormatOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => applyNumberFormat(option.format)}
                    className="flex items-center"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              
              {/* Sub-menus for specific formats */}
              <DropdownMenuSeparator />
              
              {/* Currency Options */}
              <DropdownMenuLabel>Currency Options</DropdownMenuLabel>
              {numberFormatOptions.find(o => o.id === 'currency')?.subOptions?.map((subOption) => (
                <DropdownMenuItem
                  key={subOption.id}
                  onClick={() => applyNumberFormat(subOption.format)}
                >
                  <span className="ml-6">{subOption.label}</span>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* Date Options */}
              <DropdownMenuLabel>Date Options</DropdownMenuLabel>
              {numberFormatOptions.find(o => o.id === 'date')?.subOptions?.map((subOption) => (
                <DropdownMenuItem
                  key={subOption.id}
                  onClick={() => applyNumberFormat(subOption.format)}
                >
                  <span className="ml-6">{subOption.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
                            onClick={() => handleFormatChange({ textColor: color })}
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
                          onClick={() => handleFormatChange({ fillColor: "transparent" })}
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
                            onClick={() => handleFormatChange({ fillColor: color })}
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

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  disabled={zoomLevel <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom out</p>
              </TooltipContent>
            </Tooltip>
            
            <Slider
              value={[zoomLevel]}
              min={50}
              max={200}
              step={10}
              className="w-32"
              onValueChange={(value) => setZoomLevel(value[0])}
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  disabled={zoomLevel >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom in</p>
              </TooltipContent>
            </Tooltip>
            
            <span className="text-sm font-medium min-w-[3rem]">{zoomLevel}%</span>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={mergeCells}
              disabled={!selection || getSelectedCells().length <= 1}
            >
              <Combine className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Merge cells</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={unmergeCells}
              disabled={!activeCell || !isCellPartOfMerge(activeCell)}
            >
              <Split className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unmerge cells</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1" />
      </div>
    </TooltipProvider>
  )
}