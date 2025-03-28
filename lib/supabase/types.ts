export type Spreadsheet = {
  id: string;
  user_id: string;
  folder_id?: string | null;
  title: string;
  data?: {
    isStarred?: boolean;
    cells?: {
      [key: string]: CellData;
    };
    meta?: {
      rowCount: number;
      columnCount: number;
      lastModified?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export type SpreadsheetData = {
  isStarred?: boolean;
  cells?: {
    [key: string]: CellData;
  };
  meta?: {
    rowCount: number;
    columnCount: number;
    lastModified?: string;
  };
}

export interface CellData {
  value: string;
  formula?: string;
  calculatedValue?: string | number;
  error?: string;
  format?: CellFormat;
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      spreadsheets: {
        Row: {
          id: string
          user_id: string
          title: string
          data: Json
          created_at: string
          updated_at: string
          folder_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          data?: Json
          created_at?: string
          updated_at?: string
          folder_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          data?: Json
          created_at?: string
          updated_at?: string
          folder_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 