/**
 * Centralized logging utility for the spreadsheet application
 * Provides consistent logging functions with optional debug mode control
 */

// Track whether debug mode is enabled
let isDebugEnabled = false;

// Categories of logs for filtering
export enum LogCategory {
  UI = 'UI',
  FORMULA = 'FORMULA',
  STATE = 'STATE',
  PERFORMANCE = 'PERFORMANCE',
  ERROR = 'ERROR'
}

// Set debug mode
export function setDebugMode(enabled: boolean): void {
  isDebugEnabled = enabled;
  console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}

// Log info message (always appears)
export function info(message: string, data?: any): void {
  if (data) {
    console.info(`[INFO] ${message}`, data);
  } else {
    console.info(`[INFO] ${message}`);
  }
}

// Log debug message (only appears in debug mode)
export function debug(category: LogCategory, message: string, data?: any): void {
  if (!isDebugEnabled) return;
  
  if (data) {
    console.log(`[DEBUG:${category}] ${message}`, data);
  } else {
    console.log(`[DEBUG:${category}] ${message}`);
  }
}

// Log warning message (always appears)
export function warn(message: string, data?: any): void {
  if (data) {
    console.warn(`[WARN] ${message}`, data);
  } else {
    console.warn(`[WARN] ${message}`);
  }
}

// Log error message (always appears)
export function error(message: string, error?: any): void {
  if (error) {
    console.error(`[ERROR] ${message}`, error);
  } else {
    console.error(`[ERROR] ${message}`);
  }
}

// Start performance timing
export function timeStart(label: string): void {
  if (!isDebugEnabled) return;
  console.time(`⏱️ ${label}`);
}

// End performance timing
export function timeEnd(label: string): void {
  if (!isDebugEnabled) return;
  console.timeEnd(`⏱️ ${label}`);
}

// Log a group of related messages (with collapsible UI in console)
export function group(label: string, collapsed: boolean = true): void {
  if (!isDebugEnabled) return;
  
  if (collapsed) {
    console.groupCollapsed(`📋 ${label}`);
  } else {
    console.group(`📋 ${label}`);
  }
}

// End a group of messages
export function groupEnd(): void {
  if (!isDebugEnabled) return;
  console.groupEnd();
}

// Clear the console
export function clear(): void {
  console.clear();
} 