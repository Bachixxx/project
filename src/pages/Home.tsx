import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Instagram, Linkedin, Twitter,
  ArrowRight, CheckCircle, Smartphone, Menu, X,
  ChevronDown, Layers, CreditCard, Activity, Zap,
  Shield, Clock, Users, Star, TrendingUp
} from 'lucide-react';
import SEO from '../components/SEO';

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Est-ce que Coachency est adapté aux coachs débutants ?",
      answer: "Absolument. Nous proposons un essai gratuit de 14 jours pour tester toutes les fonctionnalités sans engagement. Ensuite, l'abonnement vous donne accès à tout (sauf options Branding & Terminal)."
    },
    {
      question: "Puis-je importer mes clients actuels ?",
      answer: "Vous pouvez inviter vos clients à rejoindre la plateforme en leur envoyant un lien d'invitation. Ils pourront alors créer leur compte et accéder à vos programmes."
    },
    {
      question: "Côté client, doivent-ils payer quelque chose ?",
      answer: "Non ! L'application est 100% gratuite pour vos clients. Ils n'ont qu'à télécharger l'app ou se connecter sur le web pour accéder à vos programmes."
    },
    {
      question: "Comment fonctionnent les paiements ?",
      answer: "Nous intégrons Stripe pour des paiements sécurisés. Vous pouvez envoyer des liens de paiement ou configurer des abonnements récurrents. L'argent arrive directement sur votre compte bancaire."
    }
  ];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Coachency",
    "applicationCategory": "HealthAndFitnessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "29.90",
      "priceCurrency": "CHF"
    },
    "image": "https://coachency.app/app-logo.jpg",
    "description": "Le système opérationnel des coachs sportifs.",
    "url": "https://coachency.app/"
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
      <SEO
        title="Coachency | L'App Tout-en-Un pour les Coachs Sportifs 🚀"
        description="Gérez vos clients, créez des programmes et encaissez vos paiements. La plateforme tout-en-un qui fait décoller votre business de coaching. Rejoignez la liste d'attente !"
        url="https://coachency.app/"
        schema={schemaData}
      />

      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[150px] mix-blend-screen opacity-50"></div>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
      </div>

      {/* Floating Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 flex justify-center pointer-events-none transition-all duration-500">
        <nav className={`w-full max-w-6xl mx-auto rounded-full pointer-events-auto transition-all duration-500 ${scrolled ? 'bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 py-3 px-6' : 'bg-transparent py-4 px-2'}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-white flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-shadow">
                <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="tracking-tight">Coachency</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Fonctionnalités</Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Tarifs</Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/client/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Espace Client</Link>
              <Link
                to="/login"
                className="text-sm font-medium text-white px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/waitlist"
                className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 group hover:-translate-y-0.5 transition-transform"
              >
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-4 py-1 text-sm font-medium text-white backdrop-blur-3xl group-hover:bg-slate-900 transition-colors">
                  Réserver ma place
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-3xl pt-24 px-6 flex flex-col gap-6 animate-fade-in border-b border-white/10">
          <Link to="/features" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Fonctionnalités</Link>
          <Link to="/pricing" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Tarifs</Link>
          <Link to="/client/login" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Espace Client</Link>
          <div className="flex flex-col gap-4 mt-8">
            <Link to="/login" className="bg-white/5 border border-white/10 text-center py-4 rounded-2xl text-white font-medium">Connexion Coach</Link>
            <Link to="/waitlist" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-center py-4 rounded-2xl text-white font-medium shadow-[0_0_30px_rgba(59,130,246,0.2)]">Réserver ma place gratuitement</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 container mx-auto px-6 z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="text-center max-w-4xl mx-auto mb-16 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Lancement Printemps 2026 — Places Fondateurs Limitées
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] animate-slide-in">
            Inspirez. <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Suivez.</span> <br className="sm:hidden" />
            Évoluez.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-in delay-100 font-light">
            L'écosystème haut de gamme conçu pour les coachs sportifs ambitieux.
            Centralisez vos programmes, automatisez vos paiements et offrez une expérience premium unique à vos clients.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in delay-200">
            <Link
              to="/waitlist"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              Réserver ma place gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-white/10 rounded-full font-medium text-white transition-all flex items-center justify-center gap-2"
            >
              Découvrir les fonctionnalités
            </Link>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-slide-in delay-300">
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Shield className="w-3.5 h-3.5" /> Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="w-3.5 h-3.5" /> 14 jours d'essai gratuit
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Star className="w-3.5 h-3.5" /> Dès CHF 19.90/mois
            </span>
          </div>
        </div>

        {/* Hero Mockup (Glassmorphism UI) */}
        <div className="relative w-full max-w-6xl mx-auto mt-10 animate-slide-in delay-500 z-20 perspective-[2000px]">
          <div className="relative rounded-2xl bg-slate-900 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_-10px_rgba(56,189,248,0.2)] transform rotate-x-12 scale-95 hover:rotate-x-0 hover:scale-100 transition-all duration-1000 ease-out overflow-hidden group">
            {/* Glossy top reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent z-10 pointer-events-none"></div>

            {/* Mac-like header */}
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-slate-950/50 backdrop-blur-md relative z-20">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="mx-auto text-xs text-slate-500 font-mono">dashboard.coachency.ch</div>
            </div>

            <img
              src="/dashboard-preview.png"
              alt="Dashboard Coachency Interface"
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              // @ts-ignore
              fetchPriority="high"
            />

            {/* Floating Glass Stats */}
            <div className="absolute -left-6 md:-left-12 bottom-12 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl hidden md:flex items-center gap-4 animate-float hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <div className="pr-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">Activité Récente</div>
                <div className="text-sm font-semibold text-white">Marc a terminé <i>Full Body A</i></div>
              </div>
            </div>

            <div className="absolute -right-6 md:-right-12 top-24 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl hidden md:flex items-center gap-4 animate-float delay-1000 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="pr-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">Nouveau Paiement</div>
                <div className="text-sm font-semibold text-white">+ 249 CHF (Abonnement Premium)</div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Social Proof & Trust Section */}
      <section className="py-20 relative bg-slate-950 border-b border-white/5 z-10">
        <div className="container mx-auto px-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">200+</div>
              <div className="text-sm text-slate-400 font-light">Coachs sur la liste d'attente</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">4.9/5</div>
              <div className="text-sm text-slate-400 font-light">Note des beta-testeurs</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-1">5h</div>
              <div className="text-sm text-slate-400 font-light">Gagnées par semaine en admin</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-slate-400 font-light">Gratuit pour vos clients</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 font-light">
                "J'ai testé la bêta pendant 3 semaines. Mes clients adorent l'app — ils me disent que c'est plus pro que ce qu'ils ont vu chez d'autres coachs. Le suivi des paiements Stripe m'a déjà fait gagner un temps fou."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">ML</div>
                <div>
                  <div className="text-white text-sm font-semibold">Marc L.</div>
                  <div className="text-slate-500 text-xs">Coach Sportif — Genève</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 font-light">
                "Enfin une plateforme pensée pour nous. Avant, je passais mes dimanches à envoyer des PDFs et relancer les paiements. Maintenant tout est automatisé et mes clients sont plus engagés que jamais."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">SK</div>
                <div>
                  <div className="text-white text-sm font-semibold">Sophie K.</div>
                  <div className="text-slate-500 text-xs">Personal Trainer — Lausanne</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 font-light">
                "Le mode entraînement en live avec le chrono intégré, c'est un game changer. Mes clients voient leurs anciens poids et se challengent tout seuls. Mon taux de rétention a explosé."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">DA</div>
                <div>
                  <div className="text-white text-sm font-semibold">David A.</div>
                  <div className="text-slate-500 text-xs">Coach CrossFit — Zurich</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-16">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-green-400" /> Conforme RGPD & nLPD
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 text-xs font-medium">
              <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M12 8v8m-4-4h8"/></svg> Hébergé en Suisse (AWS Zurich)
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 text-xs font-medium">
              <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Paiements sécurisés Stripe
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section - Dark Glass Cards */}
      <section className="py-32 relative border-b border-white/5 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Oubliez les outils fragmentés.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Centralisez votre expertise.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed font-light">
              Coachency est le système opérationnel complet pour votre entreprise de coaching sportif. Tout est interconnecté pour maximiser votre impact et minimiser la friction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Pillar 1 */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 hover:border-blue-500/30 p-8 rounded-3xl transition-all duration-300 hover:bg-slate-900 hover:-translate-y-2 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(168,85,247,0)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Expérience Premium</h3>
              <p className="text-slate-400 leading-relaxed font-light">
                Une app native gratuite pour vos clients : chrono intégré, vidéos d'exercices et logging intuitif. Fini les PDFs — augmentez votre rétention de 40%.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 hover:border-cyan-500/30 p-8 rounded-3xl transition-all duration-300 hover:bg-slate-900 hover:-translate-y-2 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(6,182,212,0)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Structuration Puissante</h3>
              <p className="text-slate-400 leading-relaxed font-light">
                Bibliothèque d'exercices, templates de programmes, et suivi biométrique centralisé. Créez un programme en 5 minutes au lieu de 45.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 hover:border-green-500/30 p-8 rounded-3xl transition-all duration-300 hover:bg-slate-900 hover:-translate-y-2 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-8 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(34,197,94,0)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Gestion Automatisée</h3>
              <p className="text-slate-400 leading-relaxed font-light">
                Abonnements Stripe, facturation automatique et gestion des accès. Gagnez 5h/semaine d'admin — zéro relance de paiement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution - High Contrast Layout */}
      <section className="py-32 relative bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Séparez-vous des amateurs.</h2>
            <p className="text-slate-400 text-lg font-light">Structurer son coaching sur WhatsApp et Google Drive n'est pas "flexible", c'est fragile. Passez à un niveau supérieur.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* The "Old Way" */}
            <div className="p-10 rounded-[2rem] bg-slate-900/50 border border-red-900/20 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-slate-500 font-mono text-sm">Le Passé</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400">
                  <X className="w-5 h-5" />
                </div>
                Le bricolage toxique
              </h3>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-red-500"></div></div>
                  <div>
                    <strong className="block text-slate-200 font-medium mb-1">Délivrance médiocre</strong>
                    <span className="text-slate-400 text-sm leading-relaxed">Programmes envoyés au format PDF qu'il faut chercher dans les e-mails, impossible de logger ses poids facilement.</span>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-red-500"></div></div>
                  <div>
                    <strong className="block text-slate-200 font-medium mb-1">Paiements laborieux</strong>
                    <span className="text-slate-400 text-sm leading-relaxed">Virements manuels ou Twint en retard. Relances gênantes pour se faire payer son propre travail.</span>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-red-500"></div></div>
                  <div>
                    <strong className="block text-slate-200 font-medium mb-1">Perte d'informations</strong>
                    <span className="text-slate-400 text-sm leading-relaxed">Historiques d'entraînement perdus dans des notes iPhone non structurées. Pas de réelles données pour ajuster le programme posément.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* The "New Way" */}
            <div className="p-10 rounded-[2rem] bg-slate-900 border border-blue-500/20 relative overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.05)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

              <div className="absolute top-6 right-6 text-blue-400 font-mono text-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Coachency Standard
              </div>
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <CheckCircle className="w-5 h-5" />
                </div>
                L'organisation de maître
              </h3>
              <ul className="space-y-6 relative z-10">
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-cyan-400"></div></div>
                  <div>
                    <strong className="block text-white font-medium mb-1">Application Client Immersive</strong>
                    <span className="text-slate-400 text-sm leading-relaxed">Vos clients ont une app élégante où ils démarrent leur séance, voient l'historique de leurs poids passés et suivent vos vidéos natives.</span>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-cyan-400"></div></div>
                  <div>
                    <strong className="block text-white font-medium mb-1">Revenus passifs & sécurisés</strong>
                    <span className="text-slate-400 text-sm leading-relaxed">Les abonnements sont prélevés automatiquement via Stripe. S'ils ne paient pas, leur accès au programme se coupe tout seul.</span>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-cyan-400"></div></div>
                  <div>
                    <strong className="block text-white font-medium mb-1">Data-driven coaching</strong>
                    <span className="text-slate-400 text-sm leading-relaxed">Tableau de bord de chaque client avec graphiques biométriques (poids, calories, photos) et statistiques de complétion de séances.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Feature Focus: The Client App Mobile Mockup */}
      <section className="py-32 relative bg-slate-950 overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="lg:w-1/2 flex justify-center relative z-10 perspective-[1000px]">
              {/* Decorative elements behind phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl"></div>

              <div className="relative group w-64 md:w-72 lg:w-80 transition-transform duration-700 hover:scale-105 hover:rotate-y-0 transform rotate-y-6">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-400/20 to-transparent rounded-[3rem] blur-[2px] -m-[1px] -z-10"></div>
                <div className="relative border-[6px] border-slate-800 bg-black rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(168,85,247,0.15)] overflow-hidden aspect-[9/19.5]">
                  <div className="absolute top-0 inset-x-0 h-6 flex justify-center py-2 z-20">
                    <div className="w-20 h-5 bg-black rounded-b-xl"></div>
                  </div>
                  <img
                    src="/client-app-training.png"
                    alt="Application mobile pour les clients"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Fake UI Overlay / Glare */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"></div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> App Client Native — 100% Gratuite pour vos clients
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight leading-tight">
                Leurs progrès entre leurs mains.<br />Et les vôtres.
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed font-light">
                Plus besoin d'expliquer comment lire votre tableur Excel. Démarquez-vous avec une interface native, conçue spécifiquement pour la salle de sport.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">1</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Mode "Flow" d'Entraînement</h4>
                    <p className="text-sm text-slate-400 font-light">L'écran reste allumé. Ils cliquent pour lancer le chrono de repos. Tout est millimétré.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">2</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Données historisées intelligentes</h4>
                    <p className="text-sm text-slate-400 font-light">Un champ pour le poids, un champ pour les reps. Leurs maxs précédents s'affichent instantanément en transparence.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">3</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Marque Blanche (À venir)</h4>
                    <p className="text-sm text-slate-400 font-light">Votre logo, vos couleurs, votre domaine. Vos clients n'utilisent plus Coachency, ils téléchargent l'App "Votre Nom".</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Pricing Preview */}
      <section className="py-32 bg-slate-950 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Simple, transparent, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">sans surprise.</span>
            </h2>
            <p className="text-slate-400 text-lg font-light">Un seul plan Pro. Tout inclus. Commencez gratuitement.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Gratuit</div>
              <div className="text-4xl font-bold text-white mb-1">CHF 0</div>
              <div className="text-sm text-slate-500 mb-6">pour toujours</div>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0" /> Jusqu'à 5 clients</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0" /> Jusqu'à 5 programmes</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0" /> Bibliothèque d'exercices</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0" /> Calendrier basique</li>
              </ul>
            </div>

            {/* Pro Monthly - Featured */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-blue-500/30 relative shadow-[0_0_40px_rgba(59,130,246,0.1)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-bold text-white">POPULAIRE</div>
              <div className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Pro Mensuel</div>
              <div className="text-4xl font-bold text-white mb-1">CHF 19.90</div>
              <div className="text-sm text-slate-500 mb-6">par mois</div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Clients illimités</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Programmes illimités</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Paiements Stripe</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Suivi client complet</li>
              </ul>
            </div>

            {/* Pro Annual */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5">
              <div className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">Pro Annuel</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-white">CHF 199</div>
                <div className="text-sm text-green-400 font-medium">-17%</div>
              </div>
              <div className="text-sm text-slate-500 mb-6">par an (2 mois offerts)</div>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> Tout le plan Pro</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> 2 mois gratuits</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> Accès prioritaire nouveautés</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> Support prioritaire</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/pricing" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors inline-flex items-center gap-1">
              Voir tous les détails <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section - Minimal Tech Approach */}
      <section className="py-32 bg-slate-950 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">On répond à vos doutes.</h2>
            <p className="text-slate-400 font-light text-lg">La transparence totale avant de vous engager aver nous.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="group">
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full text-left p-6 flex items-center justify-between rounded-2xl border transition-all duration-300 ${openFaqIndex === index ? 'bg-slate-900 border-white/10' : 'bg-transparent border-transparent hover:bg-slate-900/50 hover:border-white/5'}`}
                >
                  <span className={`font-semibold text-lg transition-colors ${openFaqIndex === index ? 'text-white' : 'text-slate-300'}`}>{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaqIndex === index ? 'bg-slate-800 rotate-180' : 'bg-transparent'}`}>
                    <ChevronDown className={`w-4 h-4 ${openFaqIndex === index ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 px-6 ${openFaqIndex === index ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-slate-400 font-light leading-relaxed border-l-2 border-slate-800 pl-4">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Epic Bottom CTA Card */}
      <section className="py-32 container mx-auto px-6 relative z-10">
        <div className="relative w-full max-w-5xl mx-auto rounded-[3rem] p-1 bg-gradient-to-b from-blue-500/20 to-slate-900 overflow-hidden shadow-[0_0_80px_-20px_rgba(59,130,246,0.2)]">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-3xl m-0.5 rounded-[3rem]"></div>

          <div className="relative z-10 p-12 md:p-24 text-center">
            {/* Glowing orb center behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight relative z-10">
              Transformez votre expertise <br /> en entreprise.
            </h2>
            <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto font-light relative z-10">
              Rejoignez les 200+ coachs qui ont déjà réservé leur place. Les membres fondateurs bénéficieront d'avantages exclusifs au lancement.
            </p>
            <p className="text-sm text-slate-500 mb-12 relative z-10">
              Places limitées — Sans carte bancaire — 14 jours d'essai gratuit
            </p>

            <div className="flex justify-center relative z-10">
              <Link
                to="/waitlist"
                className="group relative inline-flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-white rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-slate-100 transition-colors">
                  Réserver ma place gratuitement <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tech/Minimal Footer */}
      <footer className="border-t border-white/5 bg-slate-950 pt-20 pb-12 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 text-xl font-bold text-white mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center p-[1px]">
                  <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <span className="tracking-tight">Coachency</span>
              </div>
              <p className="text-slate-500 text-sm font-light leading-relaxed mb-6">
                Le système opérationnel des coachs sportifs qui dominent leur marché. Conçu en Suisse, fait pour performer mondialement.
              </p>
              <div className="flex gap-4">
                <SocialIcon icon={<Instagram className="w-4 h-4" />} />
                <SocialIcon icon={<Twitter className="w-4 h-4" />} />
                <SocialIcon icon={<Linkedin className="w-4 h-4" />} />
              </div>
            </div>

            <div className="lg:col-start-3">
              <h4 className="text-white font-semibold mb-6 text-sm tracking-wider uppercase">Produit</h4>
              <ul className="space-y-4">
                <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Fonctionnalités</Link></li>
                <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Tarifs</Link></li>
                <li><Link to="/geneve" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Coach Sportif Genève</Link></li>
                <li><Link to="/lausanne" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Coach Sportif Lausanne</Link></li>
                <li><Link to="/zurich" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Coach Sportif Zurich</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-sm tracking-wider uppercase">Légal</h4>
              <ul className="space-y-4">
                <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Privacy Policy</Link></li>
                <li><Link to="/legal" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Mentions Légales</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 font-light">
              © {new Date().getFullYear()} Coachency. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-600 font-light">
              <span>Backed by</span>
              <a href="https://devjay.ch" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity grayscale hover:grayscale-0">
                <img src="/jbdev-logo.png" alt="JB.Dev" className="h-4 w-auto object-contain" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:bg-white/[0.1] hover:text-white transition-all hover:border-white/20">
      {icon}
    </a>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
  );
}

export default Home;