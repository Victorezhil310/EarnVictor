import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgpjiufwfrffibcbyjlh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncGppdWZ3ZnJmZmliY2J5amxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDU4MzIsImV4cCI6MjEwMDc4MTgzMn0.vJ6yVUYfoH_U7287KvTNGi9vjr1Xm7GefVJLkOhIWNQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
