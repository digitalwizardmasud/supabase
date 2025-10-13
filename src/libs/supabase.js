import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://ozzddrrvhoxsoxninjkj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96emRkcnJ2aG94c294bmluamtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODk4MzYsImV4cCI6MjA3NTc2NTgzNn0.oJ2eThT6Q2NLX3n47TOIWILzC1pjPXMS8R1yTJmE6Uc'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default supabase