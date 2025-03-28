import { useState, useCallback } from 'react';
import { useSpreadsheetApi } from '@/lib/supabase/secure-api';
import type { Spreadsheet, SpreadsheetData } from '@/lib/supabase/types';

export function useSpreadsheet() {
  const spreadsheetApi = useSpreadsheetApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn } = spreadsheetApi;

  const createSpreadsheet = useCallback(async (title: string) => {
    // Check if session is ready
    if (!isLoaded || !isSignedIn) {
      setError('Authentication is not ready or user is not signed in');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await spreadsheetApi.createSpreadsheet(title);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create spreadsheet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [spreadsheetApi, isLoaded, isSignedIn]);

  const getSpreadsheets = useCallback(async () => {
    // Check if session is ready
    if (!isLoaded || !isSignedIn) {
      setError('Authentication is not ready or user is not signed in');
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await spreadsheetApi.getSpreadsheets();
      return result.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spreadsheets');
      return [];
    } finally {
      setLoading(false);
    }
  }, [spreadsheetApi, isLoaded, isSignedIn]);

  const updateSpreadsheet = useCallback(async (id: string, spreadsheet: Partial<Spreadsheet>): Promise<Spreadsheet | null> => {
    // Check if session is ready
    if (!isLoaded || !isSignedIn) {
      setError('Authentication is not ready or user is not signed in');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await spreadsheetApi.updateSpreadsheet(id, spreadsheet);
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update spreadsheet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [spreadsheetApi, isLoaded, isSignedIn]);

  const deleteSpreadsheet = useCallback(async (id: string) => {
    // Check if session is ready
    if (!isLoaded || !isSignedIn) {
      setError('Authentication is not ready or user is not signed in');
      return false;
    }
    
    setLoading(true);
    setError(null);
    try {
      await spreadsheetApi.deleteSpreadsheet(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete spreadsheet');
      return false;
    } finally {
      setLoading(false);
    }
  }, [spreadsheetApi, isLoaded, isSignedIn]);

  return {
    loading,
    error,
    isLoaded,
    isSignedIn,
    createSpreadsheet,
    getSpreadsheets,
    updateSpreadsheet,
    deleteSpreadsheet,
  };
} 