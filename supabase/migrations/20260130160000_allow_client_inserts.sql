-- Allow clients to view their own profile (Required for the insert check below)
CREATE POLICY "Clients can view their own profile"
    ON public.clients
    FOR SELECT
    USING (auth_id = auth.uid());

-- Allow clients to insert their own body scans
CREATE POLICY "Clients can insert their own scans"
    ON public.body_scans
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM public.clients WHERE auth_id = auth.uid()
        )
    );
