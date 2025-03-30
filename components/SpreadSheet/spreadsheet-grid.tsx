"use client"

import { useRef, useState, useEffect, type MouseEvent, type KeyboardEvent, type ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { useSpreadsheet } from "@/context/spreadsheet-context"
import Cell from "@/components/SpreadSheet/Cell"
import { Button } from "@/components/ui/button"
import { Copy, Scissors, ClipboardPaste } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

// Create a client-side only wrapper for the context menu
const ClientSideContextMenu = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => (
    <ContextMenu>
      {children}
    </ContextMenu>
  )),
  { ssr: false }
)

const ClientSideContextMenuTrigger = dynamic(
  () => Promise.resolve(ContextMenuTrigger),
  { ssr: false }
)

const ClientSideContextMenuContent = dynamic(
  () => Promise.resolve(ContextMenuContent),
  { ssr: false }
)

const ClientSideContextMenuItem = dynamic(
  () => Promise.resolve(ContextMenuItem),
  { ssr: false }
)

// Add global styles to prevent text selection during cell selection
const preventSelectionStyle = {
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none'
} as const

export default function SpreadsheetGrid() {
  const {
    cells,
    updateCell,
    activeCell,
    setActiveCell,
    selection,
    setSelection,
    copySelection,
    cutSelection,
    pasteSelection,
    deleteSelection,
    getCellId,
    getCellPosition,
    getSelectedCells,
    getCellDisplayValue,
    isCellFormula,
    isCellPartOfMerge,
    isCellMergeParent,
    getMergeParent,
    undo,
    redo,
    zoomLevel
  } = useSpreadsheet()

  const gridRef = useRef<HTMLDivElement>(null)
  const [editValue, setEditValue] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null)
  const [mouseDownStartPos, setMouseDownStartPos] = useState<{ x: number; y: number } | null>(null)
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<number[]>(Array(26).fill(100))
  const [isResizingColumn, setIsResizingColumn] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<number | null>(null)
  const [startX, setStartX] = useState<number>(0)
  const [startColumnWidth, setStartColumnWidth] = useState<number>(0)
  
  // Row resizing state
  const [rowHeights, setRowHeights] = useState<number[]>(Array(100).fill(32)) // Default row height of 32px (h-8)
  const [isResizingRow, setIsResizingRow] = useState(false)
  const [resizingRow, setResizingRow] = useState<number | null>(null)
  const [startY, setStartY] = useState<number>(0)
  const [startRowHeight, setStartRowHeight] = useState<number>(0)

  // Generate column headers (A-Z)
  const columnHeaders = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  // Generate row headers (1-100)
  const rowHeaders = Array.from({ length: 100 }, (_, i) => i + 1)

  // Handle column resize
  const handleColumnResizeStart = (e: MouseEvent, columnIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingColumn(true)
    setResizingColumn(columnIndex)
    setStartX(e.clientX)
    setStartColumnWidth(columnWidths[columnIndex])
  }

  const handleColumnResizeMove = (e: MouseEvent) => {
    if (!isResizingColumn || resizingColumn === null) return

    const diff = e.clientX - startX
    const newWidth = Math.max(50, startColumnWidth + diff) // Minimum width of 50px
    const newColumnWidths = [...columnWidths]
    newColumnWidths[resizingColumn] = newWidth
    setColumnWidths(newColumnWidths)
  }

  const handleColumnResizeEnd = () => {
    setIsResizingColumn(false)
    setResizingColumn(null)
  }

  // Handle row resize
  const handleRowResizeStart = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingRow(true)
    setResizingRow(rowIndex)
    setStartY(e.clientY)
    setStartRowHeight(rowHeights[rowIndex])
  }

  const handleRowResizeMove = (e: MouseEvent) => {
    if (!isResizingRow || resizingRow === null) return

    const diff = e.clientY - startY
    const newHeight = Math.max(24, startRowHeight + diff) // Minimum height of 24px
    const newRowHeights = [...rowHeights]
    newRowHeights[resizingRow] = newHeight
    setRowHeights(newRowHeights)
  }

  const handleRowResizeEnd = () => {
    setIsResizingRow(false)
    setResizingRow(null)
  }

  // Setup resize event listeners
  useEffect(() => {
    if (isResizingColumn) {
      window.addEventListener('mousemove', handleColumnResizeMove as any)
      window.addEventListener('mouseup', handleColumnResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleColumnResizeMove as any)
        window.removeEventListener('mouseup', handleColumnResizeEnd)
      }
    }
  }, [isResizingColumn])

  useEffect(() => {
    if (isResizingRow) {
      window.addEventListener('mousemove', handleRowResizeMove as any)
      window.addEventListener('mouseup', handleRowResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleRowResizeMove as any)
        window.removeEventListener('mouseup', handleRowResizeEnd)
      }
    }
  }, [isResizingRow])

  // Prevent default browser text selection behavior
  useEffect(() => {
    const preventDefaultSelection = (e: MouseEvent) => {
      if (isSelecting || isResizingColumn || isResizingRow) {
        e.preventDefault()
      }
    }

    // Apply to document to catch all selection attempts
    document.addEventListener('selectstart', preventDefaultSelection as any)
    return () => {
      document.removeEventListener('selectstart', preventDefaultSelection as any)
    }
  }, [isSelecting, isResizingColumn, isResizingRow])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Ignore if we're editing a cell
      if (isEditing) return;

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && (
        (e.key.toLowerCase() === 'y' && !e.shiftKey) ||
        (e.key.toLowerCase() === 'z' && e.shiftKey)
      )) {
        e.preventDefault();
        redo();
      }

      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelection();
      }

      // Cut: Ctrl/Cmd + X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelection();
      }

      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteSelection();
      }

      // Delete: Delete key
      if (e.key === 'Delete') {
        e.preventDefault();
        deleteSelection();
      }

      // Select All: Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelection({
          start: { row: 0, col: 0 },
          end: { row: 99, col: 25 }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, undo, redo, copySelection, cutSelection, pasteSelection, deleteSelection, setSelection]);

  // Add event listener for column auto-resize
  useEffect(() => {
    // Event listener for column auto-resize
    const handleAutoResize = (event: CustomEvent<{ columnWidths: number[] }>) => {
      if (event.detail && event.detail.columnWidths) {
        setColumnWidths(event.detail.columnWidths);
      }
    };

    // Add event listener
    window.addEventListener('resize-columns', handleAutoResize as any);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize-columns', handleAutoResize as any);
    };
  }, []);

  // Handle column header click - select entire column
  const handleColumnHeaderClick = (colIndex: number, e: MouseEvent) => {
    e.preventDefault()
    
    // If shift is held, extend the current selection
    if (e.shiftKey && selection) {
      const currentColStart = Math.min(selection.start.col, selection.end.col)
      const currentColEnd = Math.max(selection.start.col, selection.end.col)
      
      // Determine how to extend the selection
      if (colIndex < currentColStart) {
        // Extend to the left
        setSelection({
          start: { row: 0, col: colIndex },
          end: { row: 99, col: currentColEnd }
        })
      } else if (colIndex > currentColEnd) {
        // Extend to the right
        setSelection({
          start: { row: 0, col: currentColStart },
          end: { row: 99, col: colIndex }
        })
      } else {
        // Click is within current selection, so don't change
        return
      }
    } else {
      // Select the entire column
      setSelection({
        start: { row: 0, col: colIndex },
        end: { row: 99, col: colIndex }
      })
    }
    
    // Set the active cell to the top of the column
    setActiveCell(getCellId({ row: 0, col: colIndex }))
  }
  
  // Handle row header click - select entire row
  const handleRowHeaderClick = (rowIndex: number, e: MouseEvent) => {
    e.preventDefault()
    
    // If shift is held, extend the current selection
    if (e.shiftKey && selection) {
      const currentRowStart = Math.min(selection.start.row, selection.end.row)
      const currentRowEnd = Math.max(selection.start.row, selection.end.row)
      
      // Determine how to extend the selection
      if (rowIndex < currentRowStart) {
        // Extend upward
        setSelection({
          start: { row: rowIndex, col: 0 },
          end: { row: currentRowEnd, col: 25 }
        })
      } else if (rowIndex > currentRowEnd) {
        // Extend downward
        setSelection({
          start: { row: currentRowStart, col: 0 },
          end: { row: rowIndex, col: 25 }
        })
      } else {
        // Click is within current selection, so don't change
        return
      }
    } else {
      // Select the entire row
      setSelection({
        start: { row: rowIndex, col: 0 },
        end: { row: rowIndex, col: 25 }
      })
    }
    
    // Set the active cell to the start of the row
    setActiveCell(getCellId({ row: rowIndex, col: 0 }))
  }

  const handleCellMouseDown = (row: number, col: number, e: MouseEvent) => {
    // Get the cell ID for the clicked cell
    const cellId = getCellId({ row, col })

    // If right-click and there's an existing selection that includes the clicked cell,
    // preserve the selection
    if (e.button === 2 && selection && isCellSelected(row, col)) {
      e.preventDefault()
      return
    }

    // If we're currently editing and click a different cell
    if (isEditing && activeCell !== cellId) {
      // Save the current edit
      if (activeCell) {
        updateCell(activeCell, editValue)
      }
      setIsEditing(false)
      setEditValue("")
      
      // Set the new active cell
      setActiveCell(cellId)
      setSelection({
        start: { row, col },
        end: { row, col },
      })
      return
    }
    
    // If not editing, proceed with normal selection behavior
    if (!isEditing) {
      // Prevent browser's default text selection
      e.preventDefault()

      // Store mouse position for later to detect if user is trying to select or just clicking
      setMouseDownStartPos({ x: e.clientX, y: e.clientY })
      
      setActiveCell(cellId)

      // If shift is pressed, extend the current selection
      if (e.shiftKey && activeCell) {
        const activePos = getCellPosition(activeCell)
        setSelection({
          start: activePos,
          end: { row, col },
        })
        setIsSelecting(true)
        setSelectionStart({ row, col })
      } else if (!e.button) { // Only reset selection on left click
        // For single click, just set the selection to the clicked cell
        setSelection({
          start: { row, col },
          end: { row, col },
        })
        
        // Don't start selection mode immediately, wait to see if user drags
        setSelectionStart({ row, col })
      }
    }

    console.log(`Cell mouse down at row: ${row}, col: ${col}`)
  }

  const handleCellMouseMove = (row: number, col: number, e: MouseEvent) => {
    // Only start selection if mouse has moved a certain distance
    if (selectionStart && mouseDownStartPos && !isSelecting) {
      const dx = Math.abs(e.clientX - mouseDownStartPos.x)
      const dy = Math.abs(e.clientY - mouseDownStartPos.y)
      
      // If mouse has moved more than 5 pixels, start selection
      if (dx > 5 || dy > 5) {
        setIsSelecting(true)
      }
    }
    
    if (!isSelecting || !selectionStart) return

    // Prevent default browser selection while selecting cells
    if (isSelecting) {
      e.preventDefault()
    }

    setSelection({
      start: selectionStart,
      end: { row, col },
    })
  }

  const handleCellMouseUp = () => {
    setIsSelecting(false)
    setMouseDownStartPos(null)
  }

  // Add mouse up handler to window to handle cases where mouse is released outside the grid
  useEffect(() => {
    const handleWindowMouseUp = () => {
      setIsSelecting(false)
      setMouseDownStartPos(null)
    }

    window.addEventListener("mouseup", handleWindowMouseUp)
    return () => window.removeEventListener("mouseup", handleWindowMouseUp)
  }, [])

  const handleCellDoubleClick = (row: number, col: number) => {
    const cellId = getCellId({ row, col })
    setActiveCell(cellId)
    
    // Get the appropriate value to edit - if it's a formula, we want to edit the formula itself
    const valueToEdit = isCellFormula(cellId) && cells[cellId]?.formula 
      ? cells[cellId].formula 
      : (cells[cellId]?.value || "")
      
    setEditValue(valueToEdit)
    setIsEditing(true)

    // Clear selection when editing
    setSelection(null)

    console.log(`Editing cell at row: ${row}, col: ${col}`);
  }

  const handleCellKeyDown = (e: KeyboardEvent) => {
    if (!activeCell) return

    if (e.key === "Enter") {
      if (isEditing) {
        updateCell(activeCell, editValue)
        setIsEditing(false)
      } else {
        // Get the appropriate value to edit - if it's a formula, edit the formula
        const valueToEdit = isCellFormula(activeCell) && cells[activeCell]?.formula 
          ? cells[activeCell].formula 
          : (cells[activeCell]?.value || "")
          
        setEditValue(valueToEdit)
        setIsEditing(true)
        setSelection(null)
      }
      e.preventDefault()
    } else if (e.key === "Escape" && isEditing) {
      setIsEditing(false)
      e.preventDefault()
    } else if (!isEditing) {
      const activePos = getCellPosition(activeCell)
      let newRow = activePos.row
      let newCol = activePos.col

      // Navigation with arrow keys
      if (e.key === "ArrowUp") newRow = Math.max(0, activePos.row - 1)
      else if (e.key === "ArrowDown") newRow = Math.min(99, activePos.row + 1)
      else if (e.key === "ArrowLeft") newCol = Math.max(0, activePos.col - 1)
      else if (e.key === "ArrowRight") newCol = Math.min(25, activePos.col + 1)
      else return

      const newCellId = getCellId({ row: newRow, col: newCol })
      setActiveCell(newCellId)

      // If shift is pressed, extend the selection
      if (e.shiftKey) {
        setSelection({
          start: selection?.start || activePos,
          end: { row: newRow, col: newCol },
        })
      } else if (!e.ctrlKey) {
        // Clear selection if shift is not pressed
        setSelection({
          start: { row: newRow, col: newCol },
          end: { row: newRow, col: newCol },
        })
      }

      e.preventDefault()
    }

    console.log(`Key pressed: ${e.key}`);
  }

  const handleCellChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
    console.log(`Cell edit value changed: ${e.target.value}`)
  }

  const handleCellBlur = () => {
    if (isEditing && activeCell) {
      updateCell(activeCell, editValue)
      setIsEditing(false)
    }
    console.log(`Cell edit completed. New value: ${editValue}`)
  }

  // Handle typing directly without double click (auto-start edit mode)
  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isEditing && activeCell && e.key.length === 1) {
      setEditValue(e.key)
      setIsEditing(true)
      e.preventDefault()
    }
  }

  // Check if a cell is in the current selection
  const isCellSelected = (row: number, col: number): boolean => {
    if (!selection) return false

    const startRow = Math.min(selection.start.row, selection.end.row)
    const endRow = Math.max(selection.start.row, selection.end.row)
    const startCol = Math.min(selection.start.col, selection.end.col)
    const endCol = Math.max(selection.start.col, selection.end.col)

    return row >= startRow && row <= endRow && col >= startCol && col <= endCol
  }

  // Check if an entire column is selected (for header highlighting)
  const isEntireColumnSelected = (colIndex: number): boolean => {
    if (!selection) return false
    
    const startCol = Math.min(selection.start.col, selection.end.col)
    const endCol = Math.max(selection.start.col, selection.end.col)
    const startRow = Math.min(selection.start.row, selection.end.row)
    const endRow = Math.max(selection.start.row, selection.end.row)
    
    return colIndex >= startCol && colIndex <= endCol && startRow === 0 && endRow === 99
  }
  
  // Check if an entire row is selected (for header highlighting)
  const isEntireRowSelected = (rowIndex: number): boolean => {
    if (!selection) return false
    
    const startRow = Math.min(selection.start.row, selection.end.row)
    const endRow = Math.max(selection.start.row, selection.end.row)
    const startCol = Math.min(selection.start.col, selection.end.col)
    const endCol = Math.max(selection.start.col, selection.end.col)
    
    return rowIndex >= startRow && rowIndex <= endRow && startCol === 0 && endCol === 25
  }

  // Log component render
  useEffect(() => {
    console.log("SpreadsheetGrid rendered");
    return () => {
      console.log("SpreadsheetGrid unmounted");
    };
  }, []);

  // Hook into selection changes to log them
  useEffect(() => {
    if (selection) {
      console.log("Selection changed:", selection);
      console.log("Selected cells:", getSelectedCells());
    }
  }, [selection, getSelectedCells]);

  // Helper function to get merge information for a cell
  const getCellMergeInfo = (row: number, col: number) => {
    const cellId = getCellId({ row, col });
    
    if (isCellPartOfMerge(cellId)) {
      const parentId = getMergeParent(cellId);
      const isParent = isCellMergeParent(cellId);
      
      if (parentId && cells[parentId]?.mergeInfo?.mergeArea) {
        const mergeArea = cells[parentId].mergeInfo.mergeArea;
        
        // Calculate dimensions of the merged area
        const mergeWidth = mergeArea.endCol - mergeArea.startCol + 1;
        const mergeHeight = mergeArea.endRow - mergeArea.startRow + 1;
        
        return {
          isMerged: true,
          isParent,
          parentId,
          mergeArea,
          mergeWidth,
          mergeHeight
        };
      }
    }
    
    return {
      isMerged: false,
      isParent: false,
      parentId: null,
      mergeArea: null,
      mergeWidth: 1,
      mergeHeight: 1
    };
  };

  return (
    <div 
      className="relative overflow-auto h-full" 
      tabIndex={0} 
      onKeyDown={handleCellKeyDown} 
      onKeyPress={handleKeyPress}
      ref={gridRef}
      style={isSelecting || isResizingColumn || isResizingRow ? preventSelectionStyle : undefined}
    >
      <div 
        className="inline-block min-w-full origin-top-left"
        style={{ 
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top left',
          width: `${(100 / zoomLevel) * 100}%`,
          height: `${(100 / zoomLevel) * 100}%`
        }}
      >
        {/* Column and Row Headers (Sticky) */}
        <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: `40px ${columnWidths.map(w => `${w}px`).join(' ')}` }}>
          {/* Empty corner cell */}
          <div className="h-8 bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center" style={preventSelectionStyle}></div>

          {/* Column headers */}
          {columnHeaders.map((header, colIndex) => (
            <ClientSideContextMenu key={header}>
              <ClientSideContextMenuTrigger>
                <div className="relative">
                  <div
                    className={cn(
                      "h-8 bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors",
                      isEntireColumnSelected(colIndex) && "bg-gray-200"
                    )}
                    style={preventSelectionStyle}
                    onClick={(e) => handleColumnHeaderClick(colIndex, e)}
                  >
                    {header}
                  </div>
                  {/* Column resize handle */}
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-600 group",
                      isResizingColumn && resizingColumn === colIndex && "bg-gray-800"
                    )}
                    onMouseDown={(e) => handleColumnResizeStart(e, colIndex)}
                  >
                    <div className="absolute inset-y-0 right-0 w-4 -mr-2" />
                  </div>
                </div>
              </ClientSideContextMenuTrigger>
              <ClientSideContextMenuContent className="w-48">
                <ClientSideContextMenuItem inset onSelect={() => {
                  setSelection({
                    start: { row: 0, col: colIndex },
                    end: { row: 99, col: colIndex }
                  });
                  copySelection();
                }}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Column
                </ClientSideContextMenuItem>
                <ClientSideContextMenuItem inset onSelect={() => {
                  setSelection({
                    start: { row: 0, col: colIndex },
                    end: { row: 99, col: colIndex }
                  });
                  cutSelection();
                }}>
                  <Scissors className="mr-2 h-4 w-4" /> Cut Column
                </ClientSideContextMenuItem>
                <ClientSideContextMenuItem inset onSelect={() => {
                  setSelection({
                    start: { row: 0, col: colIndex },
                    end: { row: 99, col: colIndex }
                  });
                  pasteSelection();
                }}>
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Paste Column
                </ClientSideContextMenuItem>
              </ClientSideContextMenuContent>
            </ClientSideContextMenu>
          ))}
        </div>

        {/* Grid Content Area - Wrapped in Context Menu */}
        <ClientSideContextMenu>
          <ClientSideContextMenuTrigger>
            <div className="relative" style={{ width: 'fit-content' }}>
              {/* Grid rows */}
              {rowHeaders.map((rowNum, rowIndex) => (
                <div key={rowNum} className="grid relative" style={{ gridTemplateColumns: `40px ${columnWidths.map(w => `${w}px`).join(' ')}` }}>
                  {/* Row header */}
                  <ClientSideContextMenu>
                    <ClientSideContextMenuTrigger>
                      <div 
                        className={cn(
                          "bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center font-medium text-gray-600 sticky left-0 z-10 cursor-pointer hover:bg-gray-200 transition-colors relative",
                          isEntireRowSelected(rowIndex) && "bg-gray-200"
                        )}
                        style={{
                          ...preventSelectionStyle,
                          height: `${rowHeights[rowIndex]}px`,
                        }}
                        onClick={(e) => handleRowHeaderClick(rowIndex, e)}
                      >
                        {rowNum}
                        
                        {/* Row resize handle */}
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 h-1 w-full cursor-row-resize hover:bg-gray-600",
                            isResizingRow && resizingRow === rowIndex && "bg-gray-800"
                          )}
                          onMouseDown={(e) => handleRowResizeStart(e, rowIndex)}
                        >
                          <div className="absolute inset-x-0 bottom-0 h-4 -mb-2" />
                        </div>
                      </div>
                    </ClientSideContextMenuTrigger>
                    <ClientSideContextMenuContent className="w-48">
                      <ClientSideContextMenuItem inset onSelect={() => {
                        setSelection({
                          start: { row: rowIndex, col: 0 },
                          end: { row: rowIndex, col: 25 }
                        });
                        copySelection();
                      }}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Row
                      </ClientSideContextMenuItem>
                      <ClientSideContextMenuItem inset onSelect={() => {
                        setSelection({
                          start: { row: rowIndex, col: 0 },
                          end: { row: rowIndex, col: 25 }
                        });
                        cutSelection();
                      }}>
                        <Scissors className="mr-2 h-4 w-4" /> Cut Row
                      </ClientSideContextMenuItem>
                      <ClientSideContextMenuItem inset onSelect={() => {
                        setSelection({
                          start: { row: rowIndex, col: 0 },
                          end: { row: rowIndex, col: 25 }
                        });
                        pasteSelection();
                      }}>
                        <ClipboardPaste className="mr-2 h-4 w-4" /> Paste Row
                      </ClientSideContextMenuItem>
                    </ClientSideContextMenuContent>
                  </ClientSideContextMenu>

                  {/* Row cells */}
                  {columnHeaders.map((colLetter, colIndex) => {
                    const cellId = getCellId({ row: rowIndex, col: colIndex })
                    const { isMerged, isParent, mergeWidth, mergeHeight } = getCellMergeInfo(rowIndex, colIndex)
                    const isActive = activeCell === cellId
                    const isSelected = isCellSelected(rowIndex, colIndex)

                    // Skip rendering if this is a merged child cell
                    if (isMerged && !isParent) {
                      return null;
                    }

                    return (
                      // Cell div - ContextMenu is now outside this loop
                      <div
                        key={`${rowIndex}-${colIndex}-div`}
                        className={cn(
                          "border-b border-r border-gray-200 relative",
                          isActive && "outline outline-2 outline-gray-800 z-20",
                          isSelected && !isActive && "bg-gray-100/70",
                          isActive && isSelected && "bg-gray-200",
                        )}
                        style={{
                          height: `${rowHeights[rowIndex]}px`,
                          ...((!isEditing) ? preventSelectionStyle : undefined),
                          gridColumn: isParent ? `span ${mergeWidth}` : undefined,
                          gridRow: isParent ? `span ${mergeHeight}` : undefined
                        }}
                        onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                        onMouseMove={(e) => handleCellMouseMove(rowIndex, colIndex, e)}
                        onMouseUp={handleCellMouseUp}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isActive && isEditing ? (
                          <input
                            className="absolute inset-0 w-full h-full px-2 border-none outline-none bg-white"
                            value={editValue}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                            autoFocus
                          />
                        ) : (
                          <Cell
                            data={cells[cellId]}
                            isEditing={false}
                            editValue=""
                            isMerged={isMerged}
                            isParentCell={isParent}
                            mergeWidth={mergeWidth}
                            mergeHeight={mergeHeight}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </ClientSideContextMenuTrigger>
          {/* Single Context Menu Content for the Grid */}
          <ClientSideContextMenuContent className="w-48">
            <ClientSideContextMenuItem inset onSelect={copySelection}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </ClientSideContextMenuItem>
            <ClientSideContextMenuItem inset onSelect={cutSelection}>
              <Scissors className="mr-2 h-4 w-4" /> Cut
            </ClientSideContextMenuItem>
            <ClientSideContextMenuItem inset onSelect={pasteSelection}>
              <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
            </ClientSideContextMenuItem>
          </ClientSideContextMenuContent>
        </ClientSideContextMenu>
      </div>
    </div>
  )
}