import { createClient } from '@supabase/supabase-js'


// Project ID: zhurpemyccmmtrmzzfmc
const anonKeys = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXJwZW15Y2NtbXRybXp6Zm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyODQ0MDAsImV4cCI6MjA2MDg2MDQwMH0.gPvAwDeG0Mnzkuyv6bzqG0vz5AJarmn5clZKWIghpag'
const projectUrl = 'https://zhurpemyccmmtrmzzfmc.supabase.co'

export const supabase = createClient(`${projectUrl}`, `${anonKeys}`);

