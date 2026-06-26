import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || ((typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env.VITE_SUPABASE_URL : '');
const supabaseKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || ((typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : '');

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
