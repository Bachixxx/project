import React, { useState } from 'react';
import { Plus, X, Trash2, Edit2 } from 'lucide-react';

interface SessionExercise {
  id: string;
  exercise: {
    id: string;
    name: string;
    category: string;
    difficulty_level: string;
  };
  sets: number;
  reps: number;
  rest_time: number;
  order_index: number;
  instructions?: string;
  group_id?: string | null;
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
  duration_seconds?: number;
  distance_meters?: number;
}

interface ExerciseGroup {
  id: string;
  name: string;
  repetitions: number;
  order_index: number;
  exercises: SessionExercise[];
}

interface ExerciseGroupManagerProps {
  groups: ExerciseGroup[];
  standaloneExercises: SessionExercise[];
  onCreateGroup: (name: string, repetitions: number) => void;
  onUpdateGroup: (groupId: string, name: string, repetitions: number) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddExercisesToGroup: (groupId: string, exercises: SessionExercise[]) => void;
  onRemoveExerciseFromGroup: (groupId: string, exerciseIndex: number) => void;
  onUpdateExercise: (exerciseIndex: number, updates: Partial<SessionExercise>) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onShowExercisePicker: (groupId: string) => void;
}

export function ExerciseGroupManager({
  groups,
  standaloneExercises,
  onUpdateGroup,
  onDeleteGroup,
  onRemoveExerciseFromGroup,
  onUpdateExercise,
  onRemoveExercise,
  onShowExercisePicker,
}: ExerciseGroupManagerProps) {
  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <div
          key={group.id}
          className="p-4 bg-white/5 border border-emerald-500/30 rounded-xl relative group"
        >
          {/* Group Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold text-sm flex items-center gap-2">
                Groupe {groupIndex + 1}
              </div>
              <h3 className="font-bold text-white text-lg">{group.name}</h3>
              <div className="px-3 py-1 bg-black/40 rounded-lg text-sm text-gray-400 border border-white/5">
                <span className="text-white font-bold">{group.repetitions}</span> tours
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onShowExercisePicker(group.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  const newName = prompt('Nom du groupe:', group.name);
                  const newReps = prompt('Nombre de répétitions:', String(group.repetitions));
                  if (newName && newReps) {
                    onUpdateGroup(group.id, newName, parseInt(newReps));
                  }
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Supprimer ce groupe? Les exercices seront conservés en exercices indépendants.')) {
                    onDeleteGroup(group.id);
                  }
                }}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pl-4 border-l-2 border-emerald-500/10">
            {group.exercises.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                Groupe vide
              </div>
            )}
            {group.exercises.map((exercise, exerciseIndex) => (
              <ExerciseCardContent
                key={exerciseIndex}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                indexLabel={`${exerciseIndex + 1}`}
                isGroup={true}
                onUpdate={(updates) => {
                  const globalIndex = standaloneExercises.length + groups
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.exercises.length, 0) + exerciseIndex;
                  onUpdateExercise(globalIndex, updates);
                }}
                onRemove={() => onRemoveExerciseFromGroup(group.id, exerciseIndex)}
              />
            ))}
          </div>
        </div>
      ))}

      {standaloneExercises.length > 0 && (
        <div className="space-y-3">
          {groups.length > 0 && <div className="h-px bg-white/10 my-6" />}
          {standaloneExercises.map((exercise, index) => (
            <ExerciseCardContent
              key={index}
              exercise={exercise}
              exerciseIndex={index}
              indexLabel={`${groups.reduce((acc, g) => acc + g.exercises.length, 0) + index + 1}`}
              isGroup={false}
              onUpdate={(updates) => onUpdateExercise(index, updates)}
              onRemove={() => onRemoveExercise(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for consistent card layout
function ExerciseCardContent({
  exercise,
  exerciseIndex,
  indexLabel,
  isGroup,
  onUpdate,
  onRemove
}: {
  exercise: SessionExercise,
  exerciseIndex: number, // Kept to match usage above, though unused in body, it's fine.
  indexLabel: string,
  isGroup: boolean,
  onUpdate: (updates: Partial<SessionExercise>) => void,
  onRemove: () => void
}) {
  return (
    <div className="p-4 bg-[#1e293b]/50 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
      {/* Header: Name and Type */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${isGroup ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {indexLabel}
          </div>
          <div>
            <h4 className="font-bold text-white text-lg leading-tight">{exercise.exercise.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span className="capitalize">{exercise.exercise.category}</span>
              <span>•</span>
              <span className="capitalize">{exercise.exercise.difficulty_level}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content: Horizontal Layout */}
      <div className="flex flex-col lg:flex-row gap-4 ml-11">
        {/* Instructions Field (Full width or grow) */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={exercise.instructions || ''}
            onChange={(e) => onUpdate({ instructions: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            placeholder="Instructions spéciales (ex: tempo 3-0-1)"
          />
        </div>

        {/* Metrics: Sets/Reps/Rest Row */}
        <div className="flex gap-3 items-center shrink-0">
          {exercise.tracking_type === 'duration' ? (
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-xs text-gray-500 uppercase font-bold">Secs</span>
              <input
                type="number"
                value={exercise.duration_seconds || 0}
                onChange={(e) => onUpdate({ duration_seconds: parseInt(e.target.value) || 0 })}
                className="w-16 bg-transparent text-white font-mono text-center focus:outline-none"
                step="10"
              />
            </div>
          ) : exercise.tracking_type === 'distance' ? (
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-xs text-gray-500 uppercase font-bold">Mètres</span>
              <input
                type="number"
                value={exercise.distance_meters || 0}
                onChange={(e) => onUpdate({ distance_meters: parseInt(e.target.value) || 0 })}
                className="w-20 bg-transparent text-white font-mono text-center focus:outline-none"
                step="100"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-xs text-gray-500 uppercase font-bold">Séries</span>
                <input
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
                  className="w-12 bg-transparent text-white font-mono text-center focus:outline-none"
                />
              </div>
              <span className="text-gray-600 text-sm">×</span>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-xs text-gray-500 uppercase font-bold">Reps</span>
                <input
                  type="number"
                  value={exercise.reps}
                  onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
                  className="w-12 bg-transparent text-white font-mono text-center focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="w-px h-8 bg-white/10 mx-1" />

          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5" title="Temps de repos">
            <span className="text-xs text-gray-500 uppercase font-bold">Repos</span>
            <input
              type="number"
              value={exercise.rest_time}
              onChange={(e) => onUpdate({ rest_time: parseInt(e.target.value) })}
              className="w-12 bg-transparent text-gray-400 focus:text-white font-mono text-center focus:outline-none"
              placeholder="60"
            />
            <span className="text-xs text-gray-600">s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GroupModalProps {
  onClose: () => void;
  onCreate: (name: string, repetitions: number) => void;
}

export function GroupModal({ onClose, onCreate }: GroupModalProps) {
  const [name, setName] = useState('Circuit');
  const [repetitions, setRepetitions] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name, repetitions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Créer un groupe</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du groupe
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ex: Circuit A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Répétitions du circuit
            </label>
            <input
              type="number"
              value={repetitions}
              onChange={(e) => setRepetitions(parseInt(e.target.value))}
              className="input-field"
              min="1"
              max="20"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="primary-button"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
