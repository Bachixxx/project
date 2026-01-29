import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { CreditCard, Smartphone, ShieldCheck, Check } from 'lucide-react';

function Terminal() {
    const { subscriptionInfo, loading: subLoading, subscribeToTerminal } = useSubscription();

    const handleSubscribe = async () => {
        try {
            await subscribeToTerminal();
        } catch (err) {
            alert("Erreur lors de la redirection vers le paiement.");
        }
    }

    if (subLoading) {
        return <div className="p-8 text-center text-gray-400">Chargement...</div>;
    }

    // Lock Screen if not subscribed
    if (!subscriptionInfo?.hasTerminal) {
        return (
            <div className="container mx-auto px-4 py-8 relative min-h-[80vh] flex flex-col items-center justify-center">
                {/* Blurred Background Content */}
                <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none filter blur-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-6 h-64"></div>
                        <div className="rounded-[2.5rem] h-[600px] w-[320px] bg-gray-900 mx-auto"></div>
                    </div>
                </div>

                <div className="glass-card max-w-lg w-full p-8 relative z-10 text-center border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <Smartphone className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Terminal Sans Contact</h2>
                    <p className="text-gray-400 mb-8">
                        Transformez votre smartphone en terminal de paiement. Encaissez vos clients en personne, sans matériel supplémentaire.
                    </p>

                    <ul className="text-left space-y-3 mb-8 bg-white/5 p-6 rounded-xl border border-white/10">
                        <li className="flex items-center gap-3 text-sm text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><Check className="w-3 h-3" /></div>
                            Tap to Pay sur iPhone et Android
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><CreditCard className="w-3 h-3" /></div>
                            Acceptez cartes et portefeuilles numériques
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><ShieldCheck className="w-3 h-3" /></div>
                            Paiements sécurisés par Stripe
                        </li>
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        Activer le Terminal (9.90 CHF / mois)
                    </button>
                    <p className="text-xs text-gray-500 mt-4">Annulable à tout moment</p>
                </div>
            </div>
        );
    }

    // Active View
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terminal de Paiement</h1>
            <p className="text-gray-400 mb-8">Encaissez vos clients directement.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Placeholder for Terminal Interface */}
                <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 animate-pulse">
                        <Smartphone className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Prêt à encaisser</h3>
                    <p className="text-gray-400 max-w-sm">
                        Cette fonctionnalité sera bientôt disponible directement dans l'application. En attendant, utilisez votre Dashboard Stripe pour les paiements manuels.
                    </p>
                    <a
                        href="https://dashboard.stripe.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                    >
                        Ouvrir Stripe Dashboard
                    </a>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Transactions Récentes</h3>
                    <div className="text-center py-12 text-gray-500">
                        Aucune transaction récente via le terminal.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Terminal;
