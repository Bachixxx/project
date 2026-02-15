import React, { useState } from 'react';
import {
  Dumbbell,
  Play,
  RotateCcw,
  Search,
  Target,
  Trophy,
  Clock
} from 'lucide-react';
import { useClientPrograms } from '../../hooks/useClientPrograms';

export default function ClientWorkouts() {
  const { programs, isLoading: loading, error } = useClientPrograms();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrograms = programs.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.program.coach.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeProgram = programs.find(p => p.status === 'active');
  const completedPrograms = programs.filter(p => p.status === 'completed').length;
  // Estimate total sessions
  const totalWorkouts = programs.reduce((acc, p) => acc + Math.round((p.progress / 100) * (p.program.duration_weeks * 4 || 0)), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Erreur de chargement des programmes.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mes Programmes</h1>
          <p className="text-gray-400">
            Suivez vos progrès et accédez à vos entraînements
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Programme Actif</p>
            <p className="text-lg font-bold text-white">{activeProgram?.program.name || 'Aucun'}</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Complétés</p>
            <p className="text-lg font-bold text-white">{completedPrograms}</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Séances</p>
            <p className="text-lg font-bold text-white">{totalWorkouts}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un programme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === 'active'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
          >
            Actifs
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === 'completed'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
          >
            Terminés
          </button>
        </div>
      </div>

      {/* Programs List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((clientProgram) => (
            <div
              key={clientProgram.id}
              className="glass-card p-0 overflow-hidden group hover:border-primary-500/30 transition-colors"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                          {clientProgram.program.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${clientProgram.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : clientProgram.status === 'completed'
                            ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                          {clientProgram.status === 'active' ? 'En cours' :
                            clientProgram.status === 'completed' ? 'Terminé' : 'En pause'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {clientProgram.program.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary-400" />
                        <span>{clientProgram.program.duration_weeks} semaines</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-primary-400" />
                        <span>{clientProgram.program.difficulty_level}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white">
                          {clientProgram.program.coach.full_name[0]}
                        </div>
                        <span>Coach {clientProgram.program.coach.full_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Progression</span>
                        <span className="text-white font-medium">{clientProgram.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                          style={{ width: `${clientProgram.progress}%` }}
                        />
                      </div>
                    </div>

                    <button className="primary-button w-full flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform">
                      {clientProgram.status === 'active' ? (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Reprendre</span>
                        </>
                      ) : clientProgram.status === 'completed' ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Recommencer</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Commencer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun programme trouvé</h3>
            <p className="text-gray-400">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}