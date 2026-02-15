
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbfalzkgizeaixligtfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmFsemtnaXplYWl4bGlndGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwOTkwNzUsImV4cCI6MjA1NDY3NTA3NX0.TDTXh-0WkCgV5ojlM01zU83SZz4Kd72LgZsCMGfyH8M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClient() {
    const email = 'jeremy.bachi10@gmail.com';
    console.log(`Debug for: ${email}`);

    // Fallback: check 'clients' table
    const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', email); // Use ilike for case-insensitive

    if (clientError) {
        console.error('Error fetching client:', clientError);
        return;
    }

    if (!clientData || clientData.length === 0) {
        console.log('Client not found in `clients` table.');
        // List first 5 clients to see structure
        const { data: allClients } = await supabase.from('clients').select('id, email, first_name, last_name').limit(5);
        console.log('Sample clients:', allClients);
        return;
    }

    const client = clientData[0];
    console.log('Client found:', client.id, client.first_name, client.last_name);

    await checkLogs(client.id);
}

async function checkLogs(clientId) {
    console.log(`Checking logs for client ID: ${clientId}`);
    // 2. Check Workout Logs
    const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select('id, completed_at, scheduled_session_id')
        .eq('client_id', clientId)
        .order('completed_at', { ascending: false })
        .limit(10);

    console.log('--- Workout Logs (Last 10) ---');
    if (logsError) console.error(logsError);
    else console.table(logs);
}

debugClient();
