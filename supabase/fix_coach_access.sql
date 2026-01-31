-- Allow coaches to view their clients' photos
CREATE POLICY "Coaches can view their clients' photos"
    ON client_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
        )
    );

-- Allow coaches to delete their clients' photos (optional, but good for management)
CREATE POLICY "Coaches can delete their clients' photos"
    ON client_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
        )
    );

-- Allow coaches to upload photos for their clients (optional)
CREATE POLICY "Coaches can upload photos for their clients"
    ON client_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
        )
    );


-- STORAGE POLICIES FOR COACHES

CREATE POLICY "Coaches can view their clients' progress photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE coach_id = auth.uid()
    )
);

CREATE POLICY "Coaches can upload their clients' progress photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE coach_id = auth.uid()
    )
);

CREATE POLICY "Coaches can delete their clients' progress photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients WHERE coach_id = auth.uid()
    )
);
