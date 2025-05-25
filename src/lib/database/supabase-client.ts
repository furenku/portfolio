import { createClient } from '@supabase/supabase-js';
import { validateEnvVars } from '../utils/env-validation';

// Validate environment variables first
validateEnvVars();

const supabaseUrl = process.env.MEDIASERVER_SUPABASE_URL;
const supabaseAnonKey = process.env.MEDIASERVER_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables (URL and Anon Key) are not set.");
  throw new Error("Supabase environment variables are missing.");
}

// Create a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);