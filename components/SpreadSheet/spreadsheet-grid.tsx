"use client"

import { useRef, useState, useEffect, type MouseEvent, type KeyboardEvent, type ChangeEvent } from "react"
import { cn } from "@/lib/utils"
import { useSpreadsheet } from "@/context/spreadsheet-context"

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
    undo,
    redo,
  } = useSpreadsheet()

  const gridRef = useRef<HTMLDivElement>(null)
  const [editValue, setEditValue] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null)
  const [mouseDownStartPos, setMouseDownStartPos] = useState<{ x: number; y: number } | null>(null)

  // Generate column headers (A-Z)
  const columnHeaders = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  // Generate row headers (1-100)
  const rowHeaders = Array.from({ length: 100 }, (_, i) => i + 1)

  // Prevent default browser text selection behavior
  useEffect(() => {
    const preventDefaultSelection = (e: MouseEvent) => {
      if (isSelecting) {
        e.preventDefault()
      }
    }

    // Apply to document to catch all selection attempts
    document.addEventListener('selectstart', preventDefaultSelection as any)
    return () => {
      document.removeEventListener('selectstart', preventDefaultSelection as any)
    }
  }, [isSelecting])

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
      } else {
        // For single click, just set the selection to the clicked cell
        setSelection({
          start: { row, col },
          end: { row, col },
        })
        
        // Don't start selection mode immediately, wait to see if user drags
        setSelectionStart({ row, col })
      }
    }

    console.log(`Cell mouse down at row: ${row}, col: ${col}`);
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

  return (
    <div 
      className="relative overflow-auto h-full" 
      tabIndex={0} 
      onKeyDown={handleCellKeyDown} 
      onKeyPress={handleKeyPress}
      ref={gridRef}
      style={isSelecting ? preventSelectionStyle : undefined}
    >
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-[40px_repeat(26,100px)] sticky top-0 z-10">
          {/* Empty corner cell */}
          <div className="h-10 bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center" style={preventSelectionStyle}></div>

          {/* Column headers */}
          {columnHeaders.map((header, colIndex) => (
            <div
              key={header}
              className={cn(
                "h-10 bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors",
                isEntireColumnSelected(colIndex) && "bg-blue-100"
              )}
              style={preventSelectionStyle}
              onClick={(e) => handleColumnHeaderClick(colIndex, e)}
            >
              {header}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {rowHeaders.map((rowNum, rowIndex) => (
          <div key={rowNum} className="grid grid-cols-[40px_repeat(26,100px)]">
            {/* Row header */}
            <div 
              className={cn(
                "h-8 bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center font-medium text-gray-600 sticky left-0 z-10 cursor-pointer hover:bg-gray-200 transition-colors",
                isEntireRowSelected(rowIndex) && "bg-blue-100"
              )}
              style={preventSelectionStyle}
              onClick={(e) => handleRowHeaderClick(rowIndex, e)}
            >
              {rowNum}
            </div>

            {/* Row cells */}
            {columnHeaders.map((colLetter, colIndex) => {
              const cellId = getCellId({ row: rowIndex, col: colIndex })
              const isActive = activeCell === cellId
              const isSelected = isCellSelected(rowIndex, colIndex)

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "h-8 border-b border-r border-gray-200 relative",
                    isActive && "outline outline-2 outline-blue-500 z-20",
                    isSelected && !isActive && "bg-blue-50/70",
                    isActive && isSelected && "bg-blue-100",
                  )}
                  onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                  onMouseMove={(e) => handleCellMouseMove(rowIndex, colIndex, e)}
                  onMouseUp={handleCellMouseUp}
                  onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                  style={!isEditing ? preventSelectionStyle : undefined}
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
                    <div
                      className={cn(
                        "px-2 py-1 overflow-hidden text-sm whitespace-nowrap h-full flex items-center",
                        cells[cellId]?.error && "text-red-500"
                      )}
                      style={{
                        fontFamily:
                          cells[cellId]?.format?.fontFamily === "serif"
                            ? "serif"
                            : cells[cellId]?.format?.fontFamily === "mono"
                              ? "monospace"
                              : cells[cellId]?.format?.fontFamily === "inter"
                                ? "Inter, sans-serif"
                                : cells[cellId]?.format?.fontFamily === "roboto"
                                  ? "Roboto, sans-serif"
                                  : cells[cellId]?.format?.fontFamily === "poppins"
                                    ? "Poppins, sans-serif"
                                    : "sans-serif",
                        fontSize:
                          cells[cellId]?.format?.fontSize === "xs"
                            ? "10px"
                            : cells[cellId]?.format?.fontSize === "sm"
                              ? "12px"
                              : cells[cellId]?.format?.fontSize === "lg"
                                ? "16px"
                                : cells[cellId]?.format?.fontSize === "xl"
                                  ? "18px"
                                  : cells[cellId]?.format?.fontSize === "2xl"
                                    ? "20px"
                                    : cells[cellId]?.format?.fontSize === "3xl"
                                      ? "24px"
                                      : "14px",
                        fontWeight: cells[cellId]?.format?.bold ? "bold" : "normal",
                        fontStyle: cells[cellId]?.format?.italic ? "italic" : "normal",
                        textDecoration: cells[cellId]?.format?.underline ? "underline" : "none",
                        textAlign: cells[cellId]?.format?.align || "left",
                        color: cells[cellId]?.error ? "red" : (cells[cellId]?.format?.textColor || "inherit"),
                        backgroundColor: cells[cellId]?.format?.fillColor || "transparent",
                        width: "100%",
                        justifyContent:
                          cells[cellId]?.format?.align === "center"
                            ? "center"
                            : cells[cellId]?.format?.align === "right"
                              ? "flex-end"
                              : "flex-start",
                        ...(preventSelectionStyle as any),
                      }}
                    >
                      {/* Display calculated value for formulas, otherwise show raw value */}
                      {isCellFormula(cellId) ? getCellDisplayValue(cellId) : cells[cellId]?.value || ""}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

