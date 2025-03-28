export interface CellFormula {
  raw: string;              // Raw formula text (e.g., "=A1+B1")
  dependencies: string[];   // List of cell references (e.g., ["A1", "B1"])
}

export interface CellState {
  id: string;              // Cell identifier (e.g., "A1")
  value: string;           // Current cell value
  formula?: CellFormula;   // Formula if cell contains one
  error?: string;          // Error message if formula evaluation fails
}

// Simple type for cell coordinates
export interface CellCoord {
  col: number;
  row: number;
}

// Convert A1 notation to coordinates (e.g., "A1" -> { col: 0, row: 0 })
export function parseCellNotation(cellId: string): CellCoord {
  const col = cellId.match(/[A-Z]+/)?.[0];
  const row = cellId.match(/\d+/)?.[0];
  
  if (!col || !row) {
    throw new Error(`Invalid cell ID: ${cellId}`);
  }

  const colNum = col.split('').reduce((acc, char) => 
    acc * 26 + char.charCodeAt(0) - 'A'.charCodeAt(0), 0);
  
  return {
    col: colNum,
    row: parseInt(row) - 1
  };
}

// Convert coordinates to A1 notation (e.g., { col: 0, row: 0 } -> "A1")
export function coordsToCellNotation(coord: CellCoord): string {
  const colName = String.fromCharCode('A'.charCodeAt(0) + coord.col);
  return `${colName}${coord.row + 1}`;
} 