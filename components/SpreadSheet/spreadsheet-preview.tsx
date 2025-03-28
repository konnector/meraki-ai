import { type CellData } from "@/lib/supabase/types"

interface SpreadsheetPreviewProps {
  cells: { [key: string]: CellData }
}

export default function SpreadsheetPreview({ cells }: SpreadsheetPreviewProps) {
  // Generate column headers (A-D)
  const columnHeaders = Array.from({ length: 4 }, (_, i) => String.fromCharCode(65 + i))

  // Generate row headers (1-4)
  const rowHeaders = Array.from({ length: 4 }, (_, i) => i + 1)

  // Helper function to get cell ID from position
  const getCellId = (row: number, col: number) => {
    const column = String.fromCharCode(65 + col)
    const rowNum = row + 1
    return `${column}${rowNum}`
  }

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-[repeat(4,1fr)] gap-[1px] bg-gray-200">
        {/* Grid cells */}
        {rowHeaders.map((_, rowIndex) => (
          columnHeaders.map((_, colIndex) => {
            const cellId = getCellId(rowIndex, colIndex)
            const cell = cells[cellId]
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="bg-white h-8 flex items-center px-1 overflow-hidden"
              >
                <div 
                  className="text-[10px] truncate text-gray-600"
                  style={{
                    fontWeight: cell?.format?.bold ? "bold" : "normal",
                    fontStyle: cell?.format?.italic ? "italic" : "normal",
                    textDecoration: cell?.format?.underline ? "underline" : "none",
                    textAlign: cell?.format?.align || "left",
                    color: cell?.format?.color || "inherit",
                    backgroundColor: cell?.format?.backgroundColor || "transparent",
                  }}
                >
                  {cell?.value || ""}
                </div>
              </div>
            )
          })
        ))}
      </div>
    </div>
  )
} 