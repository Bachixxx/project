import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Users, Dumbbell, Heart, Target, Zap, ChevronLeft, ChevronDown, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useClientAuth } from '../contexts/ClientAuthContext';

interface Program {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  difficulty_level: string;
  price: number;
  coach: {
    full_name: string;
    specialization: string;
    profile_image_url?: string;
  };
  program_exercises: Array<{
    exercise: {
      category: string;
    };
  }>;
}

const specializations = [
  { value: 'cardio', label: 'Cardio', icon: Heart },
  { value: 'strength', label: 'Musculation', icon: Dumbbell },
  { value: 'flexibility', label: 'Flexibilité', icon: Target },
  { value: 'hiit', label: 'HIIT', icon: Zap },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Débutant', color: 'bg-green-500', bg: 'bg-green-500/20', text: 'text-green-400' },
  { value: 'intermediate', label: 'Intermédiaire', color: 'bg-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  { value: 'advanced', label: 'Avancé', color: 'bg-red-500', bg: 'bg-red-500/20', text: 'text-red-400' },
];



function Marketplace() {
  const { client } = useClientAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [coaches, setCoaches] = useState<Array<{ id: string; full_name: string; specialization: string }>>([]);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  const registerDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPrograms();
    fetchCoaches();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (registerDropdownRef.current && !registerDropdownRef.current.contains(event.target as Node)) {
        setShowRegisterDropdown(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setShowLoginDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    filterAndSortPrograms();
  }, [programs, searchQuery, selectedCoach, selectedSpecialization, selectedDifficulty, sortBy]);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          description,
          duration_weeks,
          difficulty_level,
          price,
          coach:coaches (
            full_name,
            specialization,
            profile_image_url
          ),
          program_exercises (
            exercise:exercises (
              category
            )
          )
        `)
        .eq('is_public', true);

      if (error) throw error;

      // Transform data to match Program interface (coach array -> single object)
      const formattedPrograms = (data || []).map((program: any) => ({
        ...program,
        coach: Array.isArray(program.coach) ? program.coach[0] : program.coach
      }));

      setPrograms(formattedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('id, full_name, specialization')
        .order('full_name');

      if (error) throw error;
      setCoaches(data || []);
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };

  const filterAndSortPrograms = () => {
    let filtered = programs.filter(program => {
      const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCoach = !selectedCoach || program.coach.full_name === selectedCoach;

      const matchesSpecialization = !selectedSpecialization ||
        program.coach.specialization?.toLowerCase().includes(selectedSpecialization.toLowerCase()) ||
        program.program_exercises.some(pe =>
          pe.exercise.category.toLowerCase().includes(selectedSpecialization.toLowerCase())
        );

      const matchesDifficulty = !selectedDifficulty || program.difficulty_level === selectedDifficulty;

      return matchesSearch && matchesCoach && matchesSpecialization && matchesDifficulty;
    });

    // Sort programs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'duration':
          return (a.duration_weeks || 0) - (b.duration_weeks || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredPrograms(filtered);
  };

  const getDifficultyStyles = (level: string) => {
    const difficulty = difficultyLevels.find(d => d.value === level);
    return difficulty || { label: level, color: 'bg-gray-500', bg: 'bg-gray-500/20', text: 'text-gray-400' };
  };



  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30 font-sans">

      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Link
                to={client ? "/client/dashboard" : "/"}
                className="flex items-center text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors border border-white/5">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Retour à l'accueil</span>
              </Link>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center space-x-4">
              {client ? (
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs text-gray-400">Connecté en tant que</span>
                    <span className="block text-sm font-semibold text-white">{client.full_name}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {client.full_name.charAt(0)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative" ref={loginDropdownRef}>
                    <button
                      onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all inline-flex items-center"
                    >
                      Connexion
                      <ChevronDown className={`ml-1.5 w-4 h-4 transition-transform ${showLoginDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showLoginDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in overflow-hidden">
                        <Link
                          to="/client/login"
                          className="block px-4 py-3 hover:bg-white/5 transition-colors group"
                          onClick={() => setShowLoginDropdown(false)}
                        >
                          <div className="font-medium text-white group-hover:text-blue-400 transition-colors">Connexion client</div>
                          <div className="text-xs text-gray-500 mt-0.5">Accédez à vos programmes</div>
                        </Link>
                        <div className="h-px bg-white/5 mx-4 my-1"></div>
                        <Link
                          to="/login"
                          className="block px-4 py-3 hover:bg-white/5 transition-colors group"
                          onClick={() => setShowLoginDropdown(false)}
                        >
                          <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">Connexion coach</div>
                          <div className="text-xs text-gray-500 mt-0.5">Gérez vos clients et programmes</div>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={registerDropdownRef}>
                    <button
                      onClick={() => setShowRegisterDropdown(!showRegisterDropdown)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 px-5 py-2.5 rounded-lg text-sm font-bold inline-flex items-center shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105"
                    >
                      Commencer
                      <ChevronDown className={`ml-1.5 w-4 h-4 transition-transform ${showRegisterDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showRegisterDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in overflow-hidden">
                        <Link
                          to="/client/check-email"
                          className="block px-4 py-3 hover:bg-white/5 transition-colors group"
                          onClick={() => setShowRegisterDropdown(false)}
                        >
                          <div className="font-medium text-white group-hover:text-blue-400 transition-colors">Je suis un client</div>
                          <div className="text-xs text-gray-500 mt-0.5">Je cherche un coach ou programme</div>
                        </Link>
                        <div className="h-px bg-white/5 mx-4 my-1"></div>
                        <Link
                          to="/register"
                          className="block px-4 py-3 hover:bg-white/5 transition-colors group"
                          onClick={() => setShowRegisterDropdown(false)}
                        >
                          <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">Je suis un coach</div>
                          <div className="text-xs text-gray-500 mt-0.5">Je veux vendre mes services</div>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-16 animate-slide-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-500/20">
            <Star className="w-3 h-3 fill-current" />
            Programmes Premium
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trouvez le programme parfait <br />
            pour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">vos objectifs</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Une sélection de programmes d'entraînement professionnels créés par des coachs certifiés.
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-6 mb-12 border border-white/10 animate-fade-in delay-100 bg-[#1e293b]/50 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Recherche</label>
              <div className="relative group">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Nom du programme, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Coach Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Coach</label>
              <div className="relative">
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium cursor-pointer"
                >
                  <option value="">Tous les coachs</option>
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.full_name}>
                      {coach.full_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Specialization Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Spécialité</label>
              <div className="relative">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium cursor-pointer"
                >
                  <option value="">Toutes spécialités</option>
                  {specializations.map(spec => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Niveau</label>
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium cursor-pointer"
                >
                  <option value="">Tous niveaux</option>
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Trier par</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium cursor-pointer"
                >
                  <option value="name">Nom A-Z</option>
                  <option value="price_low">Prix croissant</option>
                  <option value="price_high">Prix décroissant</option>
                  <option value="duration">Durée</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-gray-400">
            <span className="text-white font-bold">{filteredPrograms.length}</span> programme{filteredPrograms.length !== 1 ? 's' : ''} trouvé{filteredPrograms.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 animate-pulse">Chargement des programmes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program) => {
              const diffStyles = getDifficultyStyles(program.difficulty_level);
              return (
                <div
                  key={program.id}
                  className="glass-card rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 group flex flex-col h-full bg-[#1e293b]/50"
                >
                  {/* Program Cover (Gradient for now) */}
                  <div className="h-48 bg-gradient-to-br from-blue-600 to-cyan-700 relative overflow-hidden group-hover:brightness-110 transition-all">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-700">
                      <Dumbbell className="w-24 h-24 text-white" />
                    </div>

                    <div className="absolute top-4 left-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${diffStyles.bg} ${diffStyles.text} border-current bg-opacity-90 backdrop-blur-sm`}>
                        {diffStyles.label}
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      {program.duration_weeks} semaines
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Coach Info */}
                    <div className="flex items-center mb-4 pb-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-3 ring-2 ring-white/10">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{program.coach.full_name}</p>
                        <p className="text-blue-400 text-xs font-medium uppercase tracking-wide">{program.coach.specialization}</p>
                      </div>
                    </div>

                    {/* Program Title & Desc */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">
                      {program.description}
                    </p>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Prix</span>
                        <div className="text-2xl font-bold text-white">
                          {program.price ? `${program.price} CHF` : 'Gratuit'}
                        </div>
                      </div>

                      <Link
                        to={`/marketplace/program/${program.id}`}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 transform active:scale-95 group/btn"
                      >
                        <span>Voir le détail</span>
                        <ChevronLeft className="w-5 h-5 rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPrograms.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-white/20">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Aucun programme trouvé
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Nous n'avons pas trouvé de programme correspondant à vos critères actuels. Essayez de modifier vos filtres.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCoach('');
                setSelectedSpecialization('');
                setSelectedDifficulty('');
              }}
              className="mt-6 text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;