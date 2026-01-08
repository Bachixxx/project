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
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddExercisesToGroup,
  onRemoveExerciseFromGroup,
  onUpdateExercise,
  onRemoveExercise,
  onShowExercisePicker,
}: ExerciseGroupManagerProps) {
  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div
          key={group.id}
          className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-green-600 text-white rounded-lg font-semibold text-sm">
                Groupe {groupIndex + 1}
              </div>
              <h3 className="font-bold text-gray-900">{group.name}</h3>
              <span className="px-2 py-1 bg-white rounded-lg text-sm text-gray-700">
                × {group.repetitions} {group.repetitions > 1 ? 'répétitions' : 'répétition'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onShowExercisePicker(group.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-white hover:bg-green-50 rounded-lg border border-green-300"
                title="Ajouter un exercice au groupe"
              >
                <Plus className="w-4 h-4" />
                Ajouter exercice
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
                className="p-2 text-blue-600 hover:bg-white rounded-lg"
                title="Modifier le groupe"
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
                className="p-2 text-red-600 hover:bg-white rounded-lg"
                title="Supprimer le groupe"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 ml-4">
            {group.exercises.length === 0 && (
              <div className="text-center py-4 bg-white rounded-lg text-gray-500 text-sm">
                Ce groupe ne contient pas encore d'exercices. Cliquez sur "Ajouter exercice" pour en ajouter.
              </div>
            )}
            {group.exercises.map((exercise, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {exerciseIndex + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900">{exercise.exercise.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 ml-9">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {exercise.exercise.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {exercise.exercise.difficulty_level}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveExerciseFromGroup(group.id, exerciseIndex)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Retirer du groupe"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
                  <div className="flex flex-col">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Instructions (séries, répétitions, etc.)
                    </label>
                    <input
                      type="text"
                      value={exercise.instructions || ''}
                      onChange={(e) => {
                        const globalIndex = standaloneExercises.length + groups
                          .slice(0, groupIndex)
                          .reduce((acc, g) => acc + g.exercises.length, 0) + exerciseIndex;
                        onUpdateExercise(globalIndex, { instructions: e.target.value });
                      }}
                      className="w-full h-11 px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 transition-all duration-150"
                      placeholder="Ex: 3 séries de 12 répétitions"
                    />
                  </div>
                  <div className="flex flex-col max-w-[200px]">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Temps de repos (secondes)
                    </label>
                    <input
                      type="number"
                      value={exercise.rest_time}
                      onChange={(e) => {
                        const globalIndex = standaloneExercises.length + groups
                          .slice(0, groupIndex)
                          .reduce((acc, g) => acc + g.exercises.length, 0) + exerciseIndex;
                        onUpdateExercise(globalIndex, { rest_time: parseInt(e.target.value) });
                      }}
                      min="0"
                      className="w-full h-11 px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 transition-all duration-150"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {standaloneExercises.map((exercise, index) => (
        <div
          key={index}
          className="relative p-5 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {groups.reduce((acc, g) => acc + g.exercises.length, 0) + index + 1}
                </div>
                <h4 className="font-semibold text-gray-900 text-lg">{exercise.exercise.name}</h4>
              </div>
              <div className="flex items-center gap-2 ml-10">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {exercise.exercise.category}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {exercise.exercise.difficulty_level}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveExercise(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
              title="Retirer l'exercice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Instructions (séries, répétitions, etc.)
              </label>
              <input
                type="text"
                value={exercise.instructions || ''}
                onChange={(e) => onUpdateExercise(index, { instructions: e.target.value })}
                className="w-full h-11 px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 transition-all duration-150"
                placeholder="Ex: 3 séries de 12 répétitions"
              />
            </div>
            <div className="flex flex-col max-w-[200px]">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Temps de repos (secondes)
              </label>
              <input
                type="number"
                value={exercise.rest_time}
                onChange={(e) => onUpdateExercise(index, { rest_time: parseInt(e.target.value) })}
                min="0"
                className="w-full h-11 px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 transition-all duration-150"
                placeholder="60"
              />
            </div>
          </div>
        </div>
      ))}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Créer un groupe d'exercices</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Nom du groupe
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
              placeholder="Ex: Circuit A, Superset 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Nombre de répétitions du groupe
            </label>
            <input
              type="number"
              value={repetitions}
              onChange={(e) => setRepetitions(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
              min="1"
              max="20"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Le client devra répéter tous les exercices de ce groupe {repetitions} fois
            </p>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Créer le groupe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
