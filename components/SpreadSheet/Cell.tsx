"use client"

import React, { useState } from 'react';
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
    type?: "text" | "number" | "formula";
    numberFormat?: "general" | "number" | "currency" | "percent" | "date" | "time";
    decimals?: number;
    currencySymbol?: string;
    dateFormat?: string;
    timeFormat?: string;
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
  const formatValue = (value: string, format?: CellData['format']): string => {
    if (!format || !format.numberFormat || format.numberFormat === "general") {
      return value;
    }

    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return value; // Return original value if not a number
    }

    const decimals = format.decimals ?? 2;

    switch (format.numberFormat) {
      case "number":
        return numValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      
      case "currency":
        const symbol = format.currencySymbol || "$";
        return numValue.toLocaleString(undefined, {
          style: 'currency',
          currency: 'USD', // Default to USD
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).replace('$', symbol); // Replace default $ with specified symbol
      
      case "percent":
        return (numValue * 100).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) + '%';
      
      case "date":
        try {
          const date = new Date(numValue);
          if (isNaN(date.getTime())) {
            return value;
          }
          
          // Determine date format
          switch (format.dateFormat) {
            case "MM/DD/YYYY":
              return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
            
            case "DD/MM/YYYY":
              return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            
            case "YYYY-MM-DD":
              return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            case "MM/DD":
              return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
            
            default:
              return date.toLocaleDateString();
          }
        } catch {
          return value;
        }
      
      case "time":
        try {
          const date = new Date(numValue);
          if (isNaN(date.getTime())) {
            return value;
          }
          
          // Determine time format
          switch (format.timeFormat) {
            case "HH:MM:SS":
              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            
            case "HH:MM":
              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            case "HH:MM AM/PM":
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const hour12 = hours % 12 || 12;
              return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            
            default:
              return date.toLocaleTimeString();
          }
        } catch {
          return value;
        }
      
      default:
        return value;
    }
  };

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
      
      // Format and show calculated value
      const rawValue = data.calculatedValue !== undefined 
        ? String(data.calculatedValue)
        : data.value || '';
        
      return formatValue(rawValue, data.format);
    }
    
    // Regular cell value with formatting
    return formatValue(data?.value || '', data?.format);
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
    <>
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

    
    </>
  );
};

export default Cell;