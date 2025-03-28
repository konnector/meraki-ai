"use client"
 
 import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
 import { useTagApi, type Tag, type TagWithCount } from "@/lib/supabase/tag-api"
 import { toast } from "sonner"
 
 type TagContextType = {
   tags: TagWithCount[];
   isLoading: boolean;
   activeTag: string | null;
   setActiveTag: (id: string | null) => void;
   createTag: (name: string, color?: string) => Promise<void>;
   updateTag: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
   deleteTag: (id: string) => Promise<void>;
   addTagToSpreadsheet: (spreadsheetId: string, tagId: string) => Promise<void>;
   removeTagFromSpreadsheet: (spreadsheetId: string, tagId: string) => Promise<void>;
   getSpreadsheetTags: (spreadsheetId: string) => Promise<Tag[]>;
 }
 
 const TagContext = createContext<TagContextType | null>(null)
 
 export function useTag() {
   const context = useContext(TagContext)
   if (!context) {
     throw new Error("useTag must be used within a TagProvider")
   }
   return context
 }
 
 export function TagProvider({ children }: { children: ReactNode }) {
   const [tags, setTags] = useState<TagWithCount[]>([])
   const [isLoading, setIsLoading] = useState(true)
   const [activeTag, setActiveTag] = useState<string | null>(null)
   const tagApi = useTagApi()
   const [spreadsheetTagCache, setSpreadsheetTagCache] = useState<Record<string, Tag[]>>({})
 
   // Load tags on mount and when auth state changes
   useEffect(() => {
     const loadTags = async () => {
       try {
         // Debug logging
         console.log('Auth state:', {
           isLoaded: tagApi.isLoaded,
           isSignedIn: tagApi.isSignedIn
         });
 
         // Only load if signed in
         if (!tagApi.isSignedIn) {
           console.log('Not signed in, clearing tags');
           setTags([]);
           return;
         }
 
         setIsLoading(true);
         console.log('Loading tags...');
         const data = await tagApi.getTags();
         console.log('Tags loaded:', data);
         setTags(data || []);
       } catch (err) {
         console.error('Failed to load tags:', err);
         toast.error('Failed to load tags');
       } finally {
         setIsLoading(false);
       }
     };
 
     // Wait for auth to be loaded
     if (tagApi.isLoaded) {
       loadTags();
     }
   }, [tagApi.isLoaded, tagApi.isSignedIn]);
 
   // Subscribe to tag changes
   useEffect(() => {
     if (!tagApi.isSignedIn) return;
 
     let unsubscribe: (() => void) | undefined;
 
     const setupSubscription = async () => {
       unsubscribe = await tagApi.subscribeToTags((tag) => {
         setTags(prev => {
           const index = prev.findIndex(t => t.id === tag.id);
           if (index === -1) {
             return [...prev, { ...tag, spreadsheet_count: 0 }];
           }
           const newTags = [...prev];
           newTags[index] = { ...tag, spreadsheet_count: prev[index].spreadsheet_count };
           return newTags;
         });
       }, 'INSERT');
     };
 
     setupSubscription();
 
     return () => {
       if (unsubscribe) {
         unsubscribe();
       }
     };
   }, [tagApi.isSignedIn]);
 
   const createTag = useCallback(async (name: string, color: string = '#3B82F6') => {
     try {
       // Wait to ensure we have an authenticated session
       let attempts = 0;
       const maxAttempts = 3;
       
       while (attempts < maxAttempts) {
         try {
           const tag = await tagApi.createTag(name, color);
           setTags(prev => [...prev, { ...tag, spreadsheet_count: 0 }]);
           toast.success('Tag created');
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
       console.error('Failed to create tag:', err);
       toast.error('Failed to create tag');
       throw err;
     }
   }, [tagApi]);
 
   const updateTag = useCallback(async (id: string, updates: { name?: string; color?: string }) => {
     try {
       const tag = await tagApi.updateTag(id, updates);
       setTags(prev => prev.map(t => t.id === id ? { ...tag, spreadsheet_count: t.spreadsheet_count } : t));
       toast.success('Tag updated');
     } catch (err) {
       console.error('Failed to update tag:', err);
       toast.error('Failed to update tag');
       throw err;
     }
   }, [tagApi]);
 
   const deleteTag = useCallback(async (id: string) => {
     try {
       await tagApi.deleteTag(id);
       setTags(prev => prev.filter(t => t.id !== id));
       if (activeTag === id) {
         setActiveTag(null);
       }
       toast.success('Tag deleted');
     } catch (err) {
       console.error('Failed to delete tag:', err);
       toast.error('Failed to delete tag');
       throw err;
     }
   }, [activeTag, tagApi]);
 
   const getSpreadsheetTags = useCallback(async (spreadsheetId: string) => {
     try {
       // Check cache first
       if (spreadsheetTagCache[spreadsheetId]) {
         return spreadsheetTagCache[spreadsheetId];
       }
       
       const tags = await tagApi.getSpreadsheetTags(spreadsheetId);
       
       // Update cache
       setSpreadsheetTagCache(prev => ({
         ...prev,
         [spreadsheetId]: tags
       }));
       
       return tags;
     } catch (err) {
       console.error('Failed to get spreadsheet tags:', err);
       toast.error('Failed to load tags');
       return [];
     }
   }, [tagApi, spreadsheetTagCache]);
 
   const addTagToSpreadsheet = useCallback(async (spreadsheetId: string, tagId: string) => {
     try {
       await tagApi.addTagToSpreadsheet(spreadsheetId, tagId);
       
       // Update tag counts
       setTags(prev => prev.map(tag => 
         tag.id === tagId 
           ? { ...tag, spreadsheet_count: (tag.spreadsheet_count || 0) + 1 }
           : tag
       ));
       
       // Update cache if it exists for this spreadsheet
       if (spreadsheetTagCache[spreadsheetId]) {
         const tagToAdd = tags.find(t => t.id === tagId);
         if (tagToAdd) {
           setSpreadsheetTagCache(prev => ({
             ...prev,
             [spreadsheetId]: [...prev[spreadsheetId], tagToAdd]
           }));
         }
       }
       
       toast.success('Tag added to spreadsheet');
     } catch (err) {
       console.error('Failed to add tag to spreadsheet:', err);
       toast.error('Failed to add tag');
       throw err;
     }
   }, [tagApi, tags, spreadsheetTagCache]);
 
   const removeTagFromSpreadsheet = useCallback(async (spreadsheetId: string, tagId: string) => {
     try {
       await tagApi.removeTagFromSpreadsheet(spreadsheetId, tagId);
       
       // Update tag counts
       setTags(prev => prev.map(tag => 
         tag.id === tagId 
           ? { ...tag, spreadsheet_count: Math.max(0, (tag.spreadsheet_count || 0) - 1) }
           : tag
       ));
       
       // Update cache if it exists for this spreadsheet
       if (spreadsheetTagCache[spreadsheetId]) {
         setSpreadsheetTagCache(prev => ({
           ...prev,
           [spreadsheetId]: prev[spreadsheetId].filter(t => t.id !== tagId)
         }));
       }
       
       toast.success('Tag removed from spreadsheet');
     } catch (err) {
       console.error('Failed to remove tag from spreadsheet:', err);
       toast.error('Failed to remove tag');
       throw err;
     }
   }, [tagApi, spreadsheetTagCache]);
 
   const value = {
     tags,
     isLoading,
     activeTag,
     setActiveTag,
     createTag,
     updateTag,
     deleteTag,
     addTagToSpreadsheet,
     removeTagFromSpreadsheet,
     getSpreadsheetTags
   }
 
   return (
     <TagContext.Provider value={value}>
       {children}
     </TagContext.Provider>
   )
 } 