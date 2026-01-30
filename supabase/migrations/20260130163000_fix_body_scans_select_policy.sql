-- Drop the incorrect policy
DROP POLICY IF EXISTS "Clients can view their own scans" ON public.body_scans;

-- Create the corrected policy using auth_id lookup
CREATE POLICY "Clients can view their own scans"
    ON public.body_scans
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE auth_id = auth.uid()
        )
        OR 
        auth.uid() IN (
            SELECT coach_id FROM public.clients WHERE id = body_scans.client_id
        )
    );
