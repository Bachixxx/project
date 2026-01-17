import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Menu, X, Check, X as XIcon, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

function Pricing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const faqs = [
        {
            question: "Puis-je changer de forfait à tout moment ?",
            answer: "Absolument. Vous pouvez passer à un forfait supérieur ou inférieur à n'importe quel moment depuis votre tableau de bord. Les changements de facturation sont immédiats."
        },
        {
            question: "Y a-t-il des frais cachés ?",
            answer: "Non, aucun. Le prix affiché est le prix que vous payez. Les frais de transaction Stripe standard s'appliquent uniquement si vous encaissez des paiements via la plateforme."
        },
        {
            question: "Puis-je annuler mon abonnement ?",
            answer: "Oui, vous pouvez annuler votre abonnement à tout moment sans frais d'annulation. Votre accès restera actif jusqu'à la fin de la période de facturation en cours."
        },
        {
            question: "Proposez-vous une période d'essai ?",
            answer: "Oui ! Le plan Professionnel inclut 14 jours d'essai gratuit pour vous permettre de tester toutes les fonctionnalités sans engagement."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">

            {/* Navbar */}
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
                        <Link to="/features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Fonctionnalités</Link>
                        <Link to="/pricing" className="text-sm font-medium text-white transition-colors">Tarifs</Link>
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
                        <Link to="/features" className="text-gray-300 py-2">Fonctionnalités</Link>
                        <Link to="/pricing" className="text-white py-2 font-medium">Tarifs</Link>
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
                    Des tarifs simples et <br />
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Transparents</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-in delay-100">
                    Commencez gratuitement, évoluez à votre rythme. Aucun engagement, aucune carte requise pour commencer.
                </p>
            </section>

            {/* Pricing Tables */}
            <section className="pb-32 container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                    {/* Free Tier */}
                    <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col animate-fade-in delay-200 hover:border-white/20 transition-all group">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Découverte</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">0</span>
                                <span className="text-xl font-bold text-white">CHF</span>
                                <span className="text-gray-400">/mois</span>
                            </div>
                            <p className="text-gray-400 mt-4 text-sm">Pour les coachs qui débutent leur activité.</p>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <FeatureItem text="Jusqu'à 5 clients" included={true} />
                            <FeatureItem text="Jusqu'à 5 programmes" included={true} />
                            <FeatureItem text="Bibliothèque d'exercices illimitée" included={true} />
                            <FeatureItem text="Gestion des rendez-vous" included={true} />
                            <FeatureItem text="Calendrier de base" included={true} />
                            <FeatureItem text="Support par email" included={true} />
                            <FeatureItem text="Analyses avancées" included={true} />
                            <FeatureItem text="Multi-coachs" included={true} />
                        </div>

                        <Link to="/waitlist" className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all">
                            Rejoindre la liste d'attente
                        </Link>
                    </div>

                    {/* Pro Tier (Highlighted) */}
                    <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-blue-500/50 flex flex-col shadow-2xl shadow-blue-500/10 transform md:-translate-y-4 animate-fade-in z-10">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-1 rounded-full text-xs font-bold text-white tracking-wide uppercase shadow-lg">
                            Le Plus Populaire
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-2">Professionnel</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white">49.90</span>
                                <span className="text-xl font-bold text-white">CHF</span>
                                <span className="text-gray-400">/mois</span>
                            </div>
                            <p className="text-gray-400 mt-4 text-sm">Tout ce qu'il faut pour scaler votre business.</p>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <FeatureItem text="Clients illimités" included={true} highlight={true} />
                            <FeatureItem text="Programmes illimités" included={true} highlight={true} />
                            <FeatureItem text="Bibliothèque d'exercices illimitée" included={true} />
                            <FeatureItem text="Gestion complète du calendrier" included={true} />
                            <FeatureItem text="Traitement des paiements" included={true} />
                            <FeatureItem text="Suivi des progrès clients" included={true} />
                            <FeatureItem text="Analyses avancées" included={true} />

                            <FeatureItem text="Multi-coachs" included={true} />
                        </div>

                        <Link to="/waitlist" className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-center shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
                            Rejoindre la liste d'attente
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white/5 border-t border-white/5">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-3xl font-bold text-center mb-12">Questions Fréquentes</h2>
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
                                    <div className="px-6 pb-6 text-gray-400 leading-relaxed animate-fade-in">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 mb-4">Vous avez d'autres questions ?</p>
                        <a href="mailto:support@coachency.com" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            <HelpCircle className="w-5 h-5" /> Contacter le support
                        </a>
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

function FeatureItem({ text, included, highlight = false }: { text: string, included: boolean, highlight?: boolean }) {
    return (
        <div className={`flex items-start gap-3 ${included ? 'opacity-100' : 'opacity-50'}`}>
            {included ? (
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Check className="w-3 h-3" />
                </div>
            ) : (
                <div className="mt-0.5 w-5 h-5 rounded-full bg-transparent border border-gray-700 flex items-center justify-center text-gray-600">
                    <XIcon className="w-3 h-3" />
                </div>
            )}
            <span className={`text-sm ${highlight && included ? 'text-white font-medium' : 'text-gray-400'}`}>{text}</span>
        </div>
    );
}

export default Pricing;
