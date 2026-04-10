import { createClient } from '@supabase/supabase-js';

// We will use import.meta.env for Vite to access environment variables.
// These variables should be defined in a .env local to the project.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
