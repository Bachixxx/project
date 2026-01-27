import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = "4554f523-0919-4c97-9df2-acdd2f459914"
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')

serve(async (req) => {
    if (!ONESIGNAL_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'ONESIGNAL_API_KEY not set' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const { record, type, table, schema } = await req.json()

    // Initialize Supabase Client (if needed for fetching extra data)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let notification = null

    try {
        // 1. New Class (Appointment)
        if (table === 'appointments' && type === 'INSERT') {
            // Notify Client(s)
            // If it's a 1-on-1 (has client_id), notify that client
            // If it's a group class (no client_id initially, or managed differently), might need logic
            // Assuming 'client_id' is present for now based on typical schema

            if (record.client_id) {
                notification = {
                    headings: { en: "Nouveau rendez-vous", fr: "Nouveau rendez-vous" },
                    contents: { en: `New appointment: ${record.title}`, fr: `Nouveau rendez-vous : ${record.title}` },
                    include_external_user_ids: [record.client_id],
                    data: { type: 'appointment', id: record.id }
                }
            }
        }

        // 2. Workout Completed (client_programs update)
        if (table === 'client_programs' && type === 'UPDATE') {
            // Check if status changed to completed
            // We need 'old_record' potentially, but webhooks send 'record' and 'old_record' usually. 
            // However, standard payload has 'record'. We check if record.status === 'completed' 
            // and we presume it wasn't before (or we just notify anyway, which is fine).

            if (record.status === 'completed') {
                // We need the Coach ID to notify them. 
                // Fetch program -> coach_id
                const { data: program } = await supabase
                    .from('programs')
                    .select('coach_id, name')
                    .eq('id', record.program_id)
                    .single()

                const { data: client } = await supabase
                    .from('clients')
                    .select('full_name')
                    .eq('id', record.client_id)
                    .single()

                if (program?.coach_id) {
                    const clientName = client?.full_name || "Un client";
                    notification = {
                        headings: { en: "Workout Completed", fr: "Séance terminée !" },
                        contents: { en: `${clientName} finished ${program.name}`, fr: `${clientName} a terminé ${program.name}` },
                        include_external_user_ids: [program.coach_id],
                        data: { type: 'workout_completed', id: record.id }
                    }
                }
            }
        }

        // 3. Payment Received
        if (table === 'payments' && type === 'INSERT') {
            // Notify Coach
            // Assuming payment has coach_id
            if (record.coach_id) {
                notification = {
                    headings: { en: "New Payment", fr: "Nouveau Paiement 💰" },
                    contents: { en: `Received ${record.amount}€`, fr: `Vous avez reçu un paiement de ${record.amount}€` },
                    include_external_user_ids: [record.coach_id],
                    data: { type: 'payment', id: record.id }
                }
            }
        }

        if (notification) {
            const response = await fetch("https://onesignal.com/api/v1/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${ONESIGNAL_API_KEY}`
                },
                body: JSON.stringify({
                    app_id: ONESIGNAL_APP_ID,
                    ...notification
                })
            })
            const result = await response.json()
            console.log("OneSignal Result:", result)
        }

        return new Response(JSON.stringify({ success: true, notificationSent: !!notification }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        })
    }
})
