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
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set('x-visitor-id', getVisitorIDHeader());
      return fetch(input, { ...init, headers });
    },
  },
});
