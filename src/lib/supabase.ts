import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://qerbogtxvdqsihhuadzl.supabase.co';
export const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcmJvZ3R4dmRxc2loaHVhZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc1NTAsImV4cCI6MjA5NDIzMzU1MH0.CeK1NzNgSpNXCm8BKXH1klt_E33dx8qC2PxP8_VvQZQ';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.warn('Supabase credentials missing or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
