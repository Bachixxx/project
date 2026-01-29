import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
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
    const [amount, setAmount] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [qrUrl, setQrUrl] = React.useState<string | null>(null);
    const [generating, setGenerating] = React.useState(false);
    const { user } = useAuth(); // Need user ID for the edge function

    const generatePaymentLink = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Veuillez entrer un montant valide.");
            return;
        }

        try {
            setGenerating(true);
            const { data, error } = await supabase.functions.invoke('create-terminal-payment', {
                body: {
                    coachId: user?.id,
                    amount: Number(amount),
                    description: description
                }
            });

            if (error) throw error;
            if (data?.url) {
                setQrUrl(data.url);
            }
        } catch (error) {
            console.error('Error generating payment link:', error);
            alert("Erreur lors de la création du paiement.");
        } finally {
            setGenerating(false);
        }
    };

    const resetTerminal = () => {
        setQrUrl(null);
        setAmount('');
        setDescription('');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terminal de Paiement</h1>
            <p className="text-gray-400 mb-8">Encaissez vos clients directement via QR Code.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

                {/* Left Side: Input Form */}
                <div className={`glass-card p-8 transition-all duration-500 ${qrUrl ? 'opacity-50 pointer-events-none blur-[2px]' : ''}`}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Nouveau Paiement</h3>
                            <p className="text-sm text-gray-400">Générez un lien de paiement unique</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Montant (CHF)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">CHF</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-16 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-600"
                                    placeholder="0.00"
                                    min="1"
                                    step="0.5"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optionnel)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="Ex: Séance privée, Matériel..."
                            />
                        </div>

                        <button
                            onClick={generatePaymentLink}
                            disabled={generating || !amount}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <span className="loading loading-spinner text-white" />
                            ) : (
                                <>
                                    <Smartphone className="w-5 h-5" />
                                    Générer le QR Code
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Side: QR Code Display for Client */}
                <div className="relative">
                    {!qrUrl ? (
                        // Empty State / Placeholder
                        <div className="h-full min-h-[400px] glass-card p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 bg-white/5">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4 rotate-12">
                                <Smartphone className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-500 mb-2">En attente</h3>
                            <p className="text-gray-600 max-w-xs">
                                Entrez un montant à gauche pour générer le QR Code de paiement.
                            </p>
                        </div>
                    ) : (
                        // Active QR Code State
                        <div className="h-full glass-card p-8 flex flex-col items-center justify-center text-center bg-white relative overflow-hidden animate-fade-in">
                            {/* Success Banner */}
                            <div className="absolute top-0 left-0 w-full bg-emerald-600 text-white py-2 text-sm font-bold uppercase tracking-widest">
                                Prêt à scanner
                            </div>

                            <div className="mt-8 mb-6 relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                                <div className="relative bg-white p-4 rounded-2xl shadow-2xl border border-gray-100">
                                    <QRCodeSVG value={qrUrl} size={256} className="w-64 h-64" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{Number(amount).toFixed(2)} CHF</h3>
                            <p className="text-gray-500 mb-8">{description || 'Paiement sans contact'}</p>

                            <div className="flex items-center gap-3 text-gray-400 mb-8">
                                <span className="flex items-center gap-1 text-xs uppercase font-bold tracking-wider"><Check className="w-3 h-3" /> Apple Pay</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="flex items-center gap-1 text-xs uppercase font-bold tracking-wider"><Check className="w-3 h-3" /> Google Pay</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="flex items-center gap-1 text-xs uppercase font-bold tracking-wider"><Check className="w-3 h-3" /> Carte</span>
                            </div>

                            <button
                                onClick={resetTerminal}
                                className="px-6 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors text-sm"
                            >
                                Annuler / Nouveau paiement
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Terminal;
