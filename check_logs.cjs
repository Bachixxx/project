
const { createClient } = require('@supabase/supabase-js');

// Hardcoded from .env to avoid dependency/path issues in this temp script
const supabaseUrl = 'https://sbfalzkgizeaixligtfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmFsemtnaXplYWl4bGlndGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwOTkwNzUsImV4cCI6MjA1NDY3NTA3NX0.TDTXh-0WkCgV5ojlM01zU83SZz4Kd72LgZsCMGfyH8M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log('Fetching logs...');
    const { data, error } = await supabase
        .from('workout_logs')
        .select('id, completed_at, client_id')
        .order('completed_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching logs:', error);
    } else {
        console.log('Latest Workout Logs:', JSON.stringify(data, null, 2));
    }
}

checkLogs();
