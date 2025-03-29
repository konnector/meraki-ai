import { CellFormula } from "@/types/spreadsheet";

// Regular expression to match cell references (e.g., A1, B2, etc.)
const CELL_REF_REGEX = /[A-Z]+[0-9]+/g;

// Regular expression to match SUM function with cell range - now case insensitive
const SUM_REGEX = /sum\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)/i;

export class FormulaParser {
  // Extract cell references from a formula
  static extractDependencies(formula: string): string[] {
    // Remove the equals sign if present
    const formulaWithoutEquals = formula.startsWith('=') ? formula.substring(1) : formula;
    
    // Convert function names to uppercase for consistency in checking
    const upperFormula = formulaWithoutEquals.toUpperCase();
    if (upperFormula.includes('SUM')) {
      const match = formulaWithoutEquals.match(SUM_REGEX);
      if (match) {
        const [_, start, end] = match;
        return this.expandCellRange(start, end);
      }
    }
    
    // Extract all cell references from the formula
    const matches = formulaWithoutEquals.match(CELL_REF_REGEX) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  // Expand a cell range (e.g., "A1:A5" -> ["A1", "A2", "A3", "A4", "A5"])
  private static expandCellRange(start: string, end: string): string[] {
    const startCol = start.match(/[A-Z]+/)?.[0] || '';
    const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
    const endCol = end.match(/[A-Z]+/)?.[0] || '';
    const endRow = parseInt(end.match(/\d+/)?.[0] || '0');

    const startColNum = this.columnToNumber(startCol);
    const endColNum = this.columnToNumber(endCol);

    const cells: string[] = [];
    for (let col = startColNum; col <= endColNum; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const colLetter = this.numberToColumn(col);
        cells.push(`${colLetter}${row}`);
      }
    }
    return cells;
  }
  
  // Convert column letter to number (A -> 0, B -> 1, ..., Z -> 25, AA -> 26, etc.)
  private static columnToNumber(column: string): number {
    return column.split('').reduce((acc, char) => 
      acc * 26 + char.charCodeAt(0) - 'A'.charCodeAt(0) + 1, 0) - 1;
  }
  
  // Convert number to column letter (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, etc.)
  private static numberToColumn(num: number): string {
    let column = '';
    let n = num + 1;
    
    while (n > 0) {
      const remainder = (n - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      n = Math.floor((n - 1) / 26);
    }
    
    return column;
  }

  // Validate formula syntax
  static validateFormula(formula: string): boolean {
    if (!formula.startsWith('=')) {
      return false;
    }

    // Remove the equals sign
    const expression = formula.substring(1);

    // Check for SUM function - case insensitive
    if (/^sum\(/i.test(expression)) {
      return SUM_REGEX.test(expression);
    }

    try {
      // Basic validation by attempting to create a Function
      // This is just for validation, we don't actually execute it
      new Function('return ' + expression);
      return true;
    } catch {
      return false;
    }
  }

  // Parse a formula string into a CellFormula object
  static parseFormula(input: string): CellFormula | null {
    if (!input.startsWith('=')) {
      return null;
    }

    const raw = input.trim();
    const dependencies = this.extractDependencies(raw);

    return {
      raw,
      dependencies
    };
  }

  // Create a safe evaluation function for the formula
  static createEvaluationFunction(formula: CellFormula): (getCellValue: (cellId: string) => number) => number {
    // Remove the equals sign and trim
    const expression = formula.raw.substring(1).trim();
    
    // Handle SUM function - case insensitive
    const sumMatch = expression.match(SUM_REGEX);
    if (sumMatch) {
      return (getCellValue: (cellId: string) => number) => {
        const cells = this.expandCellRange(sumMatch[1], sumMatch[2]);
        return cells.reduce((sum, cellId) => {
          try {
            const value = getCellValue(cellId);
            return sum + (isNaN(value) ? 0 : value);
          } catch {
            return sum; // Skip cells with errors or non-numeric values
          }
        }, 0);
      };
    }

    // Handle regular arithmetic expressions
    const safeExpression = expression.replace(CELL_REF_REGEX, (match) => {
      return `getCellValue('${match}')`;
    });

    try {
      // Create a function that takes a getCellValue parameter
      return new Function('getCellValue', `
        try {
          return ${safeExpression};
        } catch (error) {
          console.error("Error evaluating formula:", error);
          throw error;
        }
      `) as any;
    } catch (error) {
      console.error("Error creating evaluation function:", error);
      throw new Error(`Invalid formula: ${formula.raw}`);
    }
  }
}