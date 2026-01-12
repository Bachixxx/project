import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Dumbbell, Zap, ChevronLeft, ChevronDown, Star, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';
import { useClientAuth } from '../contexts/ClientAuthContext';

function Marketplace() {
  const { client } = useClientAuth();
  const [activeTab, setActiveTab] = useState<'coach' | 'client'>('coach');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const registerDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30 font-sans">

      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 pb-4' : 'bg-transparent pb-6'}`}>

        {/* Announcement Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs md:text-sm font-medium py-2 px-4 text-center">
          <p>
            🚀 Lancement imminent ! <Link to="/waitlist" className="underline hover:text-blue-100">Rejoignez la liste d'attente</Link> dès maintenant pour un accès prioritaire.
          </p>
        </div>

        <div className="container mx-auto px-6 pt-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <Dumbbell className="w-5 h-5" />
            </div>
            Coachency
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/marketplace" className="text-sm font-medium text-white transition-colors">Marketplace</Link>
            <Link to="/features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Fonctionnalités</Link>
            <Link to="/pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Tarifs</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
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
                <Link to="/client/login" className="text-sm font-medium text-white hover:text-blue-400 transition-colors">Espace Client</Link>
                <Link
                  to="/login"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2 rounded-lg font-medium transition-all"
                >
                  Connexion Coach
                </Link>
                <Link
                  to="/waitlist"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                >
                  Rejoindre la liste d'attente
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0f172a] border-b border-white/10 p-6 flex flex-col gap-4 animate-fade-in shadow-2xl">
            <Link to="/marketplace" className="text-white font-medium py-2">Marketplace</Link>
            <Link to="/features" className="text-gray-300 py-2">Fonctionnalités</Link>
            <Link to="/client/login" className="text-gray-300 py-2">Espace Client</Link>
            <div className="h-px bg-white/10 my-2"></div>
            {client ? (
              <Link to="/client/dashboard" className="bg-blue-600 text-center py-3 rounded-lg text-white font-medium">Mon Tableau de Bord</Link>
            ) : (
              <>
                <Link to="/login" className="bg-white/10 text-center py-3 rounded-lg text-white font-medium">Connexion Coach</Link>
                <Link to="/waitlist" className="bg-blue-600 text-center py-3 rounded-lg text-white font-medium">Rejoindre la liste d'attente</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="relative z-10 pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
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