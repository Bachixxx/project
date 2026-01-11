import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Users, Calendar, LineChart, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ShoppingBag, User, ArrowRight, CheckCircle, Smartphone, Globe, Shield, Star, Menu, X } from 'lucide-react';
import { t } from '../i18n';

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        {/* Lighter gradient for mobile */}
        <div className="md:hidden absolute top-[-10%] left-[-10%] w-[80%] h-[50%] bg-blue-600/10 rounded-full blur-[80px]"></div>
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[100px]"></div>
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
            <Link to="/marketplace" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Marketplace</Link>
            <Link to="/features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Fonctionnalités</Link>
            <Link to="/pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Tarifs</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
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
            <Link to="/marketplace" className="text-gray-300 py-2">Marketplace</Link>
            <Link to="/features" className="text-gray-300 py-2">Fonctionnalités</Link>
            <Link to="/client/login" className="text-gray-300 py-2">Espace Client</Link>
            <div className="h-px bg-white/10 my-2"></div>
            <Link to="/login" className="bg-white/10 text-center py-3 rounded-lg text-white font-medium">Connexion Coach</Link>
            <Link to="/waitlist" className="bg-blue-600 text-center py-3 rounded-lg text-white font-medium">Rejoindre la liste d'attente</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 container mx-auto px-6 z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6 animate-fade-in">
              <Star className="w-4 h-4 fill-blue-400" />
              Nouvelle version 2.0 disponible
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-in">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">L'app tout-en-un pour les</span>{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Coachs Sportifs</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-slide-in delay-100">
              Gérez vos clients, créez des programmes sur-mesure, suivez les progrès et encaissez vos paiements. Tout ça au même endroit.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-slide-in delay-200">
              <Link
                to="/waitlist"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Rejoindre la liste d'attente <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/client/check-email"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" /> Espace Client
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 14 jours gratuits</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Sans engagement</span>
            </div>
          </div>

          <div className="lg:w-1/2 relative animate-float">
            <div className="relative z-10 bg-[#1e293b] border border-white/10 rounded-2xl p-2 shadow-2xl shadow-blue-500/20 transform rotate-1 lg:rotate-1 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3"
                srcSet="
                  https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600&ixlib=rb-4.0.3 600w,
                  https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200&ixlib=rb-4.0.3 1200w,
                  https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3 2670w
                "
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                alt="Dashboard Preview"
                width="800"
                height="600"
                className="rounded-xl w-full h-auto opacity-90 hover:opacity-100 transition-opacity"
                // @ts-ignore
                fetchPriority="high"
              />

              {/* Floating Cards */}
              <div className="absolute -left-12 bottom-20 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl hidden lg:block animate-pulse-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <DollarSign />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Revenu ce mois</div>
                    <div className="text-lg font-bold text-white">+ 4,250 CHF</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 top-12 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl hidden lg:block animate-pulse-slow delay-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Users />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Nouveaux clients</div>
                    <div className="text-lg font-bold text-white">+ 12</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Une suite d'outils puissants conçus spécifiquement pour faire décoller votre activité de coaching.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Gestion Clients"
              description="Centralisez les profils, objectifs et progrès de tous vos athlètes."
              color="blue"
            />
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6" />}
              title="Programmes"
              description="Créez des plans d'entraînement détaillés avec notre bibliothèque d'exercices."
              color="purple"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Planification"
              description="Agenda intuitif pour vos sessions privées et cours collectifs."
              color="green"
            />
            <FeatureCard
              icon={<LineChart className="w-6 h-6" />}
              title="Suivi & Stats"
              description="Analysez les performances et ajustez les plans en temps réel."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/5 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 blur-3xl"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-400 font-medium">Coachs Actifs</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">12k+</div>
              <div className="text-purple-400 font-medium">Clients Entraînés</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">50k+</div>
              <div className="text-cyan-400 font-medium">Programmes Créés</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 container mx-auto px-6 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Prêt à transformer votre coaching ?</h2>
            <p className="text-xl text-blue-100 mb-10">
              Rejoignez la communauté Coachency et commencez à digitaliser votre activité dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/waitlist"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl"
              >
                M'inscrire sur la liste
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 bg-blue-700/50 text-white border border-white/20 rounded-xl font-medium hover:bg-blue-700/70 transition-all"
              >
                Voir les Tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0b1120] pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm">
                  <Dumbbell className="w-5 h-5" />
                </div>
                Coachency
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                La plateforme n°1 pour les coachs sportifs qui veulent passer au niveau supérieur.
              </p>
              <div className="flex gap-4">
                <SocialIcon icon={<Instagram className="w-5 h-5" />} />
                <SocialIcon icon={<Facebook className="w-5 h-5" />} />
                <SocialIcon icon={<Twitter className="w-5 h-5" />} />
                <SocialIcon icon={<Linkedin className="w-5 h-5" />} />
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Produit</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/features" className="hover:text-blue-400 transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Tarifs</Link></li>
                <li><Link to="/marketplace" className="hover:text-blue-400 transition-colors">Marketplace</Link></li>
                <li><Link to="/integrations" className="hover:text-blue-400 transition-colors">Intégrations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Ressources</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Guide du Coach</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Communauté</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contact</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-blue-400" /> contact@coachency.com</li>
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-blue-400" /> +41 22 555 01 23</li>
                <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-blue-400" /> Genève, Suisse</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Coachency. Tous droits réservés.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Conditions</Link>
              <Link to="/legal" className="hover:text-white transition-colors">Mentions Légales</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, description, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
    green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
    orange: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20',
  };

  return (
    <div className="glass-card p-8 rounded-2xl hover:translate-y-[-5px] transition-all duration-300 group border border-white/5 shadow-xl">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${colorClasses[color as keyof typeof colorClasses]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function SocialIcon({ icon }: any) {
  return (
    <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all">
      {icon}
    </a>
  );
}

// Simple DollarSign icon as it was missing in imports or provided differently
function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
  );
}

export default Home;