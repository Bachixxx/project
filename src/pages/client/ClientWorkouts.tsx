import { useState } from 'react';
import {
  Dumbbell,
  Play,
  Search,
  Trophy,
  LayoutGrid,
  CheckCircle,
} from 'lucide-react';
import { useClientPrograms } from '../../hooks/useClientPrograms';
// Removed PageHero and NavRail for custom Native App layout
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
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative overflow-hidden">
      {/* Dynamic Ambient Background (from Dashboard) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-teal-600/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-900/20 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Massive Background Image (Native Hero Vibe) */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity grayscale-[30%] pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20 pointer-events-none"></div>
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none"></div>

        {/* Floating Title Container */}
        <div className="absolute top-24 left-0 right-0 px-6 z-10 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase text-shadow-lg mb-2">MES PROGRAMMES</h1>
          <p className="text-slate-300 text-sm font-medium">Continuez sur votre lancée.</p>
        </div>
      </div>

      {/* The Native "Sheet" Content Container */}
      <div className="relative z-20 mt-[30vh] bg-slate-950 rounded-t-[3rem] px-4 pt-8 pb-32 min-h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* iOS-style Segmented Control Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5">
            {[
              { id: 'all', label: 'Tous', icon: LayoutGrid },
              { id: 'active', label: 'En cours', icon: Play },
              { id: 'completed', label: 'Terminés', icon: CheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-md border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-400' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un programme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xl transition-all"
            />
          </div>

          {/* Stats Overview */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden shadow-lg border-t-white/10">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <Trophy className="w-12 h-12 text-emerald-400" />
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Terminés</span>
                <span className="text-3xl font-black text-white">{completedPrograms}</span>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden shadow-lg border-t-white/10">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <Dumbbell className="w-12 h-12 text-teal-400" />
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Séances</span>
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
                  className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-4 active:scale-[0.98] transition-all duration-300 shadow-lg relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:border-emerald-500/30 flex gap-4"
                >
                  {/* Subtle Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  {/* Left Side: Thumbnail/Icon (Widget Style) */}
                  <div className="w-20 h-20 shrink-0 bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/5"></div>
                    <Dumbbell className="w-8 h-8 text-emerald-400 opacity-80" />

                    {/* Mini Status Badge Bottom Right of Thumbnail */}
                    {clientProgram.status === 'active' && (
                      <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    )}
                  </div>

                  {/* Right Side: Content & Progress */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-emerald-400 transition-colors pr-2">
                        {clientProgram.program.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 mb-2 pr-4">{clientProgram.program.description}</p>

                    <div className="flex items-center justify-between mt-auto">
                      {/* Tags */}
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          {clientProgram.program.duration_weeks} sem
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 truncate max-w-[80px]">
                          {clientProgram.program.coach.full_name}
                        </span>
                      </div>

                      {/* Circular / Micro Progress Right Side */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">{clientProgram.progress}%</span>
                        <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${clientProgram.status === 'completed' ? 'from-cyan-500 to-emerald-400' : 'from-emerald-600 to-teal-400'}`}
                            style={{ width: `${clientProgram.progress}%` }}
                          />
                        </div>
                      </div>
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
    </div>
  );
}