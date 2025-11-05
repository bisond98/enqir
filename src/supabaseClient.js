import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ervsfadfervihhzykyfy.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVydnNmYWRmZXJ2aWhoenlreWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODk4MDUsImV4cCI6MjA3MDE2NTgwNX0.x1dGI76GzVurD8PzmW0SVF2D3AxvL4nmWkC1CG5EwA0"

export const supabase = createClient(supabaseUrl, supabaseKey)