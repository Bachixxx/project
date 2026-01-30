import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Smartphone, ShieldCheck, Check, Ban as Block } from 'lucide-react';

interface CoachPlan {
    id: string;
    name: string;
    amount: number;
    interval: 'month' | 'year';
    stripe_price_id: string;
}

function Terminal() {
    const { subscriptionInfo, loading: subLoading, subscribeToTerminal } = useSubscription();
    const { user } = useAuth(); // Need user ID for the edge function

    // Active View State
    const [amount, setAmount] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [clientEmail, setClientEmail] = React.useState('');
    const [qrUrl, setQrUrl] = React.useState<string | null>(null);
    const [generating, setGenerating] = React.useState(false);
    const [hasStripeAccount, setHasStripeAccount] = React.useState<boolean | null>(null);
    const [checkingStripe, setCheckingStripe] = React.useState(true);


    // Subscription Mode
    const [paymentMode, setPaymentMode] = React.useState<'one_time' | 'subscription'>('one_time');
    const [plans, setPlans] = React.useState<CoachPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = React.useState<CoachPlan | null>(null);

    React.useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('coach_plans')
            .select('*')
            .eq('coach_id', user?.id)
            .eq('active', true);
        if (data) setPlans(data);
    };

    const handleSubscribe = async () => {
        try {
            await subscribeToTerminal();
        } catch (err) {
            alert("Erreur lors de la redirection vers le paiement.");
        }
    }

    const generatePaymentLink = async () => {
        if (!user || !user.id) {
            alert("Erreur: Utilisateur non trouvé. Essayez de vous reconnecter.");
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Veuillez entrer un montant valide.");
            return;
        }

        try {
            setGenerating(true);
            const payload = {
                coachId: user?.id,
                amount: Number(amount),
                description: description,
                clientEmail: clientEmail,
                mode: paymentMode === 'subscription' ? 'subscription' : 'payment',
                priceId: selectedPlan?.stripe_price_id
            };
            console.log('Sending Payload:', payload);

            const { data, error } = await supabase.functions.invoke('create-terminal-payment', {
                body: payload
            });

            if (error) {
                // Determine if it's a FunctionsHttpError and try to extract body
                let errorMessage = error.message || "Impossible de créer le paiement.";

                try {
                    if ((error as any).context && typeof (error as any).context.json === 'function') {
                        const body = await (error as any).context.json();
                        if (body && body.error) {
                            errorMessage = body.error;
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse error context JSON', e);
                }

                console.error('Edge Function Error:', error);
                throw new Error(errorMessage);
            }

            if (data?.url) {
                setQrUrl(data.url);
            }
        } catch (error: any) {
            console.error('Error generating payment link:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const resetTerminal = () => {
        setQrUrl(null);
        setAmount('');
        setDescription('');
        setClientEmail('');
        setSelectedPlan(null);
    };

    // Check Stripe Connect Status
    React.useEffect(() => {
        const checkStripeStatus = async () => {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('coaches')
                    .select('stripe_account_id')
                    .eq('id', user.id)
                    .single();

                if (!error && data?.stripe_account_id) {
                    setHasStripeAccount(true);
                } else {
                    setHasStripeAccount(false);
                }
            } catch (err) {
                console.error("Error checking checkStripeStatus:", err);
                setHasStripeAccount(false);
            } finally {
                setCheckingStripe(false);
            }
        };
        checkStripeStatus();
    }, [user]);

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
    if (checkingStripe) {
        return <div className="p-8 text-center text-gray-400">Vérification du compte...</div>;
    }

    if (!hasStripeAccount) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="glass-card max-w-lg w-full p-8 mx-auto text-center border-yellow-500/30 shadow-2xl shadow-yellow-500/10">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <CreditCard className="w-8 h-8 text-yellow-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Configuration requise</h2>
                    <p className="text-gray-400 mb-8">
                        Pour encaisser des paiements, vous devez connecter votre compte bancaire (Stripe) sur votre profil.
                    </p>

                    <a
                        href="/profile"
                        className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        Configurer mes paiements
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terminal de Paiement</h1>
            <p className="text-gray-400 mb-8">Encaissez vos clients directement via QR Code.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

                {/* Left Side: Input Form */}
                <div className={`glass-card p-8 transition-all duration-500 ${qrUrl ? 'opacity-50 pointer-events-none blur-[2px]' : ''}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Nouveau Paiement</h3>
                                <p className="text-sm text-gray-400">Générez un lien pour le client</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                        <button
                            onClick={() => { setPaymentMode('one_time'); setAmount(''); setDescription(''); setSelectedPlan(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentMode === 'one_time' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Paiement Unique
                        </button>
                        <button
                            onClick={() => { setPaymentMode('subscription'); setAmount(''); setDescription(''); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentMode === 'subscription' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Abonnement
                        </button>
                    </div>

                    {paymentMode === 'one_time' ? (
                        <div className="space-y-6 animate-fade-in">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email du client (pour reçu)</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="client@email.com"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Choisir une offre</label>
                            {plans.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {plans.map(plan => (
                                        <div
                                            key={plan.id}
                                            onClick={() => {
                                                setSelectedPlan(plan);
                                                setAmount(plan.amount.toString());
                                                setDescription(plan.name);
                                            }}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan?.id === plan.id
                                                ? 'bg-blue-500/20 border-blue-500 relative'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className={`font-bold ${selectedPlan?.id === plan.id ? 'text-blue-400' : 'text-white'}`}>{plan.name}</h4>
                                                {selectedPlan?.id === plan.id && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm text-gray-400">{plan.interval === 'month' ? 'Mensuel' : 'Annuel'}</span>
                                                <span className="font-bold text-white">{plan.amount} CHF</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    <Block className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Aucune offre active.</p>
                                    <a href="/offers" className="text-blue-400 text-sm hover:underline mt-2 inline-block">Créer une offre</a>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email du client (Optionnel)</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="client@email.com"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={generatePaymentLink}
                        disabled={generating || !amount}
                        className={`w-full py-4 mt-8 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${paymentMode === 'one_time'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                            }`}
                    >
                        {generating ? (
                            <span className="loading loading-spinner text-white" />
                        ) : (
                            <>
                                <Smartphone className="w-5 h-5" />
                                {paymentMode === 'one_time' ? 'Générer le QR Code' : 'Abonner le client'}
                            </>
                        )}
                    </button>
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
