"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useRef, useEffect } from "react"
import { FormulaParser } from "@/lib/spreadsheet/FormulaParser"
import { useFormulaCalculation } from "@/hooks/useFormulaCalculation"
import { HistoryManager } from "@/lib/spreadsheet/HistoryManager"
import { useSpreadsheetApi } from '@/lib/supabase/secure-api'

// Update this in your spreadsheet-context.tsx file
type CellFormat = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: "left" | "center" | "right"
  fontFamily?: string
  fontSize?: string
  type?: "text" | "number" | "formula"
  textColor?: string
  fillColor?: string
  // Add these new properties for number formatting
  numberFormat?: "general" | "number" | "currency" | "percent" | "date" | "time"
  decimals?: number
  currencySymbol?: string
  dateFormat?: string
  timeFormat?: string
}

type ImportOptions = {
  clearExisting?: boolean;
  startCell?: string;
}

type ExportOptions = {
  includeFormatting?: boolean;
  onlySelection?: boolean;
  fileType?: 'csv' | 'json';
}

type Cell = {
  value: string
  formula?: string
  calculatedValue?: any
  error?: string
  format?: CellFormat
}

export type Cells = {
  [key: string]: Cell
}

type CellPosition = {
  row: number
  col: number
}

type Selection = {
  start: { row: number; col: number }
  end: { row: number; col: number }
} | null

type SpreadsheetContextType = {
  cells: Cells
  activeCell: string | null
  selection: Selection
  title: string
  isStarred: boolean
  isLoading: boolean
  zoomLevel: number
  setZoomLevel: (level: number) => void
  setTitle: (title: string) => void
  toggleStar: () => void
  updateCell: (cellId: string, value: string) => void
  updateCellFormat: (cellId: string, format: Partial<CellFormat>) => void
  updateMultipleCellsFormat: (cellIds: string[], format: Partial<CellFormat>) => void
  setActiveCell: (cellId: string | null) => void
  isCellFormula: (cellId: string) => boolean
  getCellError: (cellId: string) => string | undefined
  setSelection: (selection: Selection) => void
  copySelection: () => void
  cutSelection: () => void
  pasteSelection: () => void
  deleteSelection: () => void
  getCellId: (position: CellPosition) => string
  getCellPosition: (cellId: string) => CellPosition
  getSelectedCells: () => string[]
  getCellDisplayValue: (cellId: string) => string
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  importData: (data: string, options?: ImportOptions) => void
  exportData: (options?: ExportOptions) => string
}

const SpreadsheetContext = createContext<SpreadsheetContextType | null>(null)

export function useSpreadsheet() {
  const context = useContext(SpreadsheetContext)
  if (!context) {
    throw new Error("useSpreadsheet must be used within a SpreadsheetProvider")
  }
  return context
}

