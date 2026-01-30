import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Users, Facebook, Twitter, Instagram, Linkedin,
  Mail, MapPin, ArrowRight, CheckCircle, Star, Menu, X,
  Smartphone, ChevronDown, ChevronUp, Layers, CreditCard
} from 'lucide-react';

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="md:hidden absolute top-[-10%] left-[-10%] w-[80%] h-[50%] bg-blue-600/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 pb-4' : 'bg-transparent pb-6'}`}>

        {/* Announcement Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs md:text-sm font-medium py-2 px-4 text-center">
          <p>
            🚀 Ouverture prochaine ! <Link to="/waitlist" className="underline hover:text-blue-100 font-bold">Rejoindre la liste d'attente</Link>
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
              Liste d'attente
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
            <Link to="/pricing" className="text-gray-300 py-2">Tarifs</Link>
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
              Rejoignez plus de 500 coachs actifs
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-in">
              Votre activité de Coaching,<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">enfin professionnelle.</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-slide-in delay-100">
              Gagnez du temps, impressionnez vos clients et augmentez vos revenus. La plateforme tout-en-un pour les coachs sportifs ambitieux.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-slide-in delay-200">
              <Link
                to="/waitlist"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Rejoindre la liste <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/features"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2"
              >
                Découvrir les fonctionnalités
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Pas de carte requise</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Annulable à tout moment</span>
            </div>
          </div>

          <div className="lg:w-1/2 relative animate-float">
            <div className="relative z-10 bg-[#1e293b] border border-white/10 rounded-2xl p-2 shadow-2xl shadow-blue-500/20 transform rotate-1 lg:rotate-1 hover:rotate-0 transition-transform duration-500">
              <img
                src="/dashboard-preview.png"
                alt="Dashboard Coachency"
                width="1200"
                height="800"
                className="rounded-xl w-full h-auto opacity-90 hover:opacity-100 transition-opacity"
                // @ts-ignore
                fetchPriority="high"
              />

              {/* Floating Cards Overlays */}
              <div className="absolute -left-8 bottom-20 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl hidden lg:block animate-pulse-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <DollarSign />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Revenus mars</div>
                    <div className="text-lg font-bold text-white">+ 4,250 CHF</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 top-10 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl hidden lg:block animate-pulse-slow delay-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Users />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Nouveaux clients</div>
                    <div className="text-lg font-bold text-white">+ 3 cette semaine</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Presentation / Ecosystem Section */}
      <section className="py-20 relative border-b border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Plus qu'un outil de coaching. <br />
              <span className="text-blue-400">Votre écosystème de réussite.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Coachency centralise tout ce dont vous avez besoin pour coacher mieux, vendre plus et vivre de votre passion. Fini le bricolage, place au professionnalisme.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-8 rounded-2xl hover:bg-[#1e293b] transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">L'Expérience Client Ultime</h3>
              <p className="text-gray-400 leading-relaxed">
                Offrez à vos élèves une application mobile haut de gamme pour suivre vos programmes, pas des PDF illisibles.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-8 rounded-2xl hover:bg-[#1e293b] transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">L'Organisation Parfaite</h3>
              <p className="text-gray-400 leading-relaxed">
                Centralisez programmes, bilans et messagerie au même endroit. Ne perdez plus jamais une info client.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-8 rounded-2xl hover:bg-[#1e293b] transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">La Gestion Simplifiée</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatisez vos paiements et factures. Concentrez-vous sur le coaching, le système gère l'administratif.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Problem vs Solution Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Arrêtez de bricoler. <span className="text-blue-400">Professionalisez.</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">La différence entre un hobby et un business, c'est l'organisation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* The "Old Way" */}
            <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Avant Coachency</div>
              <h3 className="text-2xl font-bold text-red-200 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-lg">😫</span>
                Le Chaos Administratif
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-red-200/60">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span>Programmes envoyés par PDF / Excel / WhatsApp</span>
                </li>
                <li className="flex items-center gap-3 text-red-200/60">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span>Paiements en retard et relances manuelles</span>
                </li>
                <li className="flex items-center gap-3 text-red-200/60">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span>Aucun suivi réel des progrès clients</span>
                </li>
                <li className="flex items-center gap-3 text-red-200/60">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span>Messagerie éparpillée sur 3 applis différentes</span>
                </li>
              </ul>
            </div>

            {/* The "New Way" */}
            <div className="p-8 rounded-3xl bg-blue-500/10 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Avec Coachency</div>
              <h3 className="text-2xl font-bold text-blue-100 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-lg">😎</span>
                La Sérénité Absolue
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-blue-100/80">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Programmes interactifs dans une app dédiée</span>
                </li>
                <li className="flex items-center gap-3 text-blue-100/80">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Paiements automatisés et sécurisés</span>
                </li>
                <li className="flex items-center gap-3 text-blue-100/80">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Graphiques de progression automatiques</span>
                </li>
                <li className="flex items-center gap-3 text-blue-100/80">
                  <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Tout centralisé au même endroit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive 1: Programming */}
      <section className="py-24 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="md:w-1/2">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-[#1e293b] border border-white/10 rounded-2xl p-2 shadow-2xl skew-y-2 group-hover:skew-y-0 transition-transform duration-700 overflow-hidden">
                  <img
                    src="/program-interface.png"
                    alt="Interface de création de programme"
                    className="w-full h-auto rounded-lg opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Créez des programmes en <span className="text-blue-400">quelques minutes</span></h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Notre éditeur de programme est puissant et intuitif. Accédez à une bibliothèque de +80 exercices ou créez les vôtres avec vos propres liens vidéos. Construisez des séances et des programmes complets en toute simplicité.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs"><CheckCircle className="w-4 h-4" /></div>
                  Création d'exercices personnalisés
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs"><CheckCircle className="w-4 h-4" /></div>
                  Ajout de vos propres liens vidéos
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs"><CheckCircle className="w-4 h-4" /></div>
                  Duplication de templates pour gagner du temps
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive 2: Client Experience */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="md:w-1/2">
              <div className="relative group flex justify-center">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                {/* Mockup phone */}
                <div className="relative w-64 h-[500px] bg-black border-[8px] border-gray-800 rounded-[3rem] shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700 overflow-hidden">
                  <img
                    src="/client-app-training.png"
                    alt="Application Client Coachency"
                    className="w-full h-full object-cover object-bottom"
                  />
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Offrez une expérience <span className="text-purple-400">Premium</span> à vos clients</h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Fini les PDFs qu'on ne peut pas lire sur mobile. Vos clients accèdent à une application dédiée, fluide et motivante pour suivre vos entraînements.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs"><CheckCircle className="w-4 h-4" /></div>
                  Chronomètre intégré & Log de poids
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs"><CheckCircle className="w-4 h-4" /></div>
                  Vidéos d'exécution pour chaque exercice
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs"><CheckCircle className="w-4 h-4" /></div>
                  Application à votre image (Logo & Nom)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Questions Fréquentes</h2>
          <p className="text-center text-gray-400 mb-12">Tout ce que vous devez savoir avant de vous lancer.</p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-card border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.07] transition-colors">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  {openFaqIndex === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed animate-fade-in border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 container mx-auto px-6 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 md:p-20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 group-hover:translate-x-1/4 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 group-hover:-translate-x-1/4 transition-transform duration-1000"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Prêt à passer au niveau supérieur ?</h2>
            <p className="text-xl text-blue-100 mb-10">
              Rejoignez les coachs qui ont choisi la modernité. Commencez gratuitement dès aujourd'hui, sans carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/waitlist"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105"
              >
                M'inscrire sur la liste
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 bg-blue-800/30 text-white border border-white/20 rounded-xl font-medium hover:bg-blue-800/50 transition-all"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-8 text-sm text-blue-200 opacity-80">
              Accès prioritaire à la sortie • Places limitées
            </p>
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
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Légal</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Conditions</Link></li>
                <li><Link to="/legal" className="hover:text-blue-400 transition-colors">Mentions Légales</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contact</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-blue-400" /> contact@coachency.ch</li>
                <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-blue-400" /> Genève, Suisse</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} Coachency. Tous droits réservés.</p>
              <div className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span>Conçu par</span>
                <a href="https://devjay.ch" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <img src="/jbdev-logo.png" alt="JB.Dev" className="h-5 w-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

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

// Simple DollarSign icon
function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
  );
}

export default Home;