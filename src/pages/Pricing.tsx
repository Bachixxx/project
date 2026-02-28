import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Menu, X, Check, X as XIcon, HelpCircle, ChevronDown, ChevronUp, Palette, Sparkles, CreditCard, Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAdapty } from '../hooks/useAdapty';

function Pricing() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year'); // default to year for better optics

    // Mobile IAP Integration
    const { products, makePurchase, loading: adaptyLoading } = useAdapty();
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubscribe = async () => {
        if (!isNative) return; // Web flow handled by Link to /waitlist or Stripe

        // Find product matching current interval
        const productMap: Record<string, string> = {
            'month': 'monthly_pro',
            'year': 'annual_pro'
        };

        const productId = productMap[billingInterval];
        const product = products.find(p => p.vendorProductId === productId);

        if (product) {
            try {
                await makePurchase(product);
                alert('Achat réussi ! Bienvenue dans Coachency Pro.');
            } catch (e) {
                // Error handled
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
            answer: "Absolument. Vous pouvez passer à un forfait supérieur ou inférieur à n'importe quel moment depuis votre tableau de bord. Les changements de facturation sont immédiats et calculés au prorata."
        },
        {
            question: "Y a-t-il des frais cachés ou des frais de mise en route ?",
            answer: "Non, aucun. L'abonnement mensuel ou annuel est le seul coût. Les frais de transaction Stripe standard s'appliquent uniquement si vous décidez d'utiliser le module Finance inclut pour encaisser vos propres clients en ligne."
        },
        {
            question: "Que se passe-t-il à la fin de mes 14 jours d'essai ?",
            answer: "Si vous n'avez pas entré de méthode de paiement, votre compte sera simplement mis en pause. Vous ne serez jamais prélevé sans votre accord explicite. Vous pouvez ajouter une carte à n'importe quel moment pour reprendre où vous en étiez."
        },
        {
            question: "Puis-je annuler mon abonnement ?",
            answer: "Oui, en un clic depuis les paramètres de votre compte. Vous conserverez l'accès complet à toutes les fonctionnalités Pro jusqu'à la fin de votre période de facturation en cours."
        }
    ];

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
                            <Link to="/features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Fonctionnalités</Link>
                            <Link to="/pricing" className="text-sm font-medium text-white transition-colors">Tarifs</Link>
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
                    <Link to="/features" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Fonctionnalités</Link>
                    <Link to="/pricing" className="text-xl font-medium text-white py-2 border-b border-white/5">Tarifs</Link>
                    <Link to="/client/login" className="text-xl font-medium text-slate-300 py-2 border-b border-white/5">Espace Client</Link>
                    <div className="flex flex-col gap-4 mt-8">
                        <Link to="/login" className="bg-white/5 border border-white/10 text-center py-4 rounded-2xl text-white font-medium">Connexion Coach</Link>
                        <Link to="/waitlist" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-center py-4 rounded-2xl text-white font-medium shadow-[0_0_30px_rgba(59,130,246,0.2)]">Rejoindre la liste d'attente</Link>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="pt-40 pb-16 container mx-auto px-6 text-center relative z-10">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-in tracking-tighter">
                    <span className="text-white">Un outil pro.</span> <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Un tarif transparent.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 animate-slide-in delay-100 font-light">
                    Commencez gratuitement, évoluez à votre rythme. <br className="hidden md:block" />Aucun engagement, aucune carte bancaire requise pour tester.
                </p>

                {/* High-end Segmented Control Toggle */}
                <div className="flex justify-center mb-0 animate-fade-in delay-200">
                    <div className="bg-slate-900 border border-white/5 p-1.5 rounded-full flex gap-1 shadow-lg backdrop-blur-md relative">
                        <button
                            onClick={() => setBillingInterval('month')}
                            className={`relative z-10 px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center justify-center min-w-[140px] ${billingInterval === 'month'
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setBillingInterval('year')}
                            className={`relative z-10 px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center justify-center min-w-[140px] gap-2 ${billingInterval === 'year'
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Annuel
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm transition-colors ${billingInterval === 'year' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                -17%
                            </span>
                        </button>

                        {/* Animated background pill component */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-500 ease-spring pointer-events-none ${billingInterval === 'month'
                                ? 'left-1.5 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 border border-blue-500/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                                : 'left-[calc(50%+2px)] bg-gradient-to-r from-blue-600/40 to-cyan-600/40 border border-blue-500/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                                }`}
                        >
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pb-32 container mx-auto px-6 relative z-10">
                <div className="max-w-lg mx-auto relative perspective-[1000px]">

                    {/* Background immense glow for the main pricing card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>

                    {/* Pro Tier (Highlighted Ultimate Card) */}
                    <div className="relative rounded-[2.5rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-1 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform animate-fade-in z-10 group">

                        {/* Animated gradient border container */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 via-transparent to-transparent opacity-50 pointer-events-none rounded-[2.5rem]"></div>

                        <div className="relative bg-slate-950/50 rounded-[2.4rem] p-8 md:p-12 h-full flex flex-col">
                            {/* Inner Top Glow */}
                            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none rounded-t-[2.4rem]"></div>

                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-1.5 rounded-full text-xs font-bold text-white tracking-widest uppercase shadow-[0_0_20px_rgba(56,189,248,0.5)] flex items-center gap-2 z-20 whitespace-nowrap">
                                <Sparkles className="w-3.5 h-3.5" />
                                14 Jours Offerts
                            </div>

                            <div className="mb-10 text-center mt-4 relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-2">Professionnel</h3>
                                <p className="text-slate-400 text-sm font-light mb-6">L'écosystème complet pour scaler votre activité.</p>

                                <div className="flex items-start justify-center gap-1">
                                    <span className="text-2xl font-bold text-slate-400 mt-2">CHF</span>
                                    <span className="text-7xl font-bold text-white tracking-tighter">
                                        {billingInterval === 'month' ? '19.90' : '199'}
                                    </span>
                                </div>
                                <div className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
                                    /{billingInterval === 'month' ? 'mois' : 'an'}
                                </div>
                            </div>

                            <div className="flex-1 space-y-5 mb-10 relative z-10">
                                <FeatureItem text="Clients & Programmes illimités" included={true} highlight={true} />
                                <FeatureItem text="Bibliothèque d'exercices illimitée" included={true} />
                                <FeatureItem text="Application Native (Client & Coach)" included={true} />
                                <FeatureItem text="Live Workout Tracker (Temps réel)" included={true} />
                                <FeatureItem text="Suivi d'évolution & Biométrie" included={true} />
                                <FeatureItem text="Calendrier bidirectionnel" included={true} />
                                <FeatureItem text="Encaissement et facturation intégrés" included={true} />
                                <FeatureItem text="Chat centralisé & Notes" included={true} />
                            </div>

                            {isNative ? (
                                <button
                                    onClick={handleSubscribe}
                                    disabled={adaptyLoading}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg text-center shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] disabled:opacity-50 relative overflow-hidden group/btn"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                                    <span className="relative z-10">{adaptyLoading ? 'Chargement...' : 'S\'abonner avec ' + (Capacitor.getPlatform() === 'ios' ? 'Apple' : 'Google')}</span>
                                </button>
                            ) : (
                                <Link to="/waitlist" className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg text-center shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] relative overflow-hidden group/btn">
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                                    <span className="relative z-10">Démarrer vos 14 Jours d'essai</span>
                                </Link>
                            )}
                            <p className="text-center text-xs text-slate-500 mt-4 font-light">Aucune carte requise pour la période d'essai.</p>
                        </div>
                    </div>
                </div>

                {/* Add-ons Section title */}
                <div className="max-w-4xl mx-auto mt-32 mb-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Modules Additionnels</h2>
                    <p className="text-slate-400 font-light">Personnalisez votre plan Pro avec des intégrations Premium optionnelles.</p>
                </div>

                {/* Branding Add-on Section */}
                <div className="max-w-4xl mx-auto animate-fade-in group">
                    <div className="glass-card rounded-[2rem] p-1 relative overflow-hidden shadow-lg transition-all duration-500 hover:shadow-[0_0_50px_-15px_rgba(168,85,247,0.3)]">
                        {/* Hover Gradient Border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-purple-500/20 transition-all duration-700"></div>

                        <div className="bg-slate-900/80 backdrop-blur-xl rounded-[1.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
                            {/* Decorative Blobs inside card */}
                            <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700" />

                            <div className="flex-1 relative z-10 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <Palette className="w-3 h-3" />
                                    Module Premium
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">Branding Personnalisé</h3>
                                <p className="text-slate-400 leading-relaxed font-light">
                                    Affichez votre propre agence. Oubliez Coachency avec vos clients : injectez votre logo, votre charte de couleurs, et offrez-leur une application mobile à VOTRE image.
                                </p>
                            </div>

                            <div className="flex flex-col items-center md:items-end justify-center relative z-10 min-w-[200px]">
                                <div className="text-center md:text-right mb-6">
                                    <div className="flex items-baseline justify-center md:justify-end gap-1">
                                        <span className="text-4xl font-bold text-white">+5</span>
                                        <span className="text-xl font-bold text-white">CHF</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-medium">/mois</p>
                                </div>
                                <Link to="/waitlist" className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 text-white font-bold transition-all flex items-center gap-2 group/addon">
                                    <Palette className="w-4 h-4 text-purple-400 group-hover/addon:scale-110 transition-transform" />
                                    Options de marque
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal Add-on Section */}
                <div className="max-w-4xl mx-auto animate-fade-in mt-6 group">
                    <div className="glass-card rounded-[2rem] p-1 relative overflow-hidden shadow-lg transition-all duration-500 hover:shadow-[0_0_50px_-15px_rgba(16,185,129,0.3)]">
                        {/* Hover Gradient Border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-emerald-500/0 group-hover:from-emerald-500/20 group-hover:via-teal-500/20 group-hover:to-emerald-500/20 transition-all duration-700"></div>

                        <div className="bg-slate-900/80 backdrop-blur-xl rounded-[1.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
                            {/* Decorative Blobs inside card */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-700" />

                            <div className="flex-1 relative z-10 text-center md:text-left order-1 md:order-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <CreditCard className="w-3 h-3" />
                                    Terminal Physique
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">Paiement Sans Contact (Tap-to-Pay)</h3>
                                <p className="text-slate-400 leading-relaxed font-light">
                                    Abonnement "One-shot" dans votre centre ? Transformez votre téléphone intelligent en un véritable terminal de paiement sans fil. Acceptez Apple Pay et les cartes physiques instantanément.
                                </p>
                            </div>

                            <div className="flex flex-col items-center md:items-start justify-center relative z-10 min-w-[200px] order-2 md:order-1">
                                <div className="text-center md:text-left mb-6">
                                    <div className="flex items-baseline justify-center md:justify-start gap-1">
                                        <span className="text-4xl font-bold text-white">+9.90</span>
                                        <span className="text-xl font-bold text-white">CHF</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-medium">/mois</p>
                                </div>
                                <Link to="/waitlist" className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-white font-bold transition-all flex items-center gap-2 group/addon">
                                    <CreditCard className="w-4 h-4 text-emerald-400 group-hover/addon:scale-110 transition-transform" />
                                    Activer Terminal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Minimized FAQ Section */}
            <section className="py-24 bg-slate-900/30 border-t border-white/5 relative z-10">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="text-center mb-16 inline-flex flex-col items-center w-full">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Questions Fréquentes</h2>
                        <p className="text-slate-400 font-light">Tout ce que vous devez savoir concernant la facturation.</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full p-6 flex items-center justify-between text-left focus:outline-none group"
                                >
                                    <span className="font-semibold text-white/90 group-hover:text-white transition-colors">{faq.question}</span>
                                    <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180 bg-blue-500/20 text-blue-400' : 'text-slate-400'}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <div
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaqIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="px-6 pb-6 text-slate-400 leading-relaxed font-light border-t border-white/5 pt-4 mt-2">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <p className="text-slate-300 mb-4 font-medium">Vous avez un cas d'utilisation particulier ?</p>
                        <a href="mailto:support@coachency.com" className="inline-flex items-center justify-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-full font-medium transition-colors border border-slate-700">
                            Nous envoyer un e-mail
                        </a>
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

function FeatureItem({ text, included, highlight = false }: { text: string, included: boolean, highlight?: boolean }) {
    return (
        <div className={`flex items-center gap-4 ${included ? 'opacity-100' : 'opacity-40'}`}>
            {included ? (
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${highlight ? 'bg-white text-blue-600 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                    <Check className="w-3.5 h-3.5" />
                </div>
            ) : (
                <div className="shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600">
                    <XIcon className="w-3.5 h-3.5" />
                </div>
            )}
            <span className={`text-base ${highlight && included ? 'text-white font-medium' : 'text-slate-300 font-light'}`}>{text}</span>
        </div>
    );
}

export default Pricing;
