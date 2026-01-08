-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS default_exercises CASCADE;

-- Créer la table des exercices par défaut
CREATE TABLE default_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT,
  equipment TEXT[],
  instructions TEXT[],
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE default_exercises ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture par tous les utilisateurs authentifiés
CREATE POLICY "Permettre la lecture des exercices par défaut"
  ON default_exercises FOR SELECT
  TO authenticated
  USING (true);

-- Insérer les exercices de base
INSERT INTO default_exercises (name, description, category, difficulty_level, equipment, instructions) VALUES
-- Exercices de force
(
  'Pompes',
  'Un exercice de base pour développer la force du haut du corps',
  'Force',
  'Débutant',
  ARRAY['Aucun'],
  ARRAY[
    'Placez-vous en position de planche, mains légèrement plus écartées que les épaules',
    'Gardez le corps droit et aligné',
    'Descendez en pliant les coudes jusqu''à ce que la poitrine frôle le sol',
    'Remontez en poussant sur vos bras jusqu''à extension complète'
  ]
),
(
  'Squats',
  'Exercice fondamental pour le bas du corps',
  'Force',
  'Débutant',
  ARRAY['Aucun'],
  ARRAY[
    'Tenez-vous debout, pieds écartés largeur d''épaules',
    'Descendez comme pour vous asseoir, en poussant les hanches vers l''arrière',
    'Gardez le dos droit et les genoux alignés avec les orteils',
    'Remontez en poussant sur vos jambes'
  ]
),
(
  'Développé couché',
  'Exercice classique pour la poitrine et les épaules',
  'Force',
  'Intermédiaire',
  ARRAY['Banc de musculation', 'Barre', 'Poids'],
  ARRAY[
    'Allongez-vous sur le banc, pieds au sol',
    'Saisissez la barre légèrement plus large que les épaules',
    'Descendez la barre jusqu''à la poitrine en contrôlant le mouvement',
    'Poussez la barre vers le haut jusqu''à extension complète des bras'
  ]
),

-- Exercices de cardio
(
  'Burpees',
  'Exercice complet combinant force et cardio',
  'Cardio',
  'Intermédiaire',
  ARRAY['Aucun'],
  ARRAY[
    'Commencez debout',
    'Descendez en position de pompe',
    'Effectuez une pompe',
    'Ramenez les pieds vers les mains d''un saut',
    'Sautez vers le haut en levant les bras'
  ]
),
(
  'Mountain Climbers',
  'Excellent exercice pour le cardio et le gainage',
  'Cardio',
  'Débutant',
  ARRAY['Aucun'],
  ARRAY[
    'Prenez la position de planche',
    'Alternez en ramenant chaque genou vers la poitrine',
    'Gardez le dos droit et le regard vers le sol',
    'Maintenez un rythme rapide et régulier'
  ]
),

-- Exercices de flexibilité
(
  'Étirements des ischio-jambiers',
  'Améliore la souplesse des jambes',
  'Flexibilité',
  'Débutant',
  ARRAY['Tapis de yoga'],
  ARRAY[
    'Asseyez-vous jambes tendues devant vous',
    'Penchez-vous en avant en gardant le dos droit',
    'Essayez d''attraper vos orteils',
    'Maintenez la position 30 secondes'
  ]
),

-- Exercices d''équilibre
(
  'Planche',
  'Excellent pour le gainage et la stabilité',
  'Équilibre',
  'Débutant',
  ARRAY['Tapis de yoga'],
  ARRAY[
    'Placez-vous sur les avant-bras et la pointe des pieds',
    'Gardez le corps parfaitement aligné',
    'Contractez les abdominaux et les fessiers',
    'Maintenez la position le plus longtemps possible'
  ]
),

-- Exercices HIIT
(
  'Jumping Jacks',
  'Exercice cardio classique',
  'HIIT',
  'Débutant',
  ARRAY['Aucun'],
  ARRAY[
    'Commencez debout, pieds joints et bras le long du corps',
    'Sautez en écartant les jambes et en levant les bras au-dessus de la tête',
    'Revenez à la position initiale d''un saut',
    'Répétez rapidement'
  ]
);

-- Fonction pour copier un exercice par défaut
CREATE OR REPLACE FUNCTION copy_default_exercise(
  p_default_exercise_id UUID,
  p_coach_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_exercise_id UUID;
BEGIN
  -- Copier l'exercice par défaut vers les exercices personnalisés
  INSERT INTO exercises (
    coach_id,
    name,
    description,
    category,
    difficulty_level,
    equipment,
    instructions,
    video_url
  )
  SELECT 
    p_coach_id,
    name,
    description,
    category,
    difficulty_level,
    equipment,
    instructions,
    video_url
  FROM default_exercises
  WHERE id = p_default_exercise_id
  RETURNING id INTO v_new_exercise_id;

  RETURN v_new_exercise_id;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION copy_default_exercise TO authenticated;
GRANT SELECT ON default_exercises TO authenticated;