export function SpreadsheetProvider({ children, spreadsheetId }: { children: ReactNode, spreadsheetId?: string }) {
  // Initialize state with empty values first
  const [cells, setCells] = useState<Cells>({});
  const [title, setTitle] = useState<string>("Untitled Spreadsheet");
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [clipboard, setClipboard] = useState<{cells: Cells, startCell: string} | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const historyManager = useRef(new HistoryManager());
  const isHistoryAction = useRef(false);
  const spreadsheetApi = useSpreadsheetApi();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Add formula calculation hook
  const { updateDependencies, calculateFormula, getAffectedCells } = useFormulaCalculation();

  // Load initial spreadsheet data
  useEffect(() => {
    if (spreadsheetId) {
      const loadSpreadsheet = async () => {
        setIsLoading(true);
        try {
          const result = await spreadsheetApi.getSpreadsheet(spreadsheetId);
          if (result.data) {
            const { title: loadedTitle, data } = result.data;
            setTitle(loadedTitle || "Untitled Spreadsheet");
            setCells(data?.cells || {});
            setIsStarred(data?.isStarred || false);
          }
        } catch (err) {
          console.error('Failed to load spreadsheet:', err);
        } finally {
          setIsLoading(false);
        }
      };
      loadSpreadsheet();
    } else {
      setIsLoading(false);
    }
  }, [spreadsheetId]);

  // Debounced save function
  const saveSpreadsheetData = useCallback(async () => {
    if (!spreadsheetId) return;

    try {
      await spreadsheetApi.updateSpreadsheet(spreadsheetId, {
        cells,
        isStarred,
        meta: {
          rowCount: 100, // Default grid size
          columnCount: 26, // A-Z columns
          lastModified: new Date().toISOString(),
        }
      });
    } catch (err) {
      console.error('Failed to save spreadsheet:', err);
    }
  }, [spreadsheetId, cells, isStarred]);

  // Setup debounced save
  useEffect(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(saveSpreadsheetData, 1000);
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [cells, title, isStarred, saveSpreadsheetData]);

  // Wrap setTitle to handle state and saving
  const handleSetTitle = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    if (spreadsheetId) {
      try {
        // Get current spreadsheet data
        const result = await spreadsheetApi.getSpreadsheet(spreadsheetId);
        if (result.data) {
          // Update both the title and spreadsheet data
          await spreadsheetApi.updateSpreadsheet(spreadsheetId, {
            cells,
            isStarred,
            meta: {
              rowCount: 100,
              columnCount: 26,
              lastModified: new Date().toISOString(),
            }
          });

          // Make a separate call to update the title in the spreadsheets table
          await spreadsheetApi.updateTitle(spreadsheetId, newTitle);
        }
      } catch (err) {
        console.error('Failed to update spreadsheet title:', err);
      }
    }
  }, [spreadsheetId, spreadsheetApi, cells, isStarred]);

  // Add star toggle function
  const toggleStar = useCallback(async () => {
    setIsStarred(prev => !prev);
    if (spreadsheetId) {
      try {
        await spreadsheetApi.updateSpreadsheet(spreadsheetId, {
          cells,
          isStarred: !isStarred,
          meta: {
            rowCount: 100,
            columnCount: 26,
            lastModified: new Date().toISOString(),
          }
        });
      } catch (err) {
        console.error('Failed to update spreadsheet star status:', err);
        // Revert the state if the API call fails
        setIsStarred(isStarred);
      }
    }
  }, [spreadsheetId, spreadsheetApi, cells, isStarred]);

  // Function to save current state to history
  const saveToHistory = useCallback(() => {
    if (!isHistoryAction.current) {
      historyManager.current.push({
        cells,
        activeCell,
        selection,
      });
    }
    isHistoryAction.current = false;
  }, [cells, activeCell, selection]);

  // Undo function
  const undo = useCallback(() => {
    const previousState = historyManager.current.undo({
      cells,
      activeCell,
      selection,
    });

    if (previousState) {
      isHistoryAction.current = true;
      setCells(previousState.cells);
      setActiveCell(previousState.activeCell);
      setSelection(previousState.selection);
    }
  }, [cells, activeCell, selection]);

  // Redo function
  const redo = useCallback(() => {
    const nextState = historyManager.current.redo({
      cells,
      activeCell,
      selection,
    });

    if (nextState) {
      isHistoryAction.current = true;
      setCells(nextState.cells);
      setActiveCell(nextState.activeCell);
      setSelection(nextState.selection);
    }
  }, [cells, activeCell, selection]);

  // Update the setActiveCell function to not trigger history
  const setActiveCellWithoutHistory = useCallback((cellId: string | null) => {
    setActiveCell(cellId);
  }, []);

  // Update the setSelection function to not trigger history
  const setSelectionWithoutHistory = useCallback((newSelection: Selection) => {
    setSelection(newSelection);
  }, []);

  // Helper function to determine the dependency depth of a cell
  const dependencyDepth = (cellId: string, cells: Cells): number => {
    if (!cells[cellId]?.formula) return 0;
    
    const formula = FormulaParser.parseFormula(cells[cellId].formula!);
    if (!formula || formula.dependencies.length === 0) return 1;
    
    let maxDepth = 0;
    formula.dependencies.forEach(depId => {
      // Avoid circular dependencies
      if (depId !== cellId) {
        const depth = dependencyDepth(depId, cells) + 1;
        maxDepth = Math.max(maxDepth, depth);
      }
    });
    
    return maxDepth;
  };

  // Update cell with formula support (modified version)
  const updateCell = useCallback((cellId: string, value: string) => {
    // Set active cell when updating
    setActiveCell(cellId);
    
    setCells(prev => {
      const newCells = { ...prev };
      const oldValue = prev[cellId]?.value;
      
      // Only proceed if the value is actually different
      if (oldValue === value) {
        return prev;
      }
      
      // Check if the value is a formula
      if (value.startsWith('=')) {
        try {
          // Parse the formula
          const formula = FormulaParser.parseFormula(value);
          if (!formula) {
            throw new Error('Invalid formula');
          }

          // Update dependencies
          updateDependencies(cellId, formula);

          // Define a more robust getCellValue function
          const getCellValue = (depCellId: string): number => {
            // First check if this is a formula cell with a calculated value
            if (newCells[depCellId]?.formula && newCells[depCellId]?.calculatedValue !== undefined) {
              const numValue = Number(newCells[depCellId]?.calculatedValue);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
            
            // Then try the cell's regular value
            const numValue = Number(newCells[depCellId]?.value || '0');
            if (isNaN(numValue)) {
              console.warn(`Invalid number in cell ${depCellId}`);
              return 0; // Return 0 instead of throwing to be more forgiving
            }
            return numValue;
          };

          const { value: calculatedValue, error } = calculateFormula(formula, getCellValue);

          newCells[cellId] = {
            ...newCells[cellId],
            value: value,
            formula: value,
            calculatedValue,
            error
          };

          // Recalculate dependent cells
          const affectedCells = getAffectedCells(cellId);
          
          // Sort affected cells to ensure they're calculated in the right order
          const processingOrder = [...affectedCells].sort((a, b) => {
            const aDepth = dependencyDepth(a, newCells);
            const bDepth = dependencyDepth(b, newCells);
            return aDepth - bDepth;
          });
          
          processingOrder.forEach(affectedCellId => {
            if (affectedCellId === cellId) return; // Skip the current cell
            
            const affectedCell = newCells[affectedCellId];
            if (!affectedCell?.formula) return; // Skip non-formula cells

            const affectedFormula = FormulaParser.parseFormula(affectedCell.formula);
            if (!affectedFormula) return;

            try {
              const { value: newValue, error } = calculateFormula(affectedFormula, getCellValue);
              newCells[affectedCellId] = {
                ...affectedCell,
                calculatedValue: newValue,
                error
              };
            } catch (err) {
              newCells[affectedCellId] = {
                ...affectedCell,
                calculatedValue: '#ERROR!',
                error: err instanceof Error ? err.message : 'Calculation error'
              };
            }
          });

          // Save to history after the update
          setTimeout(() => saveToHistory(), 0);
          return newCells;
        } catch (err) {
          newCells[cellId] = {
            ...newCells[cellId],
            value: value,
            formula: value,
            calculatedValue: '#ERROR!',
            error: err instanceof Error ? err.message : 'Formula error'
          };
          
          // Save to history after the update
          setTimeout(() => saveToHistory(), 0);
          return newCells;
        }
      } else {
        // Regular value update
        newCells[cellId] = {
          ...newCells[cellId],
          value: value,
          formula: undefined,
          calculatedValue: undefined,
          error: undefined
        };

        // Recalculate dependent cells since this cell's value changed
        const affectedCells = getAffectedCells(cellId);
        
        // Sort affected cells to ensure they're calculated in the right order
        const processingOrder = [...affectedCells].sort((a, b) => {
          const aDepth = dependencyDepth(a, newCells);
          const bDepth = dependencyDepth(b, newCells);
          return aDepth - bDepth;
        });
        
        processingOrder.forEach(affectedCellId => {
          const affectedCell = newCells[affectedCellId];
          if (!affectedCell?.formula) return;

          const affectedFormula = FormulaParser.parseFormula(affectedCell.formula);
          if (!affectedFormula) return;

          try {
            const getCellValue = (depCellId: string): number => {
              // First check if this is a formula cell with a calculated value
              if (newCells[depCellId]?.formula && newCells[depCellId]?.calculatedValue !== undefined) {
                const numValue = Number(newCells[depCellId]?.calculatedValue);
                if (!isNaN(numValue)) {
                  return numValue;
                }
              }
              
              // Then try the cell's regular value
              const numValue = Number(newCells[depCellId]?.value || '0');
              if (isNaN(numValue)) {
                console.warn(`Invalid number in cell ${depCellId}`);
                return 0; // Return 0 instead of throwing to be more forgiving
              }
              return numValue;
            };

            const { value: newValue, error } = calculateFormula(affectedFormula, getCellValue);
            newCells[affectedCellId] = {
              ...affectedCell,
              calculatedValue: newValue,
              error
            };
          } catch (err) {
            newCells[affectedCellId] = {
              ...affectedCell,
              calculatedValue: '#ERROR!',
              error: err instanceof Error ? err.message : 'Calculation error'
            };
          }
        });

        // Save to history after the update
        setTimeout(() => saveToHistory(), 0);
        return newCells;
      }
    });
  }, [saveToHistory, updateDependencies, calculateFormula, getAffectedCells, setActiveCell]);

  const updateCellFormat = useCallback((cellId: string, format: Partial<CellFormat>) => {
    setCells(prev => {
      const newCells = {
        ...prev,
        [cellId]: {
          ...prev[cellId],
          format: {
            ...prev[cellId]?.format,
            ...format
          }
        }
      };
      
      // Save to history after the update
      setTimeout(() => saveToHistory(), 0);
      return newCells;
    });
  }, [saveToHistory]);

  const updateMultipleCellsFormat = useCallback((cellIds: string[], format: Partial<CellFormat>) => {
    setCells(prev => {
      const newCells = { ...prev };
      
      cellIds.forEach(cellId => {
        newCells[cellId] = {
          ...newCells[cellId],
          format: {
            ...newCells[cellId]?.format,
            ...format
          }
        }
      });
      
      // Save to history after the update
      setTimeout(() => saveToHistory(), 0);
      return newCells;
    });
  }, [saveToHistory]);

  const isCellFormula = useCallback((cellId: string) => {
    return cells[cellId]?.formula !== undefined && cells[cellId]?.formula.startsWith('=')
  }, [cells])

  const getCellError = useCallback((cellId: string) => {
    return cells[cellId]?.error
  }, [cells])

  // Get cellId from row and column position (e.g., A1, B2, etc.)
  const getCellId = useCallback((position: CellPosition) => {
    const column = String.fromCharCode(65 + position.col); // A, B, C, ...
    const row = position.row + 1; // 1-indexed for rows
    return `${column}${row}`;
  }, []);

  // Get row and column position from cellId (e.g., A1 -> {row: 0, col: 0})
  const getCellPosition = useCallback((cellId: string) => {
    const column = cellId.charAt(0);
    const row = cellId.substring(1);
    return {
      row: parseInt(row) - 1, // 0-indexed for internal use
      col: column.charCodeAt(0) - 65, // A=0, B=1, ...
    };
  }, []);

  // Get all cells within the current selection
  const getSelectedCells = useCallback(() => {
    if (!selection) return [];
    
    const startRow = Math.min(selection.start.row, selection.end.row);
    const endRow = Math.max(selection.start.row, selection.end.row);
    const startCol = Math.min(selection.start.col, selection.end.col);
    const endCol = Math.max(selection.start.col, selection.end.col);
    
    const selected: string[] = [];
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        selected.push(getCellId({ row, col }));
      }
    }
    
    return selected;
  }, [selection, getCellId]);

  // Get display value for a cell (calculated value for formulas, or raw value)
  const getCellDisplayValue = useCallback((cellId: string) => {
    if (isCellFormula(cellId)) {
      return cells[cellId]?.calculatedValue !== undefined 
        ? String(cells[cellId].calculatedValue) 
        : cells[cellId]?.error || '';
    }
    return cells[cellId]?.value || '';
  }, [cells, isCellFormula]);

  // Copy selected cells to clipboard
  const copySelection = useCallback(() => {
    if (!selection || !activeCell) return;
    
    const selectedCells = getSelectedCells();
    if (selectedCells.length === 0) return;
    
    const clipboardCells: Cells = {};
    
    selectedCells.forEach(cellId => {
      if (cells[cellId]) {
        clipboardCells[cellId] = { ...cells[cellId] };
      }
    });
    
    setClipboard({
      cells: clipboardCells,
      startCell: selectedCells[0]
    });
    
    // Also copy to system clipboard if possible
    if (navigator.clipboard && window.isSecureContext) {
      try {
        // Just a simple text representation for system clipboard
        const text = selectedCells.map(id => cells[id]?.value || '').join('\t');
        navigator.clipboard.writeText(text);
      } catch (error) {
        console.error('Failed to copy to system clipboard:', error);
      }
    }
    
    console.log('Copied cells to clipboard:', selectedCells);
  }, [selection, activeCell, cells, getSelectedCells]);

  // Cut selected cells (copy + delete)
  const cutSelection = useCallback(() => {
    if (!selection) return;
    
    // First copy
    copySelection();
    
    // Then delete
    const selectedCells = getSelectedCells();
    setCells(prev => {
      const newCells = { ...prev };
      
      selectedCells.forEach(cellId => {
        if (newCells[cellId]) {
          newCells[cellId] = {
            ...newCells[cellId],
            value: '',
            formula: undefined,
            calculatedValue: undefined,
            error: undefined
          };
        }
      });
      
      return newCells;
    });
    
    console.log('Cut cells:', selectedCells);
  }, [selection, copySelection, getSelectedCells]);

  // Paste from clipboard to current active cell
  const pasteSelection = useCallback(() => {
    if (!activeCell || !clipboard) return;
    
    // Get the position of the target cell (where we're pasting to)
    const targetPos = getCellPosition(activeCell);
    // Get the position of the original copied cell
    const sourcePos = getCellPosition(clipboard.startCell);
    
    setCells(prev => {
      const newCells = { ...prev };
      
      // Calculate the offset between source and target
      const rowOffset = targetPos.row - sourcePos.row;
      const colOffset = targetPos.col - sourcePos.col;
      
      // For each cell in clipboard
      Object.entries(clipboard.cells).forEach(([cellId, cellData]) => {
        const sourcePos = getCellPosition(cellId);
        
        // Calculate new position with offset
        const newRow = sourcePos.row + rowOffset;
        const newCol = sourcePos.col + colOffset;
        
        // Skip if out of bounds (typical grid is 0-99 rows, 0-25 cols)
        if (newRow < 0 || newRow > 99 || newCol < 0 || newCol > 25) {
          return;
        }
        
        const newCellId = getCellId({ row: newRow, col: newCol });
        
        // Copy data to new position
        newCells[newCellId] = {
          ...cellData,
          // Adjust formula references if needed
          formula: cellData.formula ? adjustFormulaReferences(cellData.formula, rowOffset, colOffset) : undefined
        };
      });
      
      // Save to history after the update
      setTimeout(() => saveToHistory(), 0);
      return newCells;
    });
    
    console.log('Pasted from clipboard');
  }, [activeCell, clipboard, getCellPosition, getCellId, saveToHistory]);

  // Helper function to adjust formula references when pasting
  const adjustFormulaReferences = (formula: string, rowOffset: number, colOffset: number): string => {
    // This is a simple implementation - you might need to make it more sophisticated
    // based on your formula syntax
    return formula.replace(/([A-Z])(\d+)/g, (match, col, row) => {
      const newRow = parseInt(row) + rowOffset;
      const newCol = String.fromCharCode(col.charCodeAt(0) + colOffset);
      if (newRow < 1 || newRow > 100 || newCol < 'A' || newCol > 'Z') {
        return match; // Keep original reference if new reference would be out of bounds
      }
      return `${newCol}${newRow}`;
    });
  };

  // Delete content of selected cells
  const deleteSelection = useCallback(() => {
    if (!selection) return;
    
    const selectedCells = getSelectedCells();
    
    setCells(prev => {
      const newCells = { ...prev };
      
      selectedCells.forEach(cellId => {
        if (newCells[cellId]) {
          newCells[cellId] = {
            ...newCells[cellId],
            value: '',
            formula: undefined,
            calculatedValue: undefined,
            error: undefined
          };
        } else {
          newCells[cellId] = { value: '' };
        }
      });
      
      // Save to history after the update
      setTimeout(() => saveToHistory(), 0);
      return newCells;
    });
    
    console.log('Deleted selection:', selectedCells);
  }, [selection, getSelectedCells, saveToHistory]);

  const importData = useCallback((data: string, options: ImportOptions = {}) => {
    const { clearExisting = false, startCell = 'A1' } = options;
    
    // If clearExisting is true, clear all cells first
    if (clearExisting) {
      setCells({});
    }
    
    // Parse CSV content
    const lines = data.split('\n');
    if (lines.length === 0) return;
    
    // Get starting position
    const startPos = getCellPosition(startCell);
    
    // Save current state to history before import
    historyManager.current.push({
      cells,
      activeCell,
      selection
    });
    
    setCells(prev => {
      const newCells = { ...prev };
      
      // Process each line
      lines.forEach((line, lineIndex) => {
        if (!line.trim()) return; // Skip empty lines
        
        const rowIndex = startPos.row + lineIndex;
        let values: string[] = [];
        
        // Handle basic CSV parsing - this is a simple implementation
        // For more complex CSVs with quoted fields, consider using a CSV parser library
        if (line.includes('"')) {
          // There are quoted fields, need more careful parsing
          let inQuotes = false;
          let currentValue = '';
          let colValues: string[] = [];
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              // Toggle quote state
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              // End of field
              colValues.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          // Add the last value
          colValues.push(currentValue);
          values = colValues;
        } else {
          // Simple case - no quotes
          values = line.split(',');
        }
        
        // Update cells for each value in the row
        values.forEach((value, colIndex) => {
          const col = startPos.col + colIndex;
          const cellId = getCellId({ row: rowIndex, col });
          
          // Clean the value (remove quotes if present)
          let cleanValue = value.trim();
          if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.substring(1, cleanValue.length - 1).replace(/""/g, '"');
          }
          
          // Update the cell
          newCells[cellId] = {
            ...newCells[cellId],
            value: cleanValue,
            // If it's a formula, we need to handle it
            ...(cleanValue.startsWith('=') && {
              formula: cleanValue
            })
          };
        });
      });
      
      return newCells;
    });
    
    // After import, recalculate all formulas
    setTimeout(() => {
      // Recalculate all formulas
      setCells(prev => {
        const newCells = { ...prev };
        
        // Find all formula cells
        Object.entries(newCells).forEach(([cellId, cell]) => {
          if (cell.formula && cell.formula.startsWith('=')) {
            try {
              const formula = FormulaParser.parseFormula(cell.formula);
              if (!formula) return;
              
              // Update dependencies
              updateDependencies(cellId, formula);
              
              // Calculate formula
              const getCellValue = (depCellId: string) => {
                const numValue = Number(newCells[depCellId]?.value || '0');
                if (isNaN(numValue)) {
                  throw new Error(`Invalid number in cell ${depCellId}`);
                }
                return numValue;
              };
              
              const { value: calculatedValue, error } = calculateFormula(formula, getCellValue);
              
              newCells[cellId] = {
                ...newCells[cellId],
                calculatedValue,
                error
              };
            } catch (err) {
              newCells[cellId] = {
                ...newCells[cellId],
                calculatedValue: '#ERROR!',
                error: err instanceof Error ? err.message : 'Formula error'
              };
            }
          }
        });
        
        return newCells;
      });
    }, 0);
  }, [cells, getCellPosition, getCellId, updateDependencies, calculateFormula]);

  const exportData = useCallback((options: ExportOptions = {}) => {
    const { includeFormatting = false, onlySelection = false, fileType = 'csv' } = options;
    
    // Determine which cells to export
    let cellsToExport: string[] = [];
    
    if (onlySelection && selection) {
      cellsToExport = getSelectedCells();
    } else {
      cellsToExport = Object.keys(cells);
    }
    
    if (cellsToExport.length === 0) {
      return '';
    }
    
    // Find the dimensions of the data to export
    let minRow = Infinity;
    let maxRow = 0;
    let minCol = Infinity;
    let maxCol = 0;
    
    cellsToExport.forEach(cellId => {
      const pos = getCellPosition(cellId);
      minRow = Math.min(minRow, pos.row);
      maxRow = Math.max(maxRow, pos.row);
      minCol = Math.min(minCol, pos.col);
      maxCol = Math.max(maxCol, pos.col);
    });
    
    // Export as CSV
    if (fileType === 'csv') {
      let csvContent = '';
      
      for (let row = minRow; row <= maxRow; row++) {
        const rowValues = [];
        
        for (let col = minCol; col <= maxCol; col++) {
          const cellId = getCellId({ row, col });
          let value = '';
          
          // Get the appropriate value
          if (cells[cellId]) {
            value = isCellFormula(cellId)
              ? (includeFormatting ? cells[cellId].formula || '' : getCellDisplayValue(cellId))
              : cells[cellId].value || '';
          }
          
          // Escape values with commas, quotes, or newlines
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          rowValues.push(value);
        }
        
        csvContent += rowValues.join(',') + '\n';
      }
      
      return csvContent;
    }
    
    // Export as JSON
    if (fileType === 'json') {
      const jsonData: Record<string, any> = {};
      
      cellsToExport.forEach(cellId => {
        if (cells[cellId]) {
          jsonData[cellId] = includeFormatting
            ? { ...cells[cellId] }
            : { value: isCellFormula(cellId) ? getCellDisplayValue(cellId) : cells[cellId].value };
        }
      });
      
      return JSON.stringify(jsonData, null, 2);
    }
    
    return '';
  }, [cells, selection, getSelectedCells, getCellPosition, getCellId, isCellFormula, getCellDisplayValue]);

  // Update the context value to include all functions
  const value = {
    cells,
    activeCell,
    selection,
    title,
    isStarred,
    isLoading,
    zoomLevel,
    setZoomLevel,
    setTitle: handleSetTitle,
    toggleStar,
    updateCell,
    updateCellFormat,
    updateMultipleCellsFormat,
    setActiveCell: setActiveCellWithoutHistory,
    isCellFormula,
    getCellError,
    setSelection: setSelectionWithoutHistory,
    copySelection,
    cutSelection,
    pasteSelection,
    deleteSelection,
    getCellId,
    getCellPosition,
    getSelectedCells,
    getCellDisplayValue,
    undo,
    redo,
    canUndo: () => historyManager.current.canUndo(),
    canRedo: () => historyManager.current.canRedo(),
    importData,
    exportData,
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  )
} 