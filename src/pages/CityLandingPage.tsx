import React from 'react';
import { ArrowRight, CheckCircle, MapPin, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

interface CityLandingPageProps {
    cityName: string;
    urlPath: string;
}

const CityLandingPage: React.FC<CityLandingPageProps> = ({ cityName, urlPath }) => {

    const title = `Coaching Sportif à ${cityName} | L'App Tout-en-Un Coachency`;
    const description = `Vous êtes coach sportif à ${cityName} ? Centralisez vos clients, vos programmes et vos paiements avec l'écosystème Coachency.`;
    const fullUrl = `https://coachency.app/${urlPath}`;

    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Service",
                "serviceType": "Coaching Sportif",
                "provider": {
                    "@type": "Organization",
                    "name": "Coachency"
                },
                "areaServed": {
                    "@type": "City",
                    "name": cityName
                },
                "description": "Plateforme web et mobile de gestion pour les coachs sportifs."
            },
            {
                "@type": "LocalBusiness",
                "name": `Coachency - ${cityName}`,
                "image": "https://coachency.app/app-logo.jpg",
                "description": `Logiciel de coaching sportif pour les professionnels à ${cityName}.`,
                "url": fullUrl,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": cityName,
                    "addressCountry": "CH"
                }
            }
        ]
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-x-hidden">
            <SEO
                title={title}
                description={description}
                url={fullUrl}
                schema={schemaData}
            />

            {/* Floating Header */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4">
                <nav className="w-full max-w-6xl mx-auto rounded-full bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg py-3 px-6 flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px]">
                            <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center">
                                <Zap className="w-4 h-4 text-cyan-400" />
                            </div>
                        </div>
                        Coachency
                    </Link>
                    <div className="flex gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Connexion</Link>
                    </div>
                </nav>
            </div>

            <header className="relative pt-40 pb-20 container mx-auto px-6 z-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                    <MapPin className="w-4 h-4" /> Coachs Sportifs - {cityName}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-[1.1]">
                    Le Système Opérationnel des <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Coachs à {cityName}</span> 🇨🇭
                </h1>
                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light">
                    Gérez vos clients, automatisez vos paiements et offrez une application mobile premium à vos athlètes. Oubliez Excel et WhatsApp.
                </p>

                <Link
                    to="/waitlist"
                    className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                >
                    Accès Prioritaire <ArrowRight className="w-5 h-5" />
                </Link>
            </header>

            <section className="py-20 bg-slate-900 border-t border-white/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Pourquoi Coachency pour les professionnels genevois, lausannois et zurichois ?</h2>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <CheckCircle className="text-blue-500 shrink-0 mt-1" />
                                    <span className="text-slate-300">Abonnements automatiques en CHF via Stripe.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-blue-500 shrink-0 mt-1" />
                                    <span className="text-slate-300">Application mobile dédiée (iOS & Android) pour vos clients.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-blue-500 shrink-0 mt-1" />
                                    <span className="text-slate-300">Création de programmes d'entraînement ultra-rapide.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full"></div>
                            <img src="/dashboard-preview.png" alt="Dashboard Coach" className="w-full rounded-2xl relative z-10 opacity-90" />
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5 pt-12 pb-8 text-center text-slate-500">
                <p>© {new Date().getFullYear()} Coachency. L'application préférée des coachs sportifs suisses.</p>
                <Link to="/" className="text-blue-400 hover:underline text-sm block mt-4">Retour à l'accueil</Link>
            </footer>
        </div>
    );
};

export default CityLandingPage;
