import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Users, Calendar, LineChart, Shield, Smartphone, MessageSquare, CheckCircle, ArrowRight, Menu, X, Timer, CreditCard, Layout, Zap } from 'lucide-react';

function Features() {
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState<'coach' | 'client'>('coach');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans overflow-x-hidden relative">

            {/* Dynamic Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[150px] mix-blend-screen opacity-50"></div>
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
            </div>

            {/* Floating Navbar (Copied from Home.tsx) */}
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
                            <Link to="/features" className="text-sm font-medium text-white transition-colors">Fonctionnalités</Link>
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
                                    Rejoindre la liste d'attente
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
                    <Link to="/features" className="text-xl font-medium text-white py-2 border-b border-white/5">Fonctionnalités</Link>
                    <Link to="/pricing" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Tarifs</Link>
                    <Link to="/client/login" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Espace Client</Link>
                    <div className="flex flex-col gap-4 mt-8">
                        <Link to="/login" className="bg-white/5 border border-white/10 text-center py-4 rounded-2xl text-white font-medium">Connexion Coach</Link>
                        <Link to="/waitlist" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-center py-4 rounded-2xl text-white font-medium shadow-[0_0_30px_rgba(59,130,246,0.2)]">Rejoindre la liste d'attente</Link>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="pt-40 pb-20 container mx-auto px-6 text-center relative z-10">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-in tracking-tighter">
                    <span className="text-white">Une plateforme.</span>{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Deux expériences.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-16 animate-slide-in delay-100 font-light">
                    Que vous soyez coach ou élève, Coachency a été pensé depuis le terrain pour supprimer la friction de chaque côté de la collaboration.
                </p>

                {/* High-end Segmented Control Toggle */}
                <div className="flex justify-center mb-16 animate-fade-in delay-200">
                    <div className="bg-slate-900 border border-white/5 p-1.5 rounded-full flex gap-1 shadow-lg backdrop-blur-md relative">
                        <button
                            onClick={() => setActiveTab('coach')}
                            className={`relative z-10 px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'coach'
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Dumbbell className={`w-4 h-4 transition-colors ${activeTab === 'coach' ? 'text-blue-400' : ''}`} /> Pour le Coach
                        </button>
                        <button
                            onClick={() => setActiveTab('client')}
                            className={`relative z-10 px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'client'
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Users className={`w-4 h-4 transition-colors ${activeTab === 'client' ? 'text-purple-400' : ''}`} /> Pour le Client
                        </button>

                        {/* Animated background pill component */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-500 ease-spring pointer-events-none ${activeTab === 'coach'
                                    ? 'left-1.5 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 border border-blue-500/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                                    : 'left-[calc(50%+2px)] bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                }`}
                        >
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Content */}
            <section className="pb-32 container mx-auto px-6 relative z-10">
                {activeTab === 'coach' ? (
                    <div className="flex flex-col gap-32 animate-fade-in">
                        {[
                            {
                                title: "Live Workout Tracker",
                                description: "Interface dédiée pour suivre la séance du client en direct. Ajustez les charges, validez les répétitions et fournissez un feedback immédiat.",
                                icon: Timer,
                                color: "blue",
                                desktopImage: "/feature-live-workout-desktop.png",
                                mobileImage: "/feature-live-workout-mobile.png"
                            },
                            {
                                title: "Le Dashboard Central",
                                description: "Votre tour de contrôle. Visualisez revenus, nouveaux clients et séances à venir en un clin d'œil dès votre connexion.",
                                icon: Layout,
                                color: "cyan",
                                desktopImage: "/feature-dashboard-desktop.png",
                                mobileImage: "/feature-dashboard-mobile.png"
                            },
                            {
                                title: "Programmation Avancée",
                                description: "Gérez votre bibliothèque d'exercices, construisez des blocs, et assemblez des programmes cyclés ultra rapidement grâce aux templates.",
                                icon: Dumbbell,
                                color: "purple",
                                carousel: [
                                    { desktop: "/feature-training-desktop-exercises.png", mobile: "/feature-training-mobile-exercises.png", label: "Exercices" },
                                    { desktop: "/feature-training-desktop-programs.png", mobile: "/feature-training-mobile-programs.png", label: "Création de Séance" },
                                    { desktop: "/feature-training-desktop-sessions.png", mobile: "/feature-training-mobile-sessions.png", label: "Planification" }
                                ]
                            },
                            {
                                title: "CRM Clients",
                                description: "Centralisez tous vos athlètes. Retrouvez leurs historiques de progression, bilans biométriques, notes privées et statistiques globales.",
                                icon: Users,
                                color: "pink",
                                carousel: [
                                    { desktop: "/feature-client-desktop-list.png", mobile: "/feature-client-mobile-list.png", label: "Aperçu de la liste" },
                                    { desktop: "/feature-client-desktop-profile.png", mobile: "/feature-client-mobile-profile.png", label: "Profil & Objectifs" },
                                    { desktop: "/feature-client-desktop-perf.png", mobile: "/feature-client-mobile-perf.png", label: "Données Biomécaniques" },
                                    { desktop: "/feature-client-desktop-body.png", mobile: "/feature-client-mobile-body.png", label: "Suivi Morphologique" }
                                ]
                            },
                            {
                                title: "Calendrier & Sessions",
                                description: "Planification bi-directionnelle. Synchronisez votre agenda Coach et gérez vos créneaux de coaching en direct très facilement.",
                                icon: Calendar,
                                color: "orange",
                                desktopImage: "/feature-calendar-desktop.png",
                                mobileImage: "/feature-calendar-mobile.png"
                            },
                            {
                                title: "Multi-coaching & Équipes",
                                description: "Vous sous-traitez ou travaillez à plusieurs ? Mettez plusieurs coachs sur un même client avec un contrôle granulaire des accès.",
                                icon: MessageSquare,
                                color: "green",
                                desktopImage: "/feature-multi-coaching-desktop.png"
                            },
                            {
                                title: "Paiements Automatisés",
                                description: "Monétisez sans la moindre friction. Activez Stripe, créez des offres par abonnement et ne courez plus jamais derrière une facture impayée.",
                                icon: CreditCard,
                                color: "emerald",
                                isPaid: true,
                                carousel: [
                                    { desktop: "/feature-finance-desktop-payments.png", mobile: "/feature-finance-mobile-payments.png", label: "Liste des transactions" },
                                    { desktop: "/feature-finance-desktop-terminal.png", mobile: "/feature-finance-mobile-terminal.png", label: "Terminal Physique" },
                                    { desktop: "/feature-finance-desktop-offers.png", mobile: "/feature-finance-mobile-offers.png", label: "Vos Offres & Formules" }
                                ]
                            },
                            {
                                title: "Branding Personnalisé",
                                description: "Votre marque propulsée en avant. Personnalisez l'entièreté de l'interface client avec votre propre logo commercial et votre charte couleurs.",
                                icon: Shield,
                                color: "indigo",
                                isPaid: true,
                                desktopImage: "/feature-branding-desktop.png",
                                mobileImage: "/feature-branding-mobile.png"
                            }
                        ].map((feature: any, index) => (
                            <FeatureCard key={index} feature={feature} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-12 animate-fade-in max-w-6xl mx-auto">
                        {/* Client Focus Hero layout */}
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 group hover:border-purple-500/20 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <div className="flex-1 order-2 md:order-1 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-8">
                                    <Smartphone className="w-4 h-4" /> Native App Feel
                                </div>
                                <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">Leur Coach de poche.</h3>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed font-light">
                                    Fini l'abonnement en salle où l'élève est devant un PDF impossible à lire : l'application client Coachency guide l'athlète à travers chaque exercice. S'il ne sait pas comment faire, votre vidéo intégrée lui montre le mouvement.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-white font-medium border-b border-white/5 pb-4"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><CheckCircle className="w-4 h-4" /></div> Déroulé fluide de la séance</li>
                                    <li className="flex items-center gap-3 text-white font-medium border-b border-white/5 pb-4"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Timer className="w-4 h-4" /></div> Chronomètre de repos automatique (Beep-beep)</li>
                                    <li className="flex items-center gap-3 text-white font-medium"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><LineChart className="w-4 h-4" /></div> Historique visuel "Ghost Mode" affiché sous la série</li>
                                </ul>
                                <Link to="/client/register" className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-purple-600/30 group-hover:scale-105">
                                    Découvrir l'Espace Client <ArrowRight className="w-5 h-5 ml-2" />
                                </Link>
                            </div>

                            <div className="flex-1 order-1 md:order-2 flex justify-center relative perspective-[1000px]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                                {/* Advanced iPhone Mockup purely in CSS */}
                                <div className="w-64 md:w-72 h-[550px] bg-black border-[6px] border-slate-800 rounded-[3rem] p-1 relative shadow-2xl rotate-y-6 group-hover:rotate-y-0 transition-transform duration-700">
                                    <div className="absolute top-0 inset-x-0 h-6 flex justify-center py-2 z-20">
                                        <div className="w-20 h-5 bg-black rounded-b-xl"></div>
                                    </div>
                                    <div className="w-full h-full bg-[#0f172a] rounded-[2.5rem] overflow-hidden flex flex-col relative">
                                        <img
                                            src="/client-app-training.png"
                                            alt="Interface App Client Coachency"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity duration-1000"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Client Features Mini Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-900/30 p-8 rounded-3xl border border-white/5 hover:border-pink-500/30 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6">
                                    <LineChart className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">La Datas au centre</h3>
                                <p className="text-slate-400 font-light leading-relaxed">
                                    Salles des bilans. Vos athlètes injectent leurs poids de corps du jour en un tap. Ils uploadent leurs photos morphologiques directement depuis l'App (100% sécurisé et floutable). Le Dashboard Client leur compile toutes ces datas en courbes de progression claires.
                                </p>
                            </div>

                            <div className="bg-slate-900/30 p-8 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Feedbacks temps réel</h3>
                                <p className="text-slate-400 font-light leading-relaxed">
                                    Chaque série logger autorise la rédaction d'un mémo vocal ou texte ("Ma forme était horrible aujourd'hui sur le Squat"). La discussion s'engage à la racine de la performance entre le coach et vous. Plus aucune info ne file.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Bottom Final CTA (Matches Home) */}
            <section className="py-32 container mx-auto px-6 relative z-10">
                <div className="relative w-full max-w-5xl mx-auto rounded-[3rem] p-1 bg-gradient-to-b from-blue-500/20 to-slate-900 overflow-hidden shadow-[0_0_80px_-20px_rgba(59,130,246,0.2)]">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-3xl m-0.5 rounded-[3rem]"></div>

                    <div className="relative z-10 p-12 md:p-24 text-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight relative z-10">
                            Passez au niveau <span className="text-blue-400">supérieur</span>.
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light relative z-10">
                            Vous venez de survoler les possibilités incroyables de l'écosystème. Inscrivez-vous sur la liste pour sécuriser votre place.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                            <Link
                                to="/waitlist"
                                className="group relative inline-flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-white rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                                <div className="relative bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-slate-100 transition-colors">
                                    Je suis un Coach <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>

                            <Link
                                to="/client/register"
                                className="group relative inline-flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                                <div className="relative bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-purple-500 transition-colors border border-purple-400/30">
                                    Je suis un Athlète / Élève
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer (Matches Home exactly) */}
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
                                <SocialIcon href="#" icon={<Instagram className="w-4 h-4" />} />
                                <SocialIcon href="#" icon={<Twitter className="w-4 h-4" />} />
                                <SocialIcon href="#" icon={<Linkedin className="w-4 h-4" />} />
                            </div>
                        </div>

                        <div className="lg:col-start-3">
                            <h4 className="text-white font-semibold mb-6 text-sm tracking-wider uppercase">Produit</h4>
                            <ul className="space-y-4">
                                <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Fonctionnalités</Link></li>
                                <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-light">Tarifs</Link></li>
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

// Subcomponents

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
    return (
        <a href={href} className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:bg-white/[0.1] hover:text-white transition-all hover:border-white/20">
            {icon}
        </a>
    );
}

// Improved inner Feature Card Component
function FeatureCard({ feature, index }: { feature: any, index: number }) {
    const [carouselIndex, setCarouselIndex] = useState(0);

    useEffect(() => {
        if (feature.carousel && feature.carousel.length > 1) {
            const interval = setInterval(() => {
                setCarouselIndex((prev) => (prev + 1) % feature.carousel.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [feature.carousel]);

    const currentImage = feature.carousel
        ? feature.carousel[carouselIndex]
        : { desktop: feature.desktopImage, mobile: feature.mobileImage, label: "" };

    return (
        <div className={`flex flex-col md:flex-row items-center gap-12 group ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>

            {/* Textual Logic Side */}
            <div className="flex-1">
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/20 border border-${feature.color}-500/30 flex items-center justify-center text-${feature.color}-400 mb-8 shadow-[0_0_15px_rgba(255,255,255,0)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-shadow`}>
                    <feature.icon className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        {feature.title}
                    </h3>
                    {feature.isPaid && (
                        <span className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 text-amber-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                            Option Payante
                        </span>
                    )}
                </div>

                <p className="text-slate-400 text-lg leading-relaxed mb-8 font-light">
                    {feature.description}
                </p>

                <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 font-medium bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 w-fit">
                        <CheckCircle className={`w-4 h-4 text-${feature.color}-500`} />
                        Avantage compétitif débloqué
                    </li>
                </ul>

                {/* Soft Carousel Indicators with text instead of dots */}
                {feature.carousel && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {feature.carousel.map((item: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setCarouselIndex(idx)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${idx === carouselIndex
                                        ? `bg-${feature.color}-500/20 text-${feature.color}-300 border border-${feature.color}-500/30`
                                        : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                                    }`}
                            >
                                {item.label || `Onglet ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Visual Glassmorphism Mockups Side */}
            <div className="flex-1 w-full relative perspective-[1000px]">
                {/* Backwards glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-${feature.color}-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity opacity-50 group-hover:opacity-100`}></div>

                <div className={`
                    aspect-[16/10] rounded-[2rem] border border-white/5 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] 
                    bg-slate-900/60 backdrop-blur-md
                    hover:border-${feature.color}-500/30 transition-all duration-700
                    group-hover:-translate-y-2 group-hover:rotate-y-2 relative
                `}>
                    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                        {currentImage.desktop ? (
                            <img
                                key={`desktop-${carouselIndex}`}
                                src={currentImage.desktop}
                                alt={feature.title}
                                className="w-full h-full object-cover animate-fade-in"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-50">
                                <feature.icon className={`w-16 h-16 mb-4`} />
                                <span className="text-sm font-mono border border-slate-700 px-3 py-1 rounded">Aperçu Visuel à venir</span>
                            </div>
                        )}

                        {/* Fake glare */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Mobile Floating Overlay */}
                    {currentImage.mobile && (
                        <div className={`absolute -bottom-10 h-64 -translate-x-1/2 shadow-2xl overflow-hidden hidden md:block animate-slide-in-bottom duration-500 transition-all 
                        ${index % 2 === 1 ? 'left-10 hover:-translate-y-2 group-hover:rotate-2' : 'left-[calc(100%-40px)] hover:-translate-y-2 group-hover:-rotate-2'}
                        `}>
                            {/* iPhone Frame CSS Minimal */}
                            <div className="h-full aspect-[9/19.5] border-[4px] border-slate-800 bg-black rounded-3xl relative p-0.5">
                                <div className="absolute top-0 inset-x-0 h-4 flex justify-center py-1.5 z-20">
                                    <div className="w-12 h-3 bg-black rounded-b-lg"></div>
                                </div>
                                <div className="w-full h-full rounded-[1.25rem] overflow-hidden bg-slate-900 relative">
                                    <img
                                        key={`mobile-${carouselIndex}`}
                                        src={currentImage.mobile}
                                        alt={`${feature.title} Mobile`}
                                        className="w-full h-full object-cover animate-fade-in"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Features;
