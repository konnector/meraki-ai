"use client"

import { useSupabaseClient } from './clerk-client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for tag management
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface SpreadsheetTag {
  id: string;
  spreadsheet_id: string;
  tag_id: string;
  created_at: string;
}

export type TagWithCount = Tag & {
  spreadsheet_count?: number;
};

// Type for the nested tag data returned from Supabase
interface SpreadsheetTagWithTag {
  tag_id: string;
  tags: Tag;
}

// Type for raw data returned from Supabase
interface RawSpreadsheetTagData {
  tag_id: string;
  tags: {
    id: string;
    user_id: string;
    name: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
}

export function useTagApi() {
  const { getClient, isLoaded, isSignedIn } = useSupabaseClient();

  // Get all tags with their spreadsheet counts
  const getTags = async () => {
    const client = await getClient();
    
    const { data, error } = await client
      .from('tags')
      .select(`
        *,
        spreadsheet_tags(count)
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(tag => ({
      ...tag,
      spreadsheet_count: tag.spreadsheet_tags?.[0]?.count || 0
    })) as TagWithCount[];
  };

  // Create a new tag
  const createTag = async (name: string, color: string = '#3B82F6') => {
    const client = await getClient();
    const { data, error } = await client
      .from('tags')
      .insert({ name, color })
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  };

  // Update a tag
  const updateTag = async (id: string, updates: { name?: string; color?: string }) => {
    const client = await getClient();
    const { data, error } = await client
      .from('tags')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  };

  // Delete a tag
  const deleteTag = async (id: string) => {
    const client = await getClient();
    
    // Delete all associations first
    const { error: deleteAssocError } = await client
      .from('spreadsheet_tags')
      .delete()
      .eq('tag_id', id);

    if (deleteAssocError) throw deleteAssocError;

    // Then delete the tag
    const { error } = await client
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  // Get tags for a specific spreadsheet
  const getSpreadsheetTags = async (spreadsheetId: string) => {
    const client = await getClient();
    const { data, error } = await client
      .from('spreadsheet_tags')
      .select(`
        tag_id,
        tags (*)
      `)
      .eq('spreadsheet_id', spreadsheetId);

    if (error) throw error;

    // Use a type assertion through unknown to ensure type safety
    const rawData = data as unknown as RawSpreadsheetTagData[];
    return rawData.map(item => item.tags);
  };

  // Add a tag to a spreadsheet
  const addTagToSpreadsheet = async (spreadsheetId: string, tagId: string) => {
    const client = await getClient();
    const { data, error } = await client
      .from('spreadsheet_tags')
      .insert({ spreadsheet_id: spreadsheetId, tag_id: tagId })
      .select()
      .single();

    if (error) throw error;
    return data as SpreadsheetTag;
  };

  // Remove a tag from a spreadsheet
  const removeTagFromSpreadsheet = async (spreadsheetId: string, tagId: string) => {
    const client = await getClient();
    const { error } = await client
      .from('spreadsheet_tags')
      .delete()
      .match({ spreadsheet_id: spreadsheetId, tag_id: tagId });

    if (error) throw error;
  };

  // Get spreadsheets by tag
  const getSpreadsheetsByTag = async (tagId: string) => {
    const client = await getClient();
    const { data, error } = await client
      .from('spreadsheet_tags')
      .select(`
        spreadsheet_id,
        spreadsheets (*)
      `)
      .eq('tag_id', tagId);

    if (error) throw error;

    return (data || []).map(item => item.spreadsheets);
  };

  // Subscribe to tag changes
  const subscribeToTags = async (
    callback: (tag: Tag) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE'
  ): Promise<() => void> => {
    const client = await getClient();
    const channel = client
      .channel('tag-changes')
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table: 'tags'
        },
        (payload: { new: Tag }) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return {
    getTags,
    createTag,
    updateTag,
    deleteTag,
    getSpreadsheetTags,
    addTagToSpreadsheet,
    removeTagFromSpreadsheet,
    getSpreadsheetsByTag,
    subscribeToTags,
    isLoaded,
    isSignedIn
  };
} 