import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.');
}

export const supabase = createClient(
  supabaseUrl || 'https://xecwybnfvykvxqcsvmtn.supabase.co',
  supabaseAnonKey || 'CONFIGURE_SUA_CHAVE_PUBLICAVEL',
);
