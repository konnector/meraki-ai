import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSpreadsheet } from "@/context/spreadsheet-context"
import { AlignJustify } from "lucide-react"
import { useCallback, useRef } from "react"

export const AutoResizeColumns = () => {
  const { cells, getCellPosition } = useSpreadsheet()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  // Create a function to measure text width
  const measureTextWidth = useCallback((text: string, fontStyle: string = ''): number => {
    // Make sure we have a canvas to measure with
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    
    const context = canvasRef.current.getContext('2d')
    if (!context) return 0
    
    // Set the font style
    context.font = fontStyle || '14px sans-serif' // default font
    
    // Measure the text width
    const metrics = context.measureText(text)
    
    // Add some padding
    return Math.ceil(metrics.width) + 16 // 8px padding on each side
  }, [])
  
  // Auto resize all columns based on content
  const autoResizeColumns = useCallback(() => {
    // Get all cell IDs
    const cellIds = Object.keys(cells)
    if (cellIds.length === 0) return
    
    // Create an array to store max width for each column
    const columnWidths: number[] = Array(26).fill(100) // Default 100px width
    
    // Calculate the required width for each cell
    cellIds.forEach(cellId => {
      const { col } = getCellPosition(cellId)
      const cell = cells[cellId]
      
      if (!cell || !cell.value) return
      
      // Determine display value
      const displayValue = cell.formula?.startsWith('=') 
        ? String(cell.calculatedValue || '')
        : cell.value
      
      // Skip empty cells
      if (!displayValue.trim()) return
      
      // Determine font style based on cell formatting
      let fontStyle = ''
      if (cell.format) {
        const fontSize = cell.format.fontSize === 'xs' 
          ? '10px'
          : cell.format.fontSize === 'sm'
            ? '12px'
            : cell.format.fontSize === 'lg'
              ? '16px'
              : cell.format.fontSize === 'xl'
                ? '18px'
                : cell.format.fontSize === '2xl'
                  ? '20px'
                  : cell.format.fontSize === '3xl'
                    ? '24px'
                    : '14px'
        
        const fontFamily = cell.format.fontFamily === 'serif'
          ? 'serif'
          : cell.format.fontFamily === 'mono'
            ? 'monospace'
            : cell.format.fontFamily === 'inter'
              ? 'Inter, sans-serif'
              : cell.format.fontFamily === 'roboto'
                ? 'Roboto, sans-serif'
                : cell.format.fontFamily === 'poppins'
                  ? 'Poppins, sans-serif'
                  : 'sans-serif'
        
        const fontWeight = cell.format.bold ? 'bold' : 'normal'
        const fontStyleValue = cell.format.italic ? 'italic' : 'normal'
        
        fontStyle = `${fontWeight} ${fontStyleValue} ${fontSize} ${fontFamily}`
      }
      
      // Measure the text width
      const textWidth = measureTextWidth(displayValue, fontStyle)
      
      // Update column width if this cell requires more width
      if (textWidth > columnWidths[col]) {
        columnWidths[col] = textWidth
      }
    })
    
    // Dispatch a custom event to update column widths
    // This approach works without modifying your grid component directly
    window.dispatchEvent(new CustomEvent('resize-columns', { 
      detail: { columnWidths } 
    }))
  }, [cells, getCellPosition, measureTextWidth])
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={autoResizeColumns}
            className="h-8 px-2"
          >
            <AlignJustify className="h-4 w-4 mr-1" />
            Auto-fit Columns
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Resize columns to fit content</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Hidden canvas for text measurement */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </TooltipProvider>
  )
}