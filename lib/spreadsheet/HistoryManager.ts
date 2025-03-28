import { Cells } from "@/context/spreadsheet-context"

type HistoryState = {
  cells: Cells;
  activeCell: string | null;
  selection: {
    start: { row: number; col: number }
    end: { row: number; col: number }
  } | null;
}

export class HistoryManager {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private maxHistorySize: number = 100;
  private lastSavedState: string = '';

  // Save a new state to history only if it's different from the last saved state
  push(state: HistoryState) {
    const stateString = JSON.stringify(state.cells);
    
    // Don't save if the cells data is the same as the last state
    if (stateString === this.lastSavedState) {
      return;
    }
    
    // Add current state to undo stack
    this.undoStack.push(this.cloneState(state));
    this.lastSavedState = stateString;
    
    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Limit the size of undo stack
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  // Get the previous state (undo)
  undo(currentState: HistoryState): HistoryState | null {
    if (this.undoStack.length === 0) return null;

    // Move current state to redo stack
    this.redoStack.push(this.cloneState(currentState));

    // Get and remove the last state from undo stack
    const previousState = this.undoStack.pop();
    if (previousState) {
      this.lastSavedState = JSON.stringify(previousState.cells);
    }
    return previousState || null;
  }

  // Get the next state (redo)
  redo(currentState: HistoryState): HistoryState | null {
    if (this.redoStack.length === 0) return null;

    // Move current state to undo stack
    this.undoStack.push(this.cloneState(currentState));

    // Get and remove the last state from redo stack
    const nextState = this.redoStack.pop();
    if (nextState) {
      this.lastSavedState = JSON.stringify(nextState.cells);
    }
    return nextState || null;
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Clear all history
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.lastSavedState = '';
  }

  // Helper to create deep copy of state
  private cloneState(state: HistoryState): HistoryState {
    return {
      cells: JSON.parse(JSON.stringify(state.cells)),
      activeCell: state.activeCell,
      selection: state.selection ? JSON.parse(JSON.stringify(state.selection)) : null,
    };
  }
} 