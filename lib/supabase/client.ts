import { useSupabaseClient } from './clerk-client';

// Re-export the hook for convenience
export { useSupabaseClient };

// Helper functions for spreadsheet operations should now be in a hook
export function useSpreadsheetOperations() {
  const { getClient, isLoaded, isSignedIn } = useSupabaseClient();

  return {
    isLoaded,
    isSignedIn,
    
    // Create a new spreadsheet
    async createSpreadsheet(title: string, userId: string) {
      const client = await getClient();
      return client
        .from('spreadsheets')
        .insert([
          {
            title,
            user_id: userId,
            data: {},
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
    },

    // Get all spreadsheets for a user
    async getSpreadsheets(userId: string) {
      const client = await getClient();
      return client
        .from('spreadsheets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    },

    // Get a single spreadsheet by ID
    async getSpreadsheet(id: string) {
      const client = await getClient();
      return client
        .from('spreadsheets')
        .select('*')
        .eq('id', id)
        .single();
    },

    // Update spreadsheet data
    async updateSpreadsheet(id: string, data: any) {
      const client = await getClient();
      return client
        .from('spreadsheets')
        .update({ 
          data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    },

    // Delete a spreadsheet
    async deleteSpreadsheet(id: string) {
      const client = await getClient();
      return client
        .from('spreadsheets')
        .delete()
        .eq('id', id);
    },
  };
} 