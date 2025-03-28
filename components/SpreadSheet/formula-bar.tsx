"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { useSpreadsheet } from "@/context/spreadsheet-context"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function FormulaBar() {
  const { 
    activeCell, 
    cells, 
    updateCell, 
    isCellFormula,
    getCellError
  } = useSpreadsheet()
  
  const [formula, setFormula] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)
  
  // Update formula when active cell changes
  useEffect(() => {
    if (activeCell) {
      console.log(`Active cell changed to: ${activeCell}`);
      
      // Always show the raw formula for formula cells
      if (isCellFormula(activeCell) && cells[activeCell]?.formula) {
        const formulaValue = cells[activeCell]?.formula || "";
        console.log(`Loading formula: ${formulaValue}`);
        setFormula(formulaValue);
      } else {
        // Otherwise show the value
        const cellValue = cells[activeCell]?.value || "";
        console.log(`Loading cell value: ${cellValue}`);
        setFormula(cellValue);
      }
    } else {
      setFormula("");
    }
    setIsEditing(false);
  }, [activeCell, cells, isCellFormula])
  
  const handleFormulaChange = (value: string) => {
    console.log(`Formula being edited: ${value}`);
    setFormula(value);
    setIsEditing(true);
  }
  
  const handleFormulaKeyDown = (e: KeyboardEvent) => {
    console.log(`Formula bar key pressed: ${e.key}`);
    
    if (e.key === "Enter" && activeCell) {
      console.log(`Committing formula to cell ${activeCell}: ${formula}`);
      // Apply the formula or value to the active cell
      updateCell(activeCell, formula);
      setIsEditing(false);
      e.preventDefault();
    } else if (e.key === "Escape") {
      console.log("Formula edit canceled with Escape key");
      // Reset the formula to the original value
      if (activeCell) {
        if (isCellFormula(activeCell) && cells[activeCell]?.formula) {
          setFormula(cells[activeCell]?.formula || "")
        } else {
          setFormula(cells[activeCell]?.value || "")
        }
      } else {
        setFormula("")
      }
      setIsEditing(false)
      e.preventDefault()
    }
  }
  
  const handleFormulaBlur = () => {
    if (isEditing && activeCell) {
      console.log(`Formula bar lost focus, updating cell ${activeCell} with: ${formula}`);
      updateCell(activeCell, formula);
      setIsEditing(false);
    }
  }
  
  // Check if the current cell has an error
  const hasError = activeCell ? !!getCellError(activeCell) : false
  if (hasError && activeCell) {
    console.error(`Formula error in cell ${activeCell}:`, getCellError(activeCell));
  }
  
  return (
    <div className="flex items-center px-2 py-1 border-b border-gray-200 bg-gray-50">
      <div className="w-16 flex-shrink-0 font-medium text-gray-500 text-sm">
        {activeCell || ""}
      </div>
      <div className="flex-grow mx-2">
        <Input
          type="text"
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          onKeyDown={handleFormulaKeyDown}
          onBlur={handleFormulaBlur}
          placeholder="Enter value or formula (start with =)"
          className={cn(
            "h-8 font-mono",
            hasError && "border-red-500 text-red-500"
          )}
        />
      </div>
    </div>
  )
} 