-- Seed System Exercises (Global Library)
INSERT INTO public.exercises (name, description, category, difficulty_level, equipment, instructions, tracking_type, coach_id, created_at)
VALUES
(
  'Pompes (Push-ups)',
  'Exercice classique au poids du corps ciblant les pectoraux, les triceps et les épaules. Essentiel pour la force du haut du corps.',
  'Force',
  'Débutant',
  ARRAY[]::text[],
  ARRAY[
    'Placez-vous en position de planche, mains au sol légèrement plus larges que les épaules.',
    'Gardez le corps droit et gainé, des talons à la tête.',
    'Descendez le corps en fléchissant les coudes jusqu''à ce que la poitrine frôle le sol.',
    'Repoussez le sol pour revenir en position initiale, bras tendus.'
  ]::text[],
  'reps_weight',
  NULL, -- System Exercise
  NOW()
),
(
  'Squats au poids du corps',
  'Mouvement fondamental pour renforcer les jambes (quadriceps, ischio-jambiers) et les fessiers. Améliore aussi la mobilité.',
  'Force',
  'Débutant',
  ARRAY[]::text[],
  ARRAY[
    'Debout, pieds écartés largeur d''épaules, orteils légèrement vers l''extérieur.',
    'Engagez les abdominaux et gardez la poitrine haute.',
    'Descendez les hanches vers l''arrière et le bas, comme pour vous asseoir sur une chaise invisible.',
    'Descendez jusqu''à ce que les cuisses soient au moins parallèles au sol.',
    'Poussez sur les talons pour remonter en position debout.'
  ]::text[],
  'reps_weight',
  NULL, -- System Exercise
  NOW()
),
(
  'Planche (Plank)',
  'Exercice isométrique de gainage pour renforcer la sangle abdominale profonde et stabiliser le tronc.',
  'Force',
  'Débutant',
  ARRAY['Tapis']::text[],
  ARRAY[
    'Allongez-vous face au sol.',
    'Prenez appui sur les avant-bras et les orteils. Coudes alignés sous les épaules.',
    'Contractez fort les abdominaux, les fessiers et les cuisses.',
    'Maintenez le corps en ligne droite parfaite. Ne creusez pas le dos et ne levez pas les fesses.',
    'Respirez calmement tout en maintenant la tension.'
  ]::text[],
  'duration',
  NULL, -- System Exercise
  NOW()
),
(
  'Burpees',
  'Exercice complet et intense combinant force et cardio. Idéal pour brûler des calories et améliorer l''endurance musculaire.',
  'HIIT',
  'Intermédiaire',
  ARRAY[]::text[],
  ARRAY[
    'Commencez debout.',
    'Fléchissez les jambes pour poser les mains au sol devant vous.',
    'Jetez les pieds en arrière pour atterrir en position de planche.',
    'Faites une pompe (optionnel, pour plus de difficulté).',
    'Ramenez les pieds vers les mains par un saut dynamique.',
    'Sautez verticalement en l''air en levant les bras au-dessus de la tête.',
    'Enchaînez les répétitions avec rythme.'
  ]::text[],
  'reps_weight',
  NULL, -- System Exercise
  NOW()
),
(
  'Jumping Jacks',
  'Exercice cardio simple et efficace pour l''échauffement ou les circuits cardio. Sollicite tout le corps.',
  'Cardio',
  'Débutant',
  ARRAY[]::text[],
  ARRAY[
    'Debout, pieds joints et bras le long du corps.',
    'Sautez légèrement en écartant les jambes et en levant les bras au-dessus de la tête simultanément.',
    'Sautez à nouveau pour revenir à la position de départ (pieds joints, bras en bas).',
    'Gardez un rythme régulier et léger sur les appuis.'
  ]::text[],
  'duration',
  NULL, -- System Exercise
  NOW()
),
(
  'Fentes Avant (Lunges)',
  'Exercice unilatéral pour travailler l''équilibre et renforcer les jambes de manière isolée.',
  'Force',
  'Débutant',
  ARRAY[]::text[],
  ARRAY[
    'Debout, mains sur les hanches.',
    'Faites un grand pas en avant avec une jambe.',
    'Fléchissez les deux genoux pour descendre le corps. Le genou arrière doit frôler le sol.',
    'Le genou avant doit être aligné au-dessus de la cheville.',
    'Poussez fermement sur le pied avant pour revenir en position initiale.',
    'Alternez les jambes.'
  ]::text[],
  'reps_weight',
  NULL, -- System Exercise
  NOW()
),
(
  'Mountain Climbers',
  'Exercice cardio intense au sol qui cible aussi les abdominaux et les épaules.',
  'HIIT',
  'Intermédiaire',
  ARRAY['Tapis']::text[],
  ARRAY[
    'Mettez-vous en position de planche haute (sur les mains), corps gainé.',
    'Ramenez rapidement un genou vers la poitrine.',
    'Changez de jambe en sautant, comme si vous couriez sur place à l''horizontale.',
    'Gardez les hanches basses et le dos plat tout au long du mouvement.'
  ]::text[],
  'duration',
  NULL, -- System Exercise
  NOW()
);
