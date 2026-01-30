-- Create body_scans table
CREATE TABLE IF NOT EXISTS public.body_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- General Metrics
    weight DECIMAL(5, 2), -- kg
    height DECIMAL(5, 2), -- cm
    bmi DECIMAL(4, 2), -- Calculated or stored
    
    -- Composition
    skeletal_muscle_mass DECIMAL(5, 2), -- kg
    body_fat_mass DECIMAL(5, 2), -- kg
    body_fat_percent DECIMAL(4, 2), -- %
    
    -- Water & Bone
    total_body_water DECIMAL(5, 2), -- L or kg
    total_body_water_percent DECIMAL(4, 2), -- %
    bone_mass DECIMAL(5, 2), -- kg
    
    -- Metadata
    visceral_fat_level DECIMAL(4, 1),
    bmr INTEGER, -- Basal Metabolic Rate (kcal)
    metabolic_age INTEGER,
    
    -- Segmental Analysis (Muscle Mass in kg)
    segmental_muscle_right_arm DECIMAL(4, 2),
    segmental_muscle_left_arm DECIMAL(4, 2),
    segmental_muscle_trunk DECIMAL(5, 2),
    segmental_muscle_right_leg DECIMAL(4, 2),
    segmental_muscle_left_leg DECIMAL(4, 2),
    
    -- Segmental Analysis (Fat Mass in kg)
    segmental_fat_right_arm DECIMAL(4, 2),
    segmental_fat_left_arm DECIMAL(4, 2),
    segmental_fat_trunk DECIMAL(5, 2),
    segmental_fat_right_leg DECIMAL(4, 2),
    segmental_fat_left_leg DECIMAL(4, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.body_scans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clients can view their own scans"
    ON public.body_scans
    FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() IN (
        SELECT coach_id FROM public.clients WHERE id = body_scans.client_id
    ));

CREATE POLICY "Coaches can insert scans for their clients"
    ON public.body_scans
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT coach_id FROM public.clients WHERE id = body_scans.client_id
    ));

CREATE POLICY "Coaches can update scans for their clients"
    ON public.body_scans
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT coach_id FROM public.clients WHERE id = body_scans.client_id
    ));

CREATE POLICY "Coaches can delete scans for their clients"
    ON public.body_scans
    FOR DELETE
    USING (auth.uid() IN (
        SELECT coach_id FROM public.clients WHERE id = body_scans.client_id
    ));
