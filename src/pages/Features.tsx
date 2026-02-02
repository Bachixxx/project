import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Users, Calendar, LineChart, Shield, Smartphone, MessageSquare, CheckCircle, ArrowRight, Menu, X, Timer, CreditCard, Layout } from 'lucide-react';

function Features() {
    const [activeTab, setActiveTab] = useState<'coach' | 'client'>('coach');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">

            {/* Navbar (Reusable - copied from Home for consistency) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <Dumbbell className="w-5 h-5" />
                        </div>
                        Coachency
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/marketplace" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Marketplace</Link>
                        <Link to="/features" className="text-sm font-medium text-white transition-colors">Fonctionnalités</Link>
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

                    <button
                        className="md:hidden p-2 text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-[#0f172a] border-b border-white/10 p-6 flex flex-col gap-4 animate-fade-in shadow-2xl">
                        <Link to="/marketplace" className="text-gray-300 py-2">Marketplace</Link>
                        <Link to="/features" className="text-white py-2 font-medium">Fonctionnalités</Link>
                        <Link to="/client/login" className="text-gray-300 py-2">Espace Client</Link>
                        <div className="h-px bg-white/10 my-2"></div>
                        <Link to="/login" className="bg-white/10 text-center py-3 rounded-lg text-white font-medium">Connexion Coach</Link>
                        <Link to="/waitlist" className="bg-blue-600 text-center py-3 rounded-lg text-white font-medium">Rejoindre la liste d'attente</Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 container mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-in">
                    <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Une plateforme, deux</span>{' '}
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Expériences</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-in delay-100">
                    Que vous soyez coach ou élève, Coachency vous offre les meilleurs outils pour atteindre vos objectifs.
                </p>

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
            </section>

            {/* Features Grid */}
            <section className="pb-32 container mx-auto px-6">
                {activeTab === 'coach' ? (
                    <div className="flex flex-col gap-32 animate-fade-in">
                        {[
                            {
                                title: "Live Workout Coach",
                                description: "Interface dédiée pour suivre la séance du client en direct. Ajustez les charges, validez les répétitions et fournissez un feedback immédiat.",
                                icon: Timer,
                                color: "blue"
                            },
                            {
                                title: "Dashboard",
                                description: "Votre tour de contrôle. Visualisez revenus, nouveaux clients et séances à venir en un clin d'œil.",
                                icon: Layout,
                                color: "cyan"
                            },
                            {
                                title: "Entraînement",
                                description: "Gérez votre bibliothèque d'exercices, construisez des séances et assemblez des programmes complets.",
                                icon: Dumbbell,
                                color: "purple"
                            },
                            {
                                title: "Client",
                                description: "CRM complet pour centraliser profils, historiques de progression, notes privées et objectifs.",
                                icon: Users,
                                color: "pink"
                            },
                            {
                                title: "Calendrier",
                                description: "Planification bidirectionnelle. Synchronisez votre agenda et gérez vos disponibilités en temps réel.",
                                icon: Calendar,
                                color: "orange"
                            },
                            {
                                title: "Multi-coaching",
                                description: "Travaillez en équipe. Collaborez avec d'autres coachs sur les mêmes clients ou programmes.",
                                icon: MessageSquare,
                                color: "green"
                            },
                            {
                                title: "Finance",
                                description: "Monétisez sans friction. Abonnements, liens de paiement et encaissement physique via Terminal.",
                                icon: CreditCard,
                                color: "emerald"
                            },
                            {
                                title: "Branding",
                                description: "Votre marque en avant. Personnalisez l'interface client avec votre logo et vos couleurs.",
                                icon: Shield,
                                color: "indigo"
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className={`flex flex-col md:flex-row items-center gap-12 group ${index % 2 === 1 ? 'md:flex-row-reverse' : ''
                                    }`}
                            >
                                {/* Text Content */}
                                <div className="flex-1">
                                    <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center text-${feature.color}-400 mb-6`}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        {feature.description}
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <CheckCircle className={`w-5 h-5 text-${feature.color}-500`} />
                                            Fonctionnalité clé incluse
                                        </li>
                                    </ul>
                                </div>

                                {/* Visual Content */}
                                <div className="flex-1 w-full">
                                    <div className={`
                                        aspect-video rounded-2xl border border-white/10 p-2 shadow-2xl 
                                        bg-gradient-to-br from-gray-900 to-gray-800
                                        hover:border-${feature.color}-500/30 transition-all duration-500
                                        group-hover:scale-[1.02]
                                    `}>
                                        <div className="w-full h-full bg-[#0f172a] rounded-xl overflow-hidden flex items-center justify-center relative">
                                            {/* Placeholder for future screenshots */}
                                            <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/10 to-transparent opacity-50`}></div>
                                            <feature.icon className={`w-16 h-16 text-${feature.color}-500/20`} />
                                            <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-600 bg-black/50 px-2 py-1 rounded">
                                                Image: {feature.title}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
                        {/* Client Feature 1 */}
                        <div className="glass-card p-8 rounded-2xl border border-white/10 md:col-span-2 flex flex-col md:flex-row items-center gap-12 group">
                            <div className="flex-1 order-2 md:order-1">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">Votre Coach dans la poche</h3>
                                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                                    Accédez à vos entraînements n'importe où, n'importe quand. Suivez les instructions, validez vos séries et regardez votre progression.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-purple-500" /> Interface mobile fluide</li>
                                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-purple-500" /> Chronomètre de repos intégré</li>
                                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-purple-500" /> Vidéos de démonstration</li>
                                </ul>
                                <Link to="/client/register" className="text-purple-400 font-bold hover:text-purple-300 flex items-center gap-2 group-hover:gap-3 transition-all">
                                    Créer mon compte <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="flex-1 order-1 md:order-2 flex justify-center">
                                <div className="w-64 h-[500px] bg-black border-4 border-gray-800 rounded-[3rem] p-2 relative shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full bg-[#0f172a] rounded-[2.5rem] overflow-hidden flex flex-col">
                                        <img
                                            src="/client-app-mockup.jpg"
                                            alt="App Client Coachency"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Client Feature 2 */}
                        <div className="glass-card p-8 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6">
                                <LineChart className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Suivi de Progression</h3>
                            <p className="text-gray-400 mb-6">
                                Visualisez vos progrès avec des graphiques clairs. Poids soulevé, volume total, régularité : tout est suivi automatiquement.
                            </p>
                        </div>

                        {/* Client Feature 3 */}
                        <div className="glass-card p-8 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Messagerie Directe</h3>
                            <p className="text-gray-400 mb-6">
                                Besoin d'un conseil ? Discutez directement avec votre coach via la messagerie intégrée pour des retours rapides.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white/5 border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">Prêt à commencer ?</h2>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link
                            to="/waitlist"
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all w-full sm:w-auto"
                        >
                            Je suis un Coach
                        </Link>
                        <Link
                            to="/client/register"
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all w-full sm:w-auto"
                        >
                            Je suis un Élève
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer (Simplified) */}
            <footer className="bg-[#0b1120] py-8 border-t border-white/5 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Coachency. Tous droits réservés.</p>
            </footer>

        </div>
    );
}

export default Features;
