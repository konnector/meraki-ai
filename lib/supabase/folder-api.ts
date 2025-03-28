"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useSupabaseClient } from './clerk-client'

export type Folder = Database['public']['Tables']['folders']['Row'] & {
  spreadsheet_count?: number
}

export function useFolderApi() {
  const { getClient, isLoaded, isSignedIn } = useSupabaseClient()

  const getFolders = async () => {
    const client = await getClient()
    
    // First get the total count of all spreadsheets
    const { count: totalCount, error: countError } = await client
      .from('spreadsheets')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)

    if (countError) throw countError

    // Then get folders with their spreadsheet counts
    const { data, error } = await client
      .from('folders')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        user_id,
        spreadsheets(count)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Transform the data to match the Folder type and include total count
    return {
      folders: (data || []).map(folder => ({
        ...folder,
        spreadsheet_count: folder.spreadsheets?.[0]?.count || 0
      })) as Folder[],
      totalSpreadsheetCount: totalCount || 0
    }
  }

  const createFolder = async (name: string) => {
    const client = await getClient()
    const { data, error } = await client
      .from('folders')
      .insert({ name })
      .select()
      .single()

    if (error) throw error
    return data as Folder
  }

  const updateFolder = async (id: string, name: string) => {
    const client = await getClient()
    const { data, error } = await client
      .from('folders')
      .update({ 
        name, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Folder
  }

  const deleteFolder = async (id: string) => {
    const client = await getClient()
    // First update any spreadsheets in this folder to have no folder
    const { error: updateError } = await client
      .from('spreadsheets')
      .update({ folder_id: null })
      .eq('folder_id', id)

    if (updateError) throw updateError

    // Then delete the folder
    const { error: deleteError } = await client
      .from('folders')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
  }

  const trashFolder = async (id: string) => {
    const client = await getClient()
    const { error } = await client
      .from('folders')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id)
    
    if (error) throw error
  }

  const restoreFolder = async (id: string) => {
    const client = await getClient()
    const { error } = await client
      .from('folders')
      .update({ 
        is_deleted: false,
        deleted_at: null 
      })
      .eq('id', id)
    
    if (error) throw error
  }

  const getTrashedFolders = async () => {
    const client = await getClient()
    const { data, error } = await client
      .from('folders')
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false })
    
    if (error) throw error
    return data as Folder[]
  }

  const moveSpreadsheet = async (spreadsheetId: string, folderId: string | null) => {
    const client = await getClient()
    const { error } = await client
      .from('spreadsheets')
      .update({ folder_id: folderId })
      .eq('id', spreadsheetId)

    if (error) throw error
  }

  const subscribeToFolders = async (
    callback: (folder: Folder) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE'
  ) => {
    // Use the same authenticated client instead of creating a new one
    const client = await getClient();
    const channel = client
      .channel('folder-changes')
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table: 'folders'
        },
        (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['folders']['Row']>) => {
          callback(payload.new as Folder)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  return {
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSpreadsheet,
    subscribeToFolders,
    trashFolder,
    restoreFolder,
    getTrashedFolders,
    isLoaded,
    isSignedIn
  }
} 