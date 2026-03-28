import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dumbbell, Send, CheckCircle, ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

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
                    setStatus('success'); // Treat duplicate as success
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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
            <SEO
                title="Liste d'Attente | Coachency - Accès Prioritaire"
                description="Rejoignez la liste d'attente Coachency pour obtenir un accès prioritaire à la plateforme tout-en-un pour coachs sportifs. Inscription gratuite par email."
                url="https://coachency.app/waitlist"
            />
            {/* Dynamic Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[150px] mix-blend-screen opacity-50"></div>
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
            </div>

            {/* Floating Back Link */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
                <Link
                    to="/"
                    className="group flex items-center text-slate-400 hover:text-white transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors border border-white/5">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">Retour</span>
                </Link>
            </div>

            <div className="relative z-10 w-full max-w-md pt-12 md:pt-0">

                {status !== 'success' && (
                    <div className="text-center mb-8 animate-fade-in relative">
                        <div className="inline-flex justify-center items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles className="w-3.5 h-3.5" />
                            Accès Restreint
                        </div>

                        <div className="flex justify-center mb-4 cursor-default">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                                <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
                                    <Dumbbell className="w-6 h-6 text-cyan-400" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Ouverture Prochaine</h1>
                        <p className="text-slate-400 text-base font-light px-2">
                            Nous finalisons les derniers détails. Rejoignez la liste d'attente pour obtenir un accès prioritaire à Coachency.
                        </p>
                    </div>
                )}

                <div className="animate-fade-in relative z-10">
                    <div className="relative rounded-[2.5rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-1 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform overflow-hidden">

                        {/* Animated gradient border container */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>

                        <div className="relative bg-slate-950/50 rounded-[2.4rem] p-8 md:p-10 h-full flex flex-col">

                            {/* Inner Top Glow */}
                            <div className={`absolute top-0 inset-x-0 h-40 pointer-events-none rounded-t-[2.4rem] transition-colors duration-1000 ${status === 'success' ? 'bg-gradient-to-b from-emerald-500/10 to-transparent' : 'bg-gradient-to-b from-blue-500/10 to-transparent'}`}></div>

                            {status === 'success' ? (
                                <div className="text-center py-6 animate-fade-in relative z-10">
                                    {/* Success Glow Behind Checkmark */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none"></div>

                                    <div className="relative w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">C'est noté !</h3>
                                    <p className="text-slate-400 font-light mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
                                        Vous êtes sur la liste. Vous serez notifié en priorité dès que Coachency ouvrira ses portes.
                                    </p>
                                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-white/5 hover:border-white/10 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all shadow-sm">
                                        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                                            Email professionnel
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors pointer-events-none z-10">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="coach@exemple.com"
                                                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-900/80 transition-all font-medium shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {status === 'error' && (
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-in relative z-10 backdrop-blur-md">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base text-center shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all transform hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] relative overflow-hidden group/btn disabled:opacity-50 disabled:pointer-events-none mt-2"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>

                                        <div className="relative z-10 flex items-center justify-center gap-2">
                                            {status === 'loading' ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Rejoindre la liste <Send className="w-4 h-4 ml-1" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {status !== 'success' && (
                    <div className="text-center mt-10 relative z-10">
                        <Link to="/client/login" className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors">
                            Déjà client ? Accédez à l'espace membre
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Waitlist;
