
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbfalzkgizeaixligtfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmFsemtnaXplYWl4bGlndGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwOTkwNzUsImV4cCI6MjA1NDY3NTA3NX0.TDTXh-0WkCgV5ojlM01zU83SZz4Kd72LgZsCMGfyH8M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing tables...');
    // There is no direct "list tables" in supabase-js, but we can try to infer from a known table or error message
    // Or just try query 'users' table which is likely what holds the profiles.

    // Maybe the table is 'profiles'? or 'users' (public)?

    const tables = ['users', 'profiles', 'clients', 'app_users', 'members'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table '${table}': Error - ${error.message}`);
        } else {
            console.log(`Table '${table}': EXISTS. Rows: ${data.length}`);
            if (data.length > 0) console.log('Sample:', data[0]);
        }
    }
}

listTables();
