import { useState, useEffect } from 'react';
import { Clock, Dumbbell, Target, ChevronRight, PlayCircle, Search } from 'lucide-react';
import { TutorialCard } from '../../components/client/TutorialCard';
import { Link } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';

import { WorkoutFilterChips } from '../../components/client/workout/WorkoutFilterChips';
import { PageHero } from '../../components/client/shared/PageHero';

function ClientWorkouts() {
  const { client: authClient } = useClientAuth();
  // const navigate = useNavigate(); // Unused now
  const client = authClient as any;
  const [loading, setLoading] = useState(true);
  const [clientPrograms, setClientPrograms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');

  const filters = ['Tous', 'Actifs', 'Terminés', 'Débutant', 'Avancé'];

  useEffect(() => {
    if (client) {
      fetchTrainingData();
    }
  }, [client]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Client Programs (Existing Logic)
      const { data: clientProgramsData } = await supabase
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

      // Format Programs
      const formattedPrograms = (clientProgramsData || []).map(cp => {
        const program = cp.program as any;
        if (!program) return null;
        const allExercises = program.program_sessions?.flatMap((s: any) =>
          s.session?.session_exercises?.map((se: any) => se.exercise?.name) || []
        ) || [];
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
      setClientPrograms(formattedPrograms);

      setClientPrograms(formattedPrograms);
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = clientPrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.coachName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'Actifs') return program.status === 'active';
    if (activeFilter === 'Terminés') return program.status === 'completed';
    if (activeFilter === 'Débutant') return program.difficulty === 'beginner';
    if (activeFilter === 'Avancé') return program.difficulty === 'advanced';

    return true;
  });

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

  if (loading && clientPrograms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24">
      {/* Page Hero */}
      <PageHero
        title="Entraînement"
        subtitle="Votre hub central pour toutes vos activités sportives."
        backgroundImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
        className="pb-0"
        headerContent={
          <Link to="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all text-sm font-bold uppercase tracking-wide group">
            <span>Catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        }
      >
        <WorkoutFilterChips
          filters={filters}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          className="!pb-0"
        />
      </PageHero>

      {/* Background Gradients (Fixed) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 px-4 md:px-8">


        <div className="space-y-6 animate-fade-in delay-300">
          <TutorialCard
            tutorialId="workouts_intro"
            title="Hub Entraînement 🏋️‍♂️"
            message="Retrouvez ici vos prochaines séances, votre historique et tous vos programmes."
            className="mb-4"
          />

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-400" />
              Mes Programmes
            </h2>

            {/* Search Bar Inline */}
            <div className="glass-card px-3 py-1.5 rounded-lg border border-white/10 flex items-center w-full max-w-xs">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Filtrer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-sm w-full p-0"
              />
            </div>
          </div>


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
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-bold text-center shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-5 h-5" />
                          <span>Voir le programme</span>
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