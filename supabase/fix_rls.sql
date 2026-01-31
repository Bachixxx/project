-- Fix client_photos TABLE policies
-- The issue was assuming auth.uid() = client_id, but client_id is a separate UUID, linked via clients.auth_id

DROP POLICY IF EXISTS "Clients can upload their own photos" ON client_photos;
DROP POLICY IF EXISTS "Clients can view their own photos" ON client_photos;
DROP POLICY IF EXISTS "Clients can delete their own photos" ON client_photos;

CREATE POLICY "Clients can view their own photos"
    ON client_photos FOR SELECT
    USING (client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid()));

CREATE POLICY "Clients can upload their own photos"
    ON client_photos FOR INSERT
    WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid()));

CREATE POLICY "Clients can delete their own photos"
    ON client_photos FOR DELETE
    USING (client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid()));

-- Fix STORAGE policies
-- The folder name is client_id, so we need to verify that this client_id belongs to the auth user.

DROP POLICY IF EXISTS "Clients can upload their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete their own progress photos" ON storage.objects;

CREATE POLICY "Clients can upload their own progress photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE auth_id = auth.uid()
    )
);

CREATE POLICY "Clients can view their own progress photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE auth_id = auth.uid()
    )
);

CREATE POLICY "Clients can update their own progress photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE auth_id = auth.uid()
    )
);

CREATE POLICY "Clients can delete their own progress photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE auth_id = auth.uid()
    )
);
