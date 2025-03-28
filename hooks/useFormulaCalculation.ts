import { useCallback, useEffect, useRef } from 'react';
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
      const evaluationFn = FormulaParser.createEvaluationFunction(formula);
      const result = evaluationFn(getCellValue);
      return { value: result.toString() };
    } catch (error) {
      return { value: '#ERROR!', error: error instanceof Error ? error.message : 'Calculation error' };
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