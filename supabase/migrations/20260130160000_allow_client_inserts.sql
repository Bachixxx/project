-- Allow clients to insert their own body scans
CREATE POLICY "Clients can insert their own scans"
    ON public.body_scans
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM public.clients WHERE auth_id = auth.uid()
        )
    );
