"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useFolderApi, type Folder } from "@/lib/supabase/folder-api"
import { toast } from "sonner"

type FolderContextType = {
  folders: Folder[]
  totalSpreadsheetCount: number
  isLoading: boolean
  activeFolder: string | null
  setActiveFolder: (id: string | null) => void
  createFolder: (name: string) => Promise<void>
  updateFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  trashFolder: (id: string) => Promise<void>
  restoreFolder: (id: string) => Promise<void>
  getTrashedFolders: () => Promise<Folder[]>
  moveSpreadsheet: (spreadsheetId: string, folderId: string | null) => Promise<void>
}

const FolderContext = createContext<FolderContextType | null>(null)

export function useFolder() {
  const context = useContext(FolderContext)
  if (!context) {
    throw new Error("useFolder must be used within a FolderProvider")
  }
  return context
}

export function FolderProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [totalSpreadsheetCount, setTotalSpreadsheetCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const folderApi = useFolderApi()

  // Load folders on mount and when auth state changes
  useEffect(() => {
    const loadFolders = async () => {
      try {
        // Debug logging
        console.log('Auth state:', {
          isLoaded: folderApi.isLoaded,
          isSignedIn: folderApi.isSignedIn
        });

        // Only load if signed in
        if (!folderApi.isSignedIn) {
          console.log('Not signed in, clearing folders');
          setFolders([]);
          setTotalSpreadsheetCount(0);
          return;
        }

        setIsLoading(true);
        console.log('Loading folders...');
        const data = await folderApi.getFolders();
        console.log('Folders loaded:', data);
        setFolders(data.folders || []);
        setTotalSpreadsheetCount(data.totalSpreadsheetCount);
      } catch (err) {
        console.error('Failed to load folders:', err);
        toast.error('Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for auth to be loaded
    if (folderApi.isLoaded) {
      loadFolders();
    }
  }, [folderApi.isLoaded, folderApi.isSignedIn]);

  // Subscribe to folder changes
  useEffect(() => {
    if (!folderApi.isSignedIn) return;

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await folderApi.subscribeToFolders((folder) => {
        setFolders(prev => {
          const index = prev.findIndex(f => f.id === folder.id);
          if (index === -1) {
            return [...prev, folder];
          }
          const newFolders = [...prev];
          newFolders[index] = folder;
          return newFolders;
        });
      }, 'INSERT');
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [folderApi.isSignedIn]);

  const createFolder = useCallback(async (name: string) => {
    try {
      // Wait to ensure we have an authenticated session
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const folder = await folderApi.createFolder(name);
          setFolders(prev => [...prev, folder]);
          toast.success('Folder created');
          return;
        } catch (error) {
          // Check if it's an authentication error
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait longer between attempts
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          // If it's not an auth error or we've exceeded attempts, rethrow
          throw error;
        }
      }
      
      // If we get here, we've exceeded retry attempts
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to create folder:', err);
      toast.error('Failed to create folder');
      throw err;
    }
  }, [folderApi]);

  const updateFolder = useCallback(async (id: string, name: string) => {
    try {
      // Wait to ensure we have an authenticated session
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const folder = await folderApi.updateFolder(id, name);
          setFolders(prev => prev.map(f => f.id === id ? folder : f));
          toast.success('Folder updated');
          return;
        } catch (error) {
          // Check if it's an authentication error
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait longer between attempts
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          // If it's not an auth error or we've exceeded attempts, rethrow
          throw error;
        }
      }
      
      // If we get here, we've exceeded retry attempts
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to update folder:', err);
      toast.error('Failed to update folder');
      throw err;
    }
  }, [folderApi]);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      // Wait to ensure we have an authenticated session
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await folderApi.deleteFolder(id);
          setFolders(prev => prev.filter(f => f.id !== id));
          if (activeFolder === id) {
            setActiveFolder(null);
          }
          toast.success('Folder deleted');
          return;
        } catch (error) {
          // Check if it's an authentication error
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait longer between attempts
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          // If it's not an auth error or we've exceeded attempts, rethrow
          throw error;
        }
      }
      
      // If we get here, we've exceeded retry attempts
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to delete folder:', err);
      toast.error('Failed to delete folder');
      throw err;
    }
  }, [activeFolder, folderApi]);

  const moveSpreadsheet = useCallback(async (spreadsheetId: string, folderId: string | null) => {
    try {
      // Wait to ensure we have an authenticated session, with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await folderApi.moveSpreadsheet(spreadsheetId, folderId);
          // Update folder counts
          const data = await folderApi.getFolders();
          setFolders(data.folders || []);
          setTotalSpreadsheetCount(data.totalSpreadsheetCount);
          toast.success('Spreadsheet moved');
          return;
        } catch (error) {
          // Check if it's an authentication error
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait longer between attempts
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          // If it's not an auth error or we've exceeded attempts, rethrow
          throw error;
        }
      }
      
      // If we get here, we've exceeded retry attempts
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to move spreadsheet:', err);
      toast.error('Failed to move spreadsheet');
      throw err;
    }
  }, [folderApi]);

  const trashFolder = useCallback(async (id: string) => {
    try {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await folderApi.trashFolder(id);
          setFolders(prev => prev.filter(f => f.id !== id));
          if (activeFolder === id) {
            setActiveFolder(null);
          }
          toast.success('Folder moved to trash');
          return;
        } catch (error) {
          // Check if it's an authentication error
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          throw error;
        }
      }
      
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to move folder to trash:', err);
      toast.error('Failed to move folder to trash');
      throw err;
    }
  }, [activeFolder, folderApi]);

  const restoreFolder = useCallback(async (id: string) => {
    try {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await folderApi.restoreFolder(id);
          // Reload folders to update the UI
          const data = await folderApi.getFolders();
          setFolders(data.folders || []);
          setTotalSpreadsheetCount(data.totalSpreadsheetCount);
          toast.success('Folder restored');
          return;
        } catch (error) {
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          throw error;
        }
      }
      
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to restore folder:', err);
      toast.error('Failed to restore folder');
      throw err;
    }
  }, [folderApi]);

  const getTrashedFolders = useCallback(async () => {
    try {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          return await folderApi.getTrashedFolders();
        } catch (error) {
          if (error instanceof Error && 
              (error.message === 'No active session' || 
               error.message === 'Clerk session is still loading')) {
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          throw error;
        }
      }
      
      throw new Error('Unable to authenticate after multiple attempts');
    } catch (err) {
      console.error('Failed to get trashed folders:', err);
      toast.error('Failed to get trashed folders');
      throw err;
    }
  }, [folderApi]);

  const value = {
    folders,
    totalSpreadsheetCount,
    isLoading,
    activeFolder,
    setActiveFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    trashFolder,
    restoreFolder,
    getTrashedFolders,
    moveSpreadsheet
  }

  return (
    <FolderContext.Provider value={value}>
      {children}
    </FolderContext.Provider>
  )
} 