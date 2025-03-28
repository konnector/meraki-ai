import { CellFormula } from "@/types/spreadsheet";

// Regular expression to match cell references (e.g., A1, B2, etc.)
const CELL_REF_REGEX = /[A-Z]+[0-9]+/g;

// Regular expression to match SUM function with cell range - now case insensitive
const SUM_REGEX = /sum\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)/i;

export class FormulaParser {
  // Extract cell references from a formula
  static extractDependencies(formula: string): string[] {
    // Convert function names to uppercase for consistency in checking
    const upperFormula = formula.toUpperCase();
    if (upperFormula.includes('SUM')) {
      const match = formula.match(SUM_REGEX);
      if (match) {
        const [_, start, end] = match;
        return this.expandCellRange(start, end);
      }
    }
    const matches = formula.match(CELL_REF_REGEX) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  // Expand a cell range (e.g., "A1:A5" -> ["A1", "A2", "A3", "A4", "A5"])
  private static expandCellRange(start: string, end: string): string[] {
    const startCol = start.match(/[A-Z]+/)?.[0] || '';
    const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
    const endCol = end.match(/[A-Z]+/)?.[0] || '';
    const endRow = parseInt(end.match(/\d+/)?.[0] || '0');

    const startColNum = startCol.split('').reduce((acc, char) => 
      acc * 26 + char.charCodeAt(0) - 'A'.charCodeAt(0), 0);
    const endColNum = endCol.split('').reduce((acc, char) => 
      acc * 26 + char.charCodeAt(0) - 'A'.charCodeAt(0), 0);

    const cells: string[] = [];
    for (let col = startColNum; col <= endColNum; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const colLetter = String.fromCharCode('A'.charCodeAt(0) + col);
        cells.push(`${colLetter}${row}`);
      }
    }
    return cells;
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
            return sum + getCellValue(cellId);
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
      return new Function('getCellValue', `return ${safeExpression}`) as any;
    } catch (error) {
      throw new Error(`Invalid formula: ${formula.raw}`);
    }
  }
} 