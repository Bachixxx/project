import React, { useState } from 'react';
import {
  Dumbbell,
  Play,
  RotateCcw,
  Search,
  Target,
  Trophy,
  Clock,
  LayoutGrid,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useClientPrograms } from '../../hooks/useClientPrograms';
import { PageHero } from '../../components/client/shared/PageHero';
import { NavRail } from '../../components/client/shared/NavRail';
import { useNavigate } from 'react-router-dom';

export default function ClientWorkouts() {
  const navigate = useNavigate();
  const { programs, isLoading: loading, error } = useClientPrograms();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrograms = programs.filter(p => {
    const matchesFilter = activeTab === 'all' || p.status === activeTab;
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="loading loading-lg text-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white p-6 text-center">
        <div>
          <p className="text-xl font-bold mb-2">Erreur de chargement</p>
          <p className="text-gray-400">Impossible de charger vos programmes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-32">
      <PageHero
        title="Mes Programmes"
        subtitle="Accédez à vos plans d'entraînement personnalisés."
        backgroundImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
      >
        <NavRail
          tabs={[
            { id: 'all', label: 'Tous', icon: LayoutGrid },
            { id: 'active', label: 'En cours', icon: Play },
            { id: 'completed', label: 'Terminés', icon: CheckCircle }
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
          variant="embedded"
        />
      </PageHero>

      <div className="px-4 -mt-6 relative z-10 space-y-6 max-w-7xl mx-auto">

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un programme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e293b] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl"
          />
        </div>

        {/* Stats Overview */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <span className="text-gray-400 text-xs font-bold uppercase">Terminés</span>
              <span className="text-3xl font-black text-white">{completedPrograms}</span>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Dumbbell className="w-12 h-12 text-white" />
              </div>
              <span className="text-gray-400 text-xs font-bold uppercase">Total Séances</span>
              <span className="text-3xl font-black text-white">{totalWorkouts}</span>
            </div>
          </div>
        )}

        {/* Programs List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">
            {activeTab === 'all' ? 'Tous les programmes' : activeTab === 'active' ? 'Programme en cours' : 'Historique'}
          </h3>

          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((clientProgram) => (
              <div
                key={clientProgram.id}
                onClick={() => navigate(`/client/workout/${clientProgram.id}`)}
                className="bg-[#1e293b] border border-white/5 rounded-3xl p-5 active:scale-[0.98] transition-all duration-200 shadow-lg relative overflow-hidden group cursor-pointer"
              >
                {/* Status Badge */}
                <div className="absolute top-5 right-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${clientProgram.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      clientProgram.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                    {clientProgram.status === 'active' ? 'Actif' : clientProgram.status === 'completed' ? 'Terminé' : 'En pause'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{clientProgram.program.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 pr-16">{clientProgram.program.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      {clientProgram.program.duration_weeks} sem
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                      <Target className="w-3.5 h-3.5" />
                      {clientProgram.program.difficulty_level}
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                      <div className="w-3.5 h-3.5 rounded-full bg-gray-600 flex items-center justify-center text-[8px] text-white">
                        {clientProgram.program.coach.full_name[0]}
                      </div>
                      {clientProgram.program.coach.full_name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-medium">Progression</span>
                      <span className="text-white font-bold">{clientProgram.progress}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${clientProgram.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${clientProgram.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end text-blue-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                    Voir les détails <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">Aucun programme trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}