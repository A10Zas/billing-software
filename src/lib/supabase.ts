import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrfzvpjnxuojrfhhefsp.supabase.co';
const supabaseKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnp2cGpueHVvanJmaGhlZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzY2MzIsImV4cCI6MjA2NjUxMjYzMn0.nNMggNhe-SQLinoqAwHwCvBz1hGs7zQyUBNRgpg5F3g';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
