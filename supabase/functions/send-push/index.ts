import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = "4554f523-0919-4c97-9df2-acdd2f459914"
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')

serve(async (req) => {
    // Debug logging
    console.log("Request received");

    if (!ONESIGNAL_API_KEY) {
        console.error("Missing ONESIGNAL_API_KEY");
        return new Response(
            JSON.stringify({ error: 'ONESIGNAL_API_KEY not set' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    try {
        const payload = await req.json()
        const { record, type, table } = payload
        console.log(`Processing ${type} on ${table}`, record);

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        let notification = null

        // 1. New Class (Appointment)
        if (table === 'appointments' && type === 'INSERT') {
            if (record.client_id) {
                console.log(`Targeting Client ID: ${record.client_id}`);
                notification = {
                    headings: { en: "Nouveau rendez-vous", fr: "Nouveau rendez-vous" },
                    contents: { en: `New appointment: ${record.title}`, fr: `Nouveau rendez-vous : ${record.title}` },
                    include_external_user_ids: [record.client_id],
                    data: { type: 'appointment', id: record.id }
                }
            } else {
                console.log("No client_id in appointment record");
            }
        }

        // 2. Workout Completed
        if (table === 'client_programs' && type === 'UPDATE') {
            if (record.status === 'completed') {
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
            console.log("Sending OneSignal Notification:", notification);
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
            console.log("OneSignal API Result:", result)
            
            if (result.errors) {
                 console.error("OneSignal Errors:", result.errors);
            }
        } else {
            console.log("No notification criteria met.");
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        console.error("Error processing request:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        })
    }
})
