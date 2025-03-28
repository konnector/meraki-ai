import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

// Helper functions for spreadsheet operations
export const spreadsheetApi = {
  // Create a new spreadsheet
  async createSpreadsheet(title: string, userId: string) {
    return await supabase
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
    return await supabase
      .from('spreadsheets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // Get a single spreadsheet by ID
  async getSpreadsheet(id: string) {
    return await supabase
      .from('spreadsheets')
      .select('*')
      .eq('id', id)
      .single();
  },

  // Update spreadsheet data
  async updateSpreadsheet(id: string, data: any) {
    return await supabase
      .from('spreadsheets')
      .update({ 
        data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  },

  // Delete a spreadsheet
  async deleteSpreadsheet(id: string) {
    return await supabase
      .from('spreadsheets')
      .delete()
      .eq('id', id);
  },
}; 