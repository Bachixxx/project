import React, { useState } from 'react';
import { Search, Dumbbell, Check } from 'lucide-react';
import { ResponsiveModal } from '../ResponsiveModal';

interface Exercise {
    id: string;
    name: string;
    category: string;
    difficulty_level: string;
    coach_id: string | null;
}

interface ExerciseSelectorProps {
    exercises: Exercise[];
    onSelect: (selectedExercises: Exercise[]) => void;
    onClose: () => void;
    loading?: boolean;
    initialSelectedIds?: string[];
    multiSelect?: boolean;
}

export function ExerciseSelector({
    exercises,
    onSelect,
    onClose,
    loading = false,
    initialSelectedIds = [],
    multiSelect = true
}: ExerciseSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'mine' | 'system'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

    const categories = [...new Set(exercises.map((e) => e.category))];

    const filteredExercises = exercises.filter((exercise) => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || exercise.category === selectedCategory;

        let matchesSource = true;
        if (sourceFilter === 'mine') {
            matchesSource = exercise.coach_id !== null;
        } else if (sourceFilter === 'system') {
            matchesSource = exercise.coach_id === null;
        }

        return matchesSearch && matchesCategory && matchesSource;
    });

    const toggleSelection = (id: string) => {
        if (!multiSelect) {
            setSelectedIds([id]);
            return;
        }
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const handleValidate = () => {
        const selectedObjects = exercises.filter((e) => selectedIds.includes(e.id));
        onSelect(selectedObjects);
    };

    const footer = (
        <div className="flex justify-between items-center w-full gap-4">
            <span className="text-gray-400 text-sm hidden sm:inline">
                {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-3 flex-1 sm:flex-none justify-end">
                <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
                >
                    Annuler
                </button>
                <button
                    onClick={handleValidate}
                    disabled={selectedIds.length === 0}
                    className="flex-1 sm:flex-none primary-button disabled:opacity-50 disabled:cursor-not-allowed px-6"
                >
                    Ajouter ({selectedIds.length})
                </button>
            </div>
        </div>
    );

    return (
        <ResponsiveModal
            isOpen={true}
            onClose={onClose}
            title="Sélectionner des exercices"
            footer={footer}
        >
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-9 w-full"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input-field appearance-none cursor-pointer w-auto"
                    >
                        <option value="" className="bg-gray-800">Toutes catégories</option>
                        {categories.map((category) => (
                            <option key={category} value={category} className="bg-gray-800">{category}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setSourceFilter('all')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${sourceFilter === 'all' ? 'bg-primary-500 text-white font-medium' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setSourceFilter('mine')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${sourceFilter === 'mine' ? 'bg-primary-500 text-white font-medium' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Mes Exercices
                    </button>
                    <button
                        onClick={() => setSourceFilter('system')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${sourceFilter === 'system' ? 'bg-primary-500 text-white font-medium' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Système
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredExercises.length > 0 ? (
                            filteredExercises.map((exercise) => {
                                const isSelected = selectedIds.includes(exercise.id);
                                return (
                                    <button
                                        key={exercise.id}
                                        onClick={() => toggleSelection(exercise.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group
                        ${isSelected
                                                ? 'bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                          ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:text-blue-400'}`}>
                                                {isSelected ? <Check className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-semibold ${isSelected ? 'text-blue-200' : 'text-white'}`}>{exercise.name}</h4>
                                                    {exercise.coach_id === null ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                            Système
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                                            Perso
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="px-1.5 py-0.5 rounded bg-gray-700/50 border border-gray-600/30">{exercise.category}</span>
                                                    <span>•</span>
                                                    <span>{exercise.difficulty_level}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-600 group-hover:border-blue-400'}`}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Aucun exercice trouvé
                            </div>
                        )}
                    </div>
                )}
            </div>

        </ResponsiveModal >
    );
}
