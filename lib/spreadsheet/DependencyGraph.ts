export class DependencyGraph {
  // Map of cell ID to array of dependent cell IDs
  private dependencies: Map<string, Set<string>> = new Map();
  
  // Add a dependency relationship
  addDependency(dependentCell: string, dependsOnCell: string) {
    if (!this.dependencies.has(dependsOnCell)) {
      this.dependencies.set(dependsOnCell, new Set());
    }
    this.dependencies.get(dependsOnCell)!.add(dependentCell);
  }

  // Remove all dependencies for a cell
  clearDependencies(cellId: string) {
    // Remove this cell as a dependency from all other cells
    for (const [_, dependents] of this.dependencies) {
      dependents.delete(cellId);
    }
    // Remove all cells that depend on this cell
    this.dependencies.delete(cellId);
  }

  // Get all cells that depend on the given cell
  getDependents(cellId: string): string[] {
    return Array.from(this.dependencies.get(cellId) || []);
  }

  // Check for circular dependencies
  hasCircularDependency(startCell: string, endCell: string, visited = new Set<string>()): boolean {
    if (startCell === endCell) return true;
    if (visited.has(startCell)) return false;

    visited.add(startCell);
    const dependents = this.dependencies.get(startCell) || new Set();

    for (const dependent of dependents) {
      if (this.hasCircularDependency(dependent, endCell, visited)) {
        return true;
      }
    }

    return false;
  }

  // Get cells in evaluation order (topological sort)
  getEvaluationOrder(changedCell: string): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (cellId: string) => {
      if (visited.has(cellId)) return;
      visited.add(cellId);

      const dependents = this.getDependents(cellId);
      for (const dependent of dependents) {
        visit(dependent);
      }
      order.push(cellId);
    };

    visit(changedCell);
    return order;
  }
} 