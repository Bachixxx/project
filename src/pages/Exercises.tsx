import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Play,
  Dumbbell,
  Timer,
  Ruler,
  Filter,
  List,
  AlertCircle,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';

interface Exercise {
  id: string;
  coach_id: string | null; // Added
  name: string;
  description: string;
  category: string;
  difficulty_level: string;
  equipment: string[];
  instructions: string[];
  video_url?: string;
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
}

function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mine' | 'system'>('all'); // New Filter
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { user } = useAuth();

  const categories = [
    t('exercises.categories.strength'),
    t('exercises.categories.cardio'),
    t('exercises.categories.flexibility'),
    t('exercises.categories.balance'),
    t('exercises.categories.hiit'),
  ];

  const difficultyLevels = [
    t('exercises.difficulty.beginner'),
    t('exercises.difficulty.intermediate'),
    t('exercises.difficulty.advanced'),
  ];

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`coach_id.eq.${user?.id},coach_id.is.null`) // Fetch BOTH
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user]);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;

    // New Source Filtering Logic
    let matchesSource = true;
    if (sourceFilter === 'mine') {
      matchesSource = exercise.coach_id === user?.id;
    } else if (sourceFilter === 'system') {
      matchesSource = exercise.coach_id === null;
    }

    return matchesSearch && matchesCategory && matchesSource;
  });

  // ... (tracking helper functions remain same)

  const getTrackingIcon = (type: string) => {
    switch (type) {
      case 'duration': return <Timer className="w-3 h-3 mr-1" />;
      case 'distance': return <Ruler className="w-3 h-3 mr-1" />;
      default: return <Dumbbell className="w-3 h-3 mr-1" />;
    }
  };

  const getTrackingLabel = (type: string) => {
    switch (type) {
      case 'duration': return t('exercises.form.trackingType.duration');
      case 'distance': return t('exercises.form.trackingType.distance');
      default: return t('exercises.form.trackingType.reps_weight');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('exercises.title')}</h1>
          <p className="text-gray-400">
            Accédez à vos exercices et à la bibliothèque système
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedExercise(null);
            setIsModalOpen(true);
          }}
          className="primary-button flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('exercises.addExercise')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('exercises.searchExercises')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${sourceFilter === 'all' ? 'bg-primary-500 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setSourceFilter('mine')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${sourceFilter === 'mine' ? 'bg-primary-500 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
          >
            Mes Exercices
          </button>
          <button
            onClick={() => setSourceFilter('system')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${sourceFilter === 'system' ? 'bg-primary-500 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
          >
            Système
          </button>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field w-full md:w-48 appearance-none cursor-pointer"
        >
          <option value="" className="bg-gray-800">{t('exercises.categories.all')}</option>
          {categories.map(category => (
            <option key={category} value={category} className="bg-gray-800">{category}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="glass-card overflow-hidden group flex flex-col h-full">
              {exercise.video_url && (
                <a
                  href={exercise.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video bg-black relative group cursor-pointer overflow-hidden border-b border-white/5"
                >
                  <img
                    src={(() => {
                      const url = exercise.video_url || '';
                      let videoId = '';
                      if (url.includes('youtube.com/watch?v=')) {
                        videoId = url.split('watch?v=')[1]?.split('&')[0];
                      } else if (url.includes('youtu.be/')) {
                        videoId = url.split('youtu.be/')[1]?.split('?')[0];
                      } else if (url.includes('youtube.com/embed/')) {
                        videoId = url.split('embed/')[1]?.split('?')[0];
                      }
                      return videoId
                        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                        : 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80';
                    })()}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                      <Play className="w-6 h-6 text-white ml-1 fill-white" />
                    </div>
                  </div>
                </a>
              )}

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <h3 className="font-semibold text-white truncate pr-2">{exercise.name}</h3>
                    {exercise.coach_id === null ? (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Système
                      </span>
                    ) : (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                        Perso
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    {exercise.coach_id === user?.id ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedExercise(exercise);
                            setIsModalOpen(true);
                          }}
                          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exercise.id)}
                          className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        className="p-1 opacity-50 cursor-not-allowed text-gray-600"
                        title="Lecture seule"
                      >
                        <Shield className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {getTrackingIcon(exercise.tracking_type || 'reps_weight')}
                    {exercise.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${exercise.difficulty_level === 'Débutant' || exercise.difficulty_level === 'Beginner'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : exercise.difficulty_level === 'Intermédiaire' || exercise.difficulty_level === 'Intermediate'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {exercise.difficulty_level}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                  {exercise.description}
                </p>

                <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                  {exercise.equipment && exercise.equipment.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('exercises.form.equipment')}</p>
                      <p className="text-sm text-gray-300">{exercise.equipment.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ExerciseModal
          exercise={selectedExercise}
          onClose={() => setIsModalOpen(false)}
          onSave={async (exerciseData: any) => {
            try {
              if (selectedExercise) {
                const { error } = await supabase
                  .from('exercises')
                  .update(exerciseData)
                  .eq('id', selectedExercise.id);

                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from('exercises')
                  .insert([{ ...exerciseData, coach_id: user?.id }]);

                if (error) throw error;
              }

              fetchExercises();
              setIsModalOpen(false);
            } catch (error) {
              console.error('Error saving exercise:', error);
            }
          }}
          categories={categories}
          difficultyLevels={difficultyLevels}
        />
      )}
    </div>
  );
}

function ExerciseModal({ exercise, onClose, onSave, categories, difficultyLevels }: any) {
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    description: exercise?.description || '',
    category: exercise?.category || categories[0],
    difficulty_level: exercise?.difficulty_level || difficultyLevels[0],
    equipment: exercise?.equipment || [],
    instructions: exercise?.instructions || [],
    video_url: exercise?.video_url || '',
    tracking_type: exercise?.tracking_type || 'reps_weight',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev as any)[field].map((item: string, i: number) => i === index ? value : item),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev as any)[field], ''],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {exercise ? t('common.edit') : t('exercises.addExercise')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            // Auto close is handled by parent, but we can prevent default
          }} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.name')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.trackingType.label')}</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'reps_weight', label: t('exercises.form.trackingType.reps_weight'), icon: Dumbbell },
                  { id: 'duration', label: t('exercises.form.trackingType.duration'), icon: Timer },
                  { id: 'distance', label: t('exercises.form.trackingType.distance'), icon: Ruler },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.tracking_type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tracking_type: type.id }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      <Icon className="w-5 h-5 mb-2" />
                      <span className="text-xs font-medium text-center">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.category')}</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                >
                  {categories.map((category: string) => (
                    <option key={category} value={category} className="bg-gray-800">{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.difficultyLevel')}</label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                >
                  {difficultyLevels.map((level: string) => (
                    <option key={level} value={level} className="bg-gray-800">{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.equipment')}</label>
              <div className="space-y-3">
                {formData.equipment.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('equipment', index, e.target.value)}
                      className="input-field"
                      placeholder="Ex: Haltères, Tapis..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('equipment', index)}
                      className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors bg-white/5 border border-white/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('equipment')}
                className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('exercises.form.addEquipment')}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.instructions')}</label>
              <div className="space-y-3">
                {formData.instructions.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-gray-500 font-medium">{index + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('instructions', index, e.target.value)}
                      className="input-field"
                      placeholder="Instruction détaillée..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('instructions', index)}
                      className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors bg-white/5 border border-white/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('instructions')}
                className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('exercises.form.addInstruction')}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('exercises.form.videoUrl')}</label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="primary-button"
              >
                {exercise ? t('common.update') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ExercisesPage;