
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Resend } from 'https://esm.sh/resend@3.2.0'
import { TEMPLATES } from './templates.ts'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, template_name, data, subject: overrideSubject, html: overrideHtml } = await req.json()

    if (!to) {
      throw new Error('Missing "to" parameter')
    }

    let subject = overrideSubject
    let html = overrideHtml
    let templateName = template_name

    // Generate content from template if specified
    if (template_name && TEMPLATES[template_name]) {
      const template = TEMPLATES[template_name](data || {})
      subject = subject || template.subject
      html = html || template.html
    }

    if (!subject || !html) {
      throw new Error('Missing subject or html content (and no valid template_name provided)')
    }

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Coachency <onboarding@resend.dev>', // Update this with verified domain later
      to: [to],
      subject: subject,
      html: html,
    })

    if (emailError) {
      console.error('Resend Error:', emailError)
      throw new Error('Failed to send email via Resend: ' + emailError.message)
    }

    // Log to Supabase
    await supabase.from('notification_logs').insert({
      table_name: 'emails',
      event_type: templateName || 'custom',
      record: { to, subject, data },
      status: 'success',
      response_id: emailData?.id || 'unknown'
    })

    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)

    // Log error to Supabase (best effort)
    try {
      await supabase.from('notification_logs').insert({
        table_name: 'emails',
        event_type: 'error',
        status: 'error',
        error_message: error.message
      })
    } catch (logError) {
      // Ignore logging errors
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})