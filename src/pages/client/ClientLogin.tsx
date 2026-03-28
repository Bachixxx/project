import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff';
import { eye } from 'react-icons-kit/feather/eye';
import { LogIn, ChevronLeft, User, Mail, Lock, Activity, Users } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';

function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordType, setPasswordType] = useState('password');
  const [passwordIcon, setPasswordIcon] = useState(eyeOff);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();
  const { signIn, client, isPasswordRecovery } = useClientAuth();

  useEffect(() => {
    // Check for recovery mode immediately from URL hash
    if (window.location.hash.includes('type=recovery') || isPasswordRecovery) {
      navigate('/update-password');
      return;
    }

    if (client) {
      navigate('/client/dashboard');
    }
  }, [client, navigate, isPasswordRecovery]);

  const handlePasswordToggle = () => {
    if (passwordType === 'password') {
      setPasswordIcon(eye);
      setPasswordType('text');
    } else {
      setPasswordIcon(eyeOff);
      setPasswordType('password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setResendSuccess(false);
      setLoading(true);
      const { error } = await signIn({ email, password });
      if (error) throw error;
      navigate('/client/dashboard');
    } catch (err) {
      setError('Échec de la connexion. Vérifiez vos identifiants ou contactez votre coach.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await supabase.functions.invoke('resend-invitation', {
        body: { email },
      });
      // Always show success — the function never reveals if the email exists
      setResendSuccess(true);
      setError('');
    } catch {
      setError("Erreur lors de l'envoi. Réessayez plus tard.");
    } finally {
      setResending(false);
    }
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-slate-950 p-4 flex flex-col font-sans selection:bg-green-500/30 relative overflow-x-hidden">

      {/* Dynamic Background Gradients (Green/Teal for Clients) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-600/10 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-green-600/5 rounded-full blur-[150px] mix-blend-screen opacity-50"></div>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
      </div>

      {/* Header */}
      {!isNative && (
        <div className="relative z-10 flex items-center justify-between mb-8 max-w-7xl mx-auto w-full pt-4 px-4 md:px-6">
          <Link
            to="/"
            className="group flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors border border-white/5">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Retour à l'accueil</span>
          </Link>

          <div className="text-xl font-bold text-white flex items-center gap-2 group cursor-default">
            {/* Client Brand Logo (Optional, using text for now) */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-400 p-[1px] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-shadow">
              <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <span className="tracking-tight hidden sm:block text-slate-200">Espace Client</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center relative z-10 pb-20 mt-8">
        <div className="w-full max-w-[26rem] mx-auto animate-fade-in relative px-2">

          {/* Glass Card */}
          <div className="relative rounded-[2.5rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-1 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform z-10 group overflow-hidden">

            {/* Animated gradient border container */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>

            <div className="relative bg-slate-950/50 rounded-[2.4rem] p-8 md:p-10 h-full flex flex-col">

              {/* Inner Top Glow */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none rounded-t-[2.4rem]"></div>

              <div className="text-center mb-8 relative z-10 mt-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                  <User className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold md:text-4xl text-white mb-2 tracking-tight">Bonjour !</h2>
                <p className="text-slate-400 font-light text-sm">Accédez à votre programme et suivez vos progrès</p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 flex items-start gap-3 animate-slide-in relative z-10 backdrop-blur-md">
                  <Activity className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {resendSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6 relative z-10 backdrop-blur-md text-center">
                  Si un compte existe avec cet email, un nouveau lien d'invitation a été envoyé.
                </div>
              )}

              {error && !resendSuccess && email && (
                <div className="text-center mb-4 relative z-10">
                  <button
                    type="button"
                    onClick={handleResendInvitation}
                    disabled={resending}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors underline disabled:opacity-50"
                  >
                    {resending ? 'Envoi en cours...' : "Invitation expirée ? Recevoir un nouveau lien"}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10 w-full max-w-[22rem] mx-auto">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Email
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none z-10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-slate-900/80 transition-all font-medium shadow-inner"
                      placeholder="client@exemple.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Mot de passe
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none z-10">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={passwordType}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-slate-900/80 transition-all font-medium shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={handlePasswordToggle}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 z-10"
                    >
                      <Icon icon={passwordIcon} size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1 pb-2">
                  <Link to="/forgot-password" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] relative overflow-hidden group/btn disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>

                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Connexion...</span>
                      </>
                    ) : (
                      <>
                        <span>Se connecter</span>
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
                <p className="text-sm text-slate-400 font-light">
                  Pas encore de compte ?{' '}
                  <Link to="/client/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                    Activez votre accès
                  </Link>
                </p>
                <div className="mt-6 flex justify-center">
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all shadow-sm">
                    Accéder à l'espace Coach
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientLogin;