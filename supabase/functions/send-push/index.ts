import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = "4554f523-0919-4c97-9df2-acdd2f459914"
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')

serve(async (req) => {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Debug logging
    console.log("Request received");

    if (!ONESIGNAL_API_KEY) {
        console.error("Missing ONESIGNAL_API_KEY");
        return new Response(
            JSON.stringify({ error: 'ONESIGNAL_API_KEY not set' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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

                // Fetch the Auth ID (Supabase User ID) which is what OneSignal uses
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('auth_id')
                    .eq('id', record.client_id)
                    .single();

                if (clientData?.auth_id) {
                    notification = {
                        headings: { en: "New Appointment 📅", fr: "Nouveau Rendez-vous 📅" },
                        subtitle: { en: record.title, fr: record.title },
                        contents: { en: "Tap to view details in the app.", fr: "Appuyez pour voir les détails." },
                        include_aliases: { external_id: [clientData.auth_id] },
                        target_channel: "push",
                        data: { type: 'appointment', id: record.id },
                        ios_badgeType: 'Increase',
                        ios_badgeCount: 1,
                        buttons: [{ id: "view", text: "Voir le rendez-vous" }]
                    }
                } else {
                    console.log("Client has no auth_id linked.");
                }
            } else {
                console.log("No client_id in appointment record");
            }
        }

        // 1.5 New Scheduled Session (Clients Page)
        if (table === 'scheduled_sessions' && type === 'INSERT') {
            if (record.client_id && record.session_id) {
                const { data: sessionData } = await supabase
                    .from('sessions')
                    .select('name')
                    .eq('id', record.session_id)
                    .single();

                // Fetch ID
                const { data: clientData, error: clientError } = await supabase
                    .from('clients')
                    .select('auth_id')
                    .eq('id', record.client_id)
                    .single();

                if (clientError) {
                    console.error("Error fetching client for scheduled_session:", clientError);
                }

                console.log(`Scheduled Session - Client Lookup Result:`, clientData);

                if (clientData?.auth_id) {
                    const sessionName = sessionData?.name || "Session privée";
                    // Format Date for subtitle
                    const dateObj = new Date(record.scheduled_date);
                    const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

                    notification = {
                        headings: { en: "New Workout Session 💪", fr: "Nouvelle Séance 💪" },
                        subtitle: { en: sessionName, fr: sessionName },
                        contents: { en: `Scheduled for ${formattedDate}`, fr: `Prévue pour le ${formattedDate}` },
                        include_aliases: { external_id: [clientData.auth_id] },
                        target_channel: "push",
                        data: { type: 'scheduled_session', id: record.id },
                        ios_badgeType: 'Increase',
                        ios_badgeCount: 1,
                        buttons: [{ id: "view_session", text: "Voir mon planning" }]
                    }
                } else {
                    console.error(`SCHEDULED SESSION ERROR: No Auth ID found for client ${record.client_id}. Check if client has signed up/logged in.`);
                }
            } else {
                console.error("SCHEDULED SESSION ERROR: Missing client_id or session_id in record", record);
            }
        }

        // 2. Workout Completed (For Coach)
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
                        headings: { en: "Workout Completed ✅", fr: "Séance Terminée ! ✅" },
                        contents: { en: `${clientName} crushed ${program.name}!`, fr: `${clientName} a terminé ${program.name} !` },
                        include_aliases: { external_id: [program.coach_id] },
                        target_channel: "push",
                        data: { type: 'workout_completed', id: record.id },
                        ios_badgeType: 'Increase',
                        ios_badgeCount: 1
                    }
                }
            }
        }

        // 3. Payment Received (For Coach)
        if (table === 'payments' && type === 'INSERT') {
            if (record.coach_id) {
                notification = {
                    headings: { en: "New Payment 💰", fr: "Nouveau Paiement 💰" },
                    contents: { en: `You received ${record.amount}€`, fr: `Vous avez reçu ${record.amount}€` },
                    include_aliases: { external_id: [record.coach_id] },
                    target_channel: "push",
                    data: { type: 'payment', id: record.id },
                    ios_badgeType: 'Increase',
                    ios_badgeCount: 1,
                    ios_sound: "cash_register.wav"
                }
            }
        }

        // 4. Manual Test Notification
        if (type === 'TEST') {
            const { user_id, subscription_id } = payload;
            console.log(`Processing TEST notification. Auth ID: ${user_id}, Sub ID: ${subscription_id}`);

            const testNotificationBase = {
                headings: { en: "Test (Style) 🎨", fr: "Test Stylé 🎨" },
                subtitle: { en: "Looking good?", fr: "C'est mieux comme ça ?" },
                contents: { en: "This is a rich notification test.", fr: "Voici à quoi ressemblent les nouvelles notifications." },
                data: { type: 'test_notification' },
                ios_badgeType: 'Increase',
                ios_badgeCount: 1,
                buttons: [{ id: "cool", text: "Stylé !" }, { id: "meh", text: "Bof" }]
            };

            if (subscription_id) {
                notification = {
                    ...testNotificationBase,
                    include_player_ids: [subscription_id]
                }
            } else if (user_id) {
                notification = {
                    ...testNotificationBase,
                    include_aliases: { external_id: [user_id] },
                    target_channel: "push"
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
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })

    } catch (err: any) {
        console.error("Error processing request:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
    }
})
