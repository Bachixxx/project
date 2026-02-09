import React, { useState } from 'react';
import { ResponsiveModal } from './ResponsiveModal';
import { SessionExercise } from './BlockManager';

export function ExerciseEditModal({ exercise, onClose, onSave }: { exercise: SessionExercise, onClose: () => void, onSave: (ex: SessionExercise) => void }) {
    const [sets, setSets] = useState(exercise.sets);
    const [reps, setReps] = useState(exercise.reps);
    const [weight, setWeight] = useState(exercise.weight || 0);
    const [restTime, setRestTime] = useState(exercise.rest_time || 60);
    const [durationSeconds, setDurationSeconds] = useState(exercise.duration_seconds || 0);
    const [distanceMeters, setDistanceMeters] = useState(exercise.distance_meters || 0);
    const [calories, setCalories] = useState(exercise.calories || 0);
    const [instructions, setInstructions] = useState(exercise.instructions || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...exercise,
            sets,
            reps,
            weight,
            rest_time: restTime,
            duration_seconds: durationSeconds,
            distance_meters: distanceMeters,
            calories,
            instructions
        });
    };

    return (
        <ResponsiveModal isOpen={true} onClose={onClose} title={`Modifier ${exercise.exercise.name}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Séries</label>
                        <input
                            type="number"
                            min="1"
                            value={sets}
                            onChange={(e) => setSets(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Répétitions</label>
                        <input
                            type="number"
                            min="0"
                            value={reps}
                            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Poids (kg)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Repos (sec)</label>
                        <input
                            type="number"
                            min="0"
                            step="5"
                            value={restTime}
                            onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Durée (sec)</label>
                        <input
                            type="number"
                            min="0"
                            value={durationSeconds}
                            onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Distance (m)</label>
                        <input
                            type="number"
                            min="0"
                            value={distanceMeters}
                            onChange={(e) => setDistanceMeters(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Calories</label>
                        <input
                            type="number"
                            min="0"
                            value={calories}
                            onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="input-field min-h-[80px]"
                        placeholder="Instructions particulières..."
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="primary-button">Valider</button>
                </div>
            </form>
        </ResponsiveModal>
    );
}
