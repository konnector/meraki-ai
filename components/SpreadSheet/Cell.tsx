"use client"

import React from 'react';
import { cn } from "@/lib/utils";

interface CellData {
  value: string;
  formula?: string;
  calculatedValue?: any;
  error?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: "left" | "center" | "right";
    fontFamily?: string;
    fontSize?: string;
    textColor?: string;
    fillColor?: string;
  };
}

interface CellProps {
  data?: CellData;
  isEditing: boolean;
  editValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

const Cell: React.FC<CellProps> = ({ 
  data, 
  isEditing, 
  editValue = "", 
  onChange, 
  onBlur 
}) => {
  const displayValue = React.useMemo(() => {
    if (isEditing) {
      return editValue;
    }
    
    // If it's a formula cell
    if (data?.formula) {
      // If there's an error, display it
      if (data.error) {
        return '#ERROR!';
      }
      
      // Show calculated value
      return data.calculatedValue !== undefined 
        ? String(data.calculatedValue)
        : data.value || '';
    }
    
    // Regular cell value
    return data?.value || '';
  }, [data, isEditing, editValue]);

  if (isEditing) {
    return (
      <input
        className="absolute inset-0 w-full h-full px-2 border-none outline-none bg-white"
        value={editValue}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        autoFocus
      />
    );
  }

  return (
    <div
      className={cn(
        "px-2 py-1 overflow-hidden text-sm whitespace-nowrap h-full flex items-center",
        data?.error && "text-red-500"
      )}
      style={{
        fontFamily: data?.format?.fontFamily === "serif"
          ? "serif"
          : data?.format?.fontFamily === "mono"
            ? "monospace"
            : data?.format?.fontFamily === "inter"
              ? "Inter, sans-serif"
              : data?.format?.fontFamily === "roboto"
                ? "Roboto, sans-serif"
                : data?.format?.fontFamily === "poppins"
                  ? "Poppins, sans-serif"
                  : "sans-serif",
        fontSize: data?.format?.fontSize === "xs"
          ? "10px"
          : data?.format?.fontSize === "sm"
            ? "12px"
            : data?.format?.fontSize === "lg"
              ? "16px"
              : data?.format?.fontSize === "xl"
                ? "18px"
                : data?.format?.fontSize === "2xl"
                  ? "20px"
                  : data?.format?.fontSize === "3xl"
                    ? "24px"
                    : "14px",
        fontWeight: data?.format?.bold ? "bold" : "normal",
        fontStyle: data?.format?.italic ? "italic" : "normal",
        textDecoration: data?.format?.underline ? "underline" : "none",
        textAlign: data?.format?.align || "left",
        color: data?.error ? "red" : (data?.format?.textColor || "inherit"),
        backgroundColor: data?.format?.fillColor || "transparent",
        width: "100%",
        justifyContent: data?.format?.align === "center"
          ? "center"
          : data?.format?.align === "right"
            ? "flex-end"
            : "flex-start",
        userSelect: "none"
      }}
    >
      {displayValue}
    </div>
  );
};

export default Cell; 