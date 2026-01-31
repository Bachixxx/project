-- Force creation of the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_progress_photos', 'client_progress_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts if we need to recreate them
DROP POLICY IF EXISTS "Clients can upload their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete their own progress photos" ON storage.objects;

-- Re-create policies ensuring they target the correct bucket
CREATE POLICY "Clients can upload their own progress photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Clients can view their own progress photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Clients can update their own progress photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Clients can delete their own progress photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
