ALTER TABLE public.body_scans 
ADD COLUMN IF NOT EXISTS bmi DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS visceral_fat_level DECIMAL(4, 1),
ADD COLUMN IF NOT EXISTS bmr INTEGER,
ADD COLUMN IF NOT EXISTS metabolic_age INTEGER,

-- Segmental Muscle
ADD COLUMN IF NOT EXISTS segmental_muscle_right_arm DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS segmental_muscle_left_arm DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS segmental_muscle_trunk DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS segmental_muscle_right_leg DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS segmental_muscle_left_leg DECIMAL(4, 2),

-- Segmental Fat
ADD COLUMN IF NOT EXISTS segmental_fat_right_arm DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS segmental_fat_left_arm DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS segmental_fat_trunk DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS segmental_fat_right_leg DECIMAL(4, 2),
ADD COLUMN IF NOT EXISTS segmental_fat_left_leg DECIMAL(4, 2);
