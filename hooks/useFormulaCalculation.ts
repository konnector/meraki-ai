import { useCallback, useRef } from 'react';
import { CellFormula, CellState } from '@/types/spreadsheet';
import { FormulaParser } from '@/lib/spreadsheet/FormulaParser';
import { DependencyGraph } from '@/lib/spreadsheet/DependencyGraph';

export function useFormulaCalculation() {
  // Keep dependency graph in a ref so it persists between renders
  const dependencyGraphRef = useRef(new DependencyGraph());

  // Update cell dependencies
  const updateDependencies = useCallback((cellId: string, formula: CellFormula | undefined) => {
    const graph = dependencyGraphRef.current;
    
    // Clear existing dependencies
    graph.clearDependencies(cellId);
    
    // Add new dependencies
    if (formula) {
      formula.dependencies.forEach(dep => {
        // Check for circular dependencies before adding
        if (!graph.hasCircularDependency(dep, cellId)) {
          graph.addDependency(cellId, dep);
        } else {
          console.warn(`Circular dependency detected: ${cellId} depends on ${dep} which already depends on ${cellId}`);
        }
      });
    }
  }, []);

  // Calculate a cell's value based on its formula
  const calculateFormula = useCallback((
    formula: CellFormula,
    getCellValue: (cellId: string) => number
  ): { value: string; error?: string } => {
    try {
      // Create a wrapped getCellValue function that handles errors and non-numeric values
      const safeGetCellValue = (cellId: string): number => {
        try {
          const value = getCellValue(cellId);
          if (isNaN(value)) {
            console.warn(`Cell ${cellId} contains non-numeric value`);
            return 0; // Return 0 for non-numeric values
          }
          return value;
        } catch (error) {
          console.warn(`Error getting value for cell ${cellId}:`, error);
          return 0; // Return 0 for error cases
        }
      };
      
      const evaluationFn = FormulaParser.createEvaluationFunction(formula);
      const result = evaluationFn(safeGetCellValue);
      
      // Handle special cases like NaN and Infinity
      if (isNaN(result)) {
        return { value: "#VALUE!", error: "Formula result is not a number" };
      } else if (!isFinite(result)) {
        return { value: "#DIV/0!", error: "Division by zero" };
      }
      
      return { value: result.toString() };
    } catch (error) {
      console.error("Error calculating formula:", error);
      return { 
        value: '#ERROR!', 
        error: error instanceof Error ? error.message : 'Calculation error' 
      };
    }
  }, []);

  // Get cells that need to be recalculated when a cell changes
  const getAffectedCells = useCallback((cellId: string): string[] => {
    return dependencyGraphRef.current.getEvaluationOrder(cellId);
  }, []);

  return {
    updateDependencies,
    calculateFormula,
    getAffectedCells
  };
}