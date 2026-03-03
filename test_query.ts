import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing ENV keys");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching client...");
    const { data: clients, error: cErr } = await supabase.from('clients').select('id, full_name, email').eq('email', 'jeremy.bachi10@gmail.com');
    if (cErr) {
        console.error("cErr", cErr);
        return;
    }
    console.log("Clients:", clients);
    if (!clients || clients.length === 0) return;
    const clientId = clients[0].id;

    console.log("Fetching client_programs...");
    const { data: programs, error } = await supabase.from('client_programs').select('*').eq('client_id', clientId);
    console.log("Programs:", JSON.stringify(programs, null, 2));
    console.log("Error:", error);

    console.log("Fetching appointments...");
    const { data: appointments, error: aErr } = await supabase.from('appointments').select('*').eq('client_id', clientId);
    console.log("Appointments:", JSON.stringify(appointments, null, 2));
    console.log("Error:", aErr);
}

check();
