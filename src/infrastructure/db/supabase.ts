import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getVisitorIDHeader = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('essay_architect_device_id') || '';
  }
  return '';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-visitor-id': getVisitorIDHeader(),
    },
  },
});
