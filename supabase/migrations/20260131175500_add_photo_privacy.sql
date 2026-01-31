-- Add privacy columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS photo_share_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photo_share_consent_date TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to check for consent
-- We need to DROP existing coach policies first to replace them

DROP POLICY IF EXISTS "Coaches can view their clients' photos" ON client_photos;
DROP POLICY IF EXISTS "Coaches can view their clients' progress photos" ON storage.objects;

-- Re-create Coach View Policy for Table
CREATE POLICY "Coaches can view their clients' photos"
    ON client_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
            AND clients.coach_id = auth.uid()
            AND clients.photo_share_enabled = true 
        )
    );

-- Re-create Coach View Policy for Storage
CREATE POLICY "Coaches can view their clients' progress photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'client_progress_photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.clients 
        WHERE coach_id = auth.uid()
        AND photo_share_enabled = true
    )
);

-- Note: We keep delete/upload permissions for coaches based on coach_id primarily, 
-- but arguably if sharing is disabled, a coach shouldn't be seeing/managing them.
-- For now, let's restrict SELECT (Viewing) as that's the main privacy concern.
