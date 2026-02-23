SELECT se.exercise_id, se.sets, eg.type, eg.repetitions FROM session_exercises se JOIN exercise_groups eg ON se.group_id = eg.id WHERE eg.type = 'circuit' LIMIT 5;
