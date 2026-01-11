import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dumbbell, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Waitlist = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const { error } = await supabase
                .from('waitlist')
                .insert({ email });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setStatus('success'); // Treat duplicate as success to avoid leaking info, or simple message
                    // efficient approach: just say success
                } else {
                    throw error;
                }
            }
            setStatus('success');
        } catch (error) {
            console.error('Error joining waitlist:', error);
            setStatus('error');
            setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <Dumbbell className="w-5 h-5" />
                        </div>
                        Coachency
                    </Link>

                    <h1 className="text-4xl font-bold text-white mb-4">Ouverture Prochaine</h1>
                    <p className="text-gray-400 text-lg">
                        Nous finalisons les derniers détails. Rejoignez la liste d'attente pour obtenir un accès prioritaire.
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
                    {status === 'success' ? (
                        <div className="text-center py-8 animate-fade-in">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">C'est noté !</h3>
                            <p className="text-gray-400 mb-6">
                                Vous serez notifié dès que Coachency ouvrira ses portes.
                            </p>
                            <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email professionnel
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="coach@exemple.com"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>

                            {status === 'error' && (
                                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Rejoindre la liste <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="text-center mt-8">
                    <Link to="/client/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                        Déjà client ? Accéder à l'espace membre
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Waitlist;
