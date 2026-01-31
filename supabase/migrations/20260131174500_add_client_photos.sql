-- Create client_photos table
CREATE TABLE IF NOT EXISTS client_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    pose TEXT NOT NULL CHECK (pose IN ('front', 'side', 'back')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;

-- Policies for client_photos
CREATE POLICY "Clients can view their own photos"
    ON client_photos FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Clients can upload their own photos"
    ON client_photos FOR INSERT
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own photos"
    ON client_photos FOR DELETE
    USING (auth.uid() = client_id);

-- Storage bucket setup (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_progress_photos', 'client_progress_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
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
