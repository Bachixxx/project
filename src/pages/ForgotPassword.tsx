import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ChevronLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await resetPassword(email);
            setSubmitted(true);
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 flex flex-col font-sans selection:bg-blue-500/30 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-8 max-w-7xl mx-auto w-full pt-4">
                <Link
                    to="/login"
                    className="group flex items-center text-gray-400 hover:text-white transition-colors"
                >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors border border-white/5">
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Retour à la connexion</span>
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center relative z-10 pb-20">
                <div className="max-w-md w-full animate-fade-in relative">
                    <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-white/5">

                        {!submitted ? (
                            <>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                                        <Mail className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Mot de passe oublié ?</h2>
                                    <p className="text-gray-400">Entrez votre email pour recevoir les instructions de réinitialisation.</p>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                            Email
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                                placeholder="votre@email.com"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Envoyer le lien</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">Email envoyé !</h2>
                                <p className="text-gray-400 mb-8">
                                    Si un compte existe pour {email}, vous recevrez un lien de réinitialisation dans quelques instants.
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Retour à la connexion
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
