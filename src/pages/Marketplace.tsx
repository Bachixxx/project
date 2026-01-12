import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Dumbbell, Zap, ChevronLeft, ChevronDown, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { useClientAuth } from '../contexts/ClientAuthContext';

function Marketplace() {
  const { client } = useClientAuth();
  const [activeTab, setActiveTab] = useState<'coach' | 'client'>('coach');
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const registerDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

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

      <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Page Header */}
        <div className="mb-12 animate-slide-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-purple-500/20">
            <Star className="w-3 h-3 fill-current" />
            Marketplace Coachency
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            La plateforme pour <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">vendre et acheter</span> des programmes
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Connectez-vous avec les meilleurs coachs ou diffusez votre expertise à une audience grandissante.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-16 animate-fade-in delay-200">
          <div className="bg-white/5 border border-white/10 p-1.5 rounded-full flex gap-2 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('coach')}
              className={`px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'coach'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Dumbbell className="w-4 h-4" /> Pour les Coachs
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'client'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Users className="w-4 h-4" /> Pour les Clients
            </button>
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'coach' ? (
          <div className="grid md:grid-cols-2 gap-12 text-left animate-fade-in max-w-5xl mx-auto items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-white">Monétisez votre savoir</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Créez des programmes d'entraînement complets une seule fois et vendez-les à l'infini. Coachency s'occupe de la livraison, du paiement et du suivi.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-blue-500" /> Revenus 100% automatisés</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-blue-500" /> Page de vente dédiée pour chaque programme</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-blue-500" /> Paiements sécurisés via Stripe</li>
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/25">
                Créer mon compte Coach <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="relative glass-card p-8 rounded-3xl border border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <Dumbbell className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-white font-medium">Programme Masse</div>
                        <div className="text-sm text-gray-400">45 ventes ce mois</div>
                      </div>
                    </div>
                    <div className="text-green-400 font-bold">+ 2,250 CHF</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-white font-medium">Perte de Gras 30j</div>
                        <div className="text-sm text-gray-400">128 ventes au total</div>
                      </div>
                    </div>
                    <div className="text-green-400 font-bold">+ 6,400 CHF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12 text-left animate-fade-in max-w-5xl mx-auto items-center">
            <div className="space-y-8 order-2 md:order-1">
              <h2 className="text-3xl font-bold text-white">Atteignez vos objectifs</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Accédez à des programmes conçus par des professionnels vérifiés. Suivez votre plan directement sur l'application mobile et progressez à votre rythme.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-purple-500" /> Programmes pour tous les niveaux</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-purple-500" /> Démonstrations vidéo des exercices</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-purple-500" /> Suivi de vos performances</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/client/register" className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/25">
                  Créer un compte Client <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="relative order-1 md:order-2 hidden md:block">
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
              <div className="relative glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-center h-[350px]">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p>Contenu Premium</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#0f172a] p-4 rounded-xl border border-white/10 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-white font-bold">Programme validé</div>
                  <div className="text-sm text-gray-400">Prêt à commencer</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paused Listings Note */}
        <div className="mt-32 pt-16 border-t border-white/10">
          <p className="text-gray-500 italic">
            * Le catalogue de programmes est actuellement en cours de mise à jour. <br />
            De nouveaux programmes seront bientôt disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Marketplace;