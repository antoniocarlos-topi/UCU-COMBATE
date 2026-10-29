import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xtzdlfhtzzwnjpzdbmjb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0emRsZmh0enp3bmpwemRibWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTk0MzAsImV4cCI6MjA3MjY3NTQzMH0.DlH5sHOWtpoMJxhNtFVaVOhbHw4X5XqFHJyQPmICbr0';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
