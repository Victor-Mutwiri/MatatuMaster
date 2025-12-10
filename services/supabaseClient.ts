
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://otobwvabldnbfjnkmexs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90b2J3dmFibGRuYmZqbmttZXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzM3ODIsImV4cCI6MjA4MDk0OTc4Mn0.7YPXcQkJ7XrjFPzTQk-XLzZGyWHu2OMLOeUfq7Cnh6k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
