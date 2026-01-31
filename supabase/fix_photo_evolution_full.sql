-- 1. Ensure Bucket Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_progress_photos', 'client_progress_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clients can upload their own photos" ON client_photos;
DROP POLICY IF EXISTS "Clients can view their own photos" ON client_photos;
DROP POLICY IF EXISTS "Clients can delete their own photos" ON client_photos;
DROP POLICY IF EXISTS "Coaches can view their clients' photos" ON client_photos;
DROP POLICY IF EXISTS "Coaches can delete their clients' photos" ON client_photos;
DROP POLICY IF EXISTS "Coaches can upload photos for their clients" ON client_photos;

DROP POLICY IF EXISTS "Clients can upload their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can view their clients' progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can upload their clients' progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete their clients' progress photos" ON storage.objects;

-- 3. CLIENT Policies (Table)
CREATE POLICY "Clients can view their own photos"
    ON client_photos FOR SELECT
    USING (client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid()));

CREATE POLICY "Clients can upload their own photos"
    ON client_photos FOR INSERT
    WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid()));

CREATE POLICY "Clients can delete their own photos"
    ON client_photos FOR DELETE
    USING (client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid()));

-- 4. COACH Policies (Table)
CREATE POLICY "Coaches can view their clients' photos"
    ON client_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can delete their clients' photos"
    ON client_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can upload photos for their clients"
    ON client_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
        )
    );

-- 5. CLIENT Policies (Storage)
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

-- 6. COACH Policies (Storage)
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
