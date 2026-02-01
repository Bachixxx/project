import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Menu, X, Check, X as XIcon, HelpCircle, ChevronDown, ChevronUp, Palette, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAdapty } from '../hooks/useAdapty';

function Pricing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [billingInterval, setBillingInterval] = useState<'month' | 'year' | 'lifetime'>('month');

    // Mobile IAP Integration
    const { products, makePurchase, loading: adaptyLoading } = useAdapty();
    const isNative = Capacitor.isNativePlatform();

    const handleSubscribe = async () => {
        if (!isNative) return; // Web flow handled by Link to /waitlist or Stripe

        // Find product matching current interval
        // Note: product IDs should be configured in Adapty as: 
        // 'pro_monthly', 'pro_annual', 'pro_lifetime'
        const productMap: Record<string, string> = {
            'month': 'pro_monthly',
            'year': 'pro_annual',
            'lifetime': 'pro_lifetime'
        };

        const productId = productMap[billingInterval];
        const product = products.find(p => p.vendorProductId === productId);

        if (product) {
            try {
                await makePurchase(product);
                alert('Achat réussi ! Bienvenue dans Coachency Pro.');
                // Redirect or refresh state
            } catch (e) {
                // Error handled in hook or silent
            }
        } else {
            alert('Produit introuvable dans le store. Veuillez réessayer plus tard.');
        }
    };

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
        <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
            {/* Background Gradients (consistent with Login/Upgrade) */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

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
            <section className="pt-40 pb-20 container mx-auto px-6 text-center relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-in">
                    Des tarifs simples et <br />
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Transparents</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-in delay-100">
                    Commencez gratuitement, évoluez à votre rythme. Aucun engagement, aucune carte requise pour commencer.
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex p-1 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 animate-slide-in delay-150">
                    <button
                        onClick={() => setBillingInterval('month')}
                        className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all ${billingInterval === 'month'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setBillingInterval('year')}
                        className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingInterval === 'year'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Annuel
                        <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            -17%
                        </span>
                    </button>
                    <button
                        onClick={() => setBillingInterval('lifetime')}
                        className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingInterval === 'lifetime'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Lifetime
                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            BEST
                        </span>
                    </button>
                </div>
            </section>

            {/* Pricing Tables */}
            <section className="pb-20 container mx-auto px-6 relative z-10">
                <div className="max-w-md mx-auto mb-20">

                    {/* Pro Tier (Highlighted) */}
                    <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-blue-500/50 flex flex-col shadow-2xl shadow-blue-500/10 transform animate-fade-in z-10 group">

                        {/* Glowing border effect */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-wide uppercase shadow-lg flex items-center gap-1.5 z-20">
                            <Sparkles className="w-3 h-3" />
                            14 Jours Offerts
                        </div>

                        <div className="mb-6 mt-2 text-center">
                            <h3 className="text-xl font-bold text-blue-400 mb-2">Professionnel</h3>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-bold text-white">
                                    {billingInterval === 'month' ? '19.00' : billingInterval === 'year' ? '199' : '1200'}
                                </span>
                                <span className="text-xl font-bold text-white">CHF</span>
                                <span className="text-gray-400">{billingInterval === 'lifetime' ? '' : `/${billingInterval === 'month' ? 'mois' : 'an'}`}</span>
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

                        {isNative ? (
                            <button
                                onClick={handleSubscribe}
                                disabled={adaptyLoading}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-center shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 disabled:opacity-50"
                            >
                                {adaptyLoading ? 'Chargement...' : 'S\'abonner avec ' + (Capacitor.getPlatform() === 'ios' ? 'Apple' : 'Google')}
                            </button>
                        ) : (
                            <Link to="/waitlist" className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-center shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
                                Commencer l'essai gratuit
                            </Link>
                        )}
                    </div>
                </div>

                {/* Branding Add-on Section */}
                <div className="max-w-4xl mx-auto animate-fade-in delay-300">
                    <div className="glass-card rounded-3xl p-1 relative overflow-hidden">
                        {/* Gradient Border content */}
                        <div className="bg-[#0f172a]/90 backdrop-blur-xl rounded-[22px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">

                            {/* Decorative Blobs inside card */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="flex-1 relative z-10 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <Palette className="w-3 h-3" />
                                    Option Add-on
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Option Branding</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Personnalisez l'expérience de vos clients avec votre propre identité visuelle. Logo, couleurs, et thèmes personnalisés pour une application à votre image.
                                </p>
                            </div>

                            <div className="flex flex-col items-center md:items-end justify-center relative z-10 min-w-[200px]">
                                <div className="text-center md:text-right mb-4">
                                    <div className="flex items-baseline justify-center md:justify-end gap-1">
                                        <span className="text-3xl font-bold text-white">+5</span>
                                        <span className="text-lg font-bold text-white">CHF</span>
                                        <span className="text-gray-400">/mois</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">S'ajoute à votre forfait Pro</p>
                                </div>
                                <Link to="/waitlist" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105 flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Ajouter le Branding
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal Add-on Section */}
                <div className="max-w-4xl mx-auto animate-fade-in delay-300 mt-8">
                    <div className="glass-card rounded-3xl p-1 relative overflow-hidden">
                        {/* Gradient Border content */}
                        <div className="bg-[#0f172a]/90 backdrop-blur-xl rounded-[22px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">

                            {/* Decorative Blobs inside card */}
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="flex-1 relative z-10 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                                    Option Add-on
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Terminal Sans Contact</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Encaissez vos clients en personne directement depuis votre téléphone ou un terminal compatible. Solution de paiement sans contact intégrée.
                                </p>
                            </div>

                            <div className="flex flex-col items-center md:items-end justify-center relative z-10 min-w-[200px]">
                                <div className="text-center md:text-right mb-4">
                                    <div className="flex items-baseline justify-center md:justify-end gap-1">
                                        <span className="text-3xl font-bold text-white">+9.90</span>
                                        <span className="text-lg font-bold text-white">CHF</span>
                                        <span className="text-gray-400">/mois</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">S'ajoute à votre forfait Pro</p>
                                </div>
                                <Link to="/waitlist" className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2" /><line x1="2" x2="22" y1="11" y2="11" /></svg>
                                    Ajouter le Terminal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white/5 border-t border-white/5 relative z-10">
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

            {/* Footer */}
            <footer className="bg-[#0b1120] py-8 border-t border-white/5 text-center text-gray-500 text-sm relative z-10">
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
