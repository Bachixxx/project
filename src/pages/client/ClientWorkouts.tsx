import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, Target, ChevronRight, PlayCircle, Trophy, Activity, Filter, Search } from 'lucide-react';
import { TutorialCard } from '../../components/client/TutorialCard';
import { Link } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';

function ClientWorkouts() {
  const { client: authClient } = useClientAuth();
  const client = authClient as any;
  const [loading, setLoading] = useState(true);
  const [clientPrograms, setClientPrograms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (client) {
      fetchClientPrograms();
    }
  }, [client]);

  const fetchClientPrograms = async () => {
    try {
      setLoading(true);

      // Fetch client programs with all related data
      const { data: clientProgramsData, error: programsError } = await supabase
        .from('client_programs')
        .select(`
          id,
          start_date,
          status,
          progress,
          program:programs (
            id,
            name,
            description,
            duration_weeks,
            difficulty_level,
            coach_id,
            coach:coaches (
              full_name,
              specialization
            ),
            program_sessions (
              id,
              order_index,
              session:sessions (
                id,
                name,
                duration_minutes,
                session_exercises (
                  id,
                  sets,
                  reps,
                  exercise:exercises (
                    name
                  )
                )
              )
            )
          )
        `)
        .eq('client_id', client?.id)
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;

      // Format data
      const formattedWorkouts = (clientProgramsData || []).map(cp => {
        const program = cp.program as any;
        if (!program) return null;

        // Flatten exercises for preview
        const allExercises = program.program_sessions?.flatMap((s: any) =>
          s.session?.session_exercises?.map((se: any) => se.exercise?.name) || []
        ) || [];

        // Unique exercises, up to 5
        const uniqueExercises = [...new Set(allExercises)].slice(0, 5);

        return {
          id: cp.id,
          name: program.name,
          coachName: program.coach?.full_name || 'Coach',
          description: program.description,
          duration: program.duration_weeks,
          difficulty: program.difficulty_level,
          startDate: cp.start_date,
          status: cp.status,
          progress: cp.progress || 0,
          totalSessions: program.program_sessions?.length || 0,
          previewExercises: uniqueExercises
        };
      }).filter(Boolean);

      setClientPrograms(formattedWorkouts);
    } catch (error) {
      console.error('Error fetching client programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = clientPrograms.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.coachName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return level;
    }
  };

  if (loading && !clientPrograms.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4 pb-24 md:p-8">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Mes Programmes</h1>
            <p className="text-gray-400">Gérez vos programmes d'entraînement actifs et passés.</p>
          </div>

          <Link to="/marketplace" className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all text-sm font-medium">
            <span>Explorer le catalogue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Search & Stats */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in delay-100">
          {/* Search Bar */}
          <div className="md:col-span-2 glass-card p-2 rounded-2xl border border-white/10 flex items-center">
            <Search className="w-5 h-5 text-gray-500 ml-4" />
            <input
              type="text"
              placeholder="Rechercher un programme, un coach..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3"
            />
          </div>

          {/* Active Programs Count */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Programmes actifs</p>
              <p className="text-2xl font-bold text-white">{clientPrograms.filter(p => p.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <TutorialCard
          tutorialId="workouts_intro"
          title="Vos Programmes 🏋️‍♂️"
          message="Retrouvez ici tous vos programmes d'entraînement assignés. Cliquez sur une séance pour voir les détails et commencer."
          className="mb-2"
        />

        {/* Programs List */}

        {/* Programs List */}
        <div className="space-y-6 animate-fade-in delay-200">
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <div key={program.id} className="glass-card rounded-3xl border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all group">
                <div className="grid lg:grid-cols-12 gap-6">

                  {/* Visual / Cover */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-gray-800 to-gray-900 relative min-h-[200px] lg:min-h-full">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Dumbbell className="w-24 h-24 text-white" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(program.difficulty)}`}>
                        {getDifficultyLabel(program.difficulty)}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>{program.duration} semaines</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-cyan-400" />
                          <span>{program.totalSessions} séances</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info / Progress */}
                  <div className="lg:col-span-8 p-6 lg:pl-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                        <div>
                          <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                            {program.coachName}
                          </p>
                          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            {program.name}
                          </h3>
                        </div>
                        {program.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20 self-start md:self-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Actif
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                        {program.description}
                      </p>

                      {/* Preview Exercises */}
                      <div className="mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Exercices inclus</p>
                        <div className="flex flex-wrap gap-2">
                          {program.previewExercises.map((ex: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-xs text-gray-300 border border-white/5">
                              {ex}
                            </span>
                          ))}
                          {program.previewExercises.length === 0 && (
                            <span className="text-gray-500 text-xs italic">Aucun aperçu disponible</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & CTA */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progression globale</span>
                          <span className="text-white font-bold">{program.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${program.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <Link
                          to={`/client/workout/${program.id}`}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-center border border-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-5 h-5 text-gray-400" />
                          <span>Détails</span>
                        </Link>
                        <Link
                          to={`/client/appointments`}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-bold text-center shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-5 h-5" />
                          <span>Reprendre</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-white/20 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Dumbbell className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {searchTerm ? 'Aucun résultat' : 'Votre espace est vide'}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                {searchTerm
                  ? "Aucun programme ne correspond à votre recherche."
                  : "Vous n'avez pas encore rejoint de programme d'entraînement. Explorez le catalogue pour trouver votre prochain défi !"
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/marketplace"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
                >
                  Découvrir les programmes
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientWorkouts;