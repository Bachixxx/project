import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff';
import { eye } from 'react-icons-kit/feather/eye';
import { LogIn, ChevronLeft, User, Mail, Lock, Activity, Users } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';

import { Capacitor } from '@capacitor/core';

function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordType, setPasswordType] = useState('password');
  const [passwordIcon, setPasswordIcon] = useState(eyeOff);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 flex flex-col font-sans selection:bg-green-500/30 relative overflow-hidden">

      {/* Background Gradients (Green/Teal for Clients) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      {!isNative && (
        <div className="relative z-10 flex items-center justify-between mb-8 max-w-7xl mx-auto w-full pt-4">
          <Link
            to="/"
            className="group flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors border border-white/5">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Retour à l'accueil</span>
          </Link>

          <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2 opacity-80 grayscale sm:grayscale-0 transition-all">
            {/* Client Brand Logo (Optional, using text for now) */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
              <Users className="w-5 h-5" />
            </div>
            Espace Client
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center relative z-10 pb-20">
        <div className="max-w-md w-full animate-fade-in relative">

          {/* Glass Card */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-white/5">

            {/* Inner Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                  <User className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Bonjour !</h2>
                <p className="text-gray-400">Accédez à votre programme et suivez vos progrès</p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 flex items-start gap-3 animate-slide-in">
                  <Activity className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all font-medium"
                      placeholder="client@exemple.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={passwordType}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={handlePasswordToggle}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                    >
                      <Icon icon={passwordIcon} size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
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
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-sm text-gray-400">
                  Pas encore de compte ?{' '}
                  <Link to="/client/check-email" className="font-semibold text-green-400 hover:text-green-300 transition-colors">
                    Activez votre accès
                  </Link>
                </p>
                <div className="mt-4">
                  <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-gray-300 hover:text-white transition-all border border-white/5 hover:border-white/10">
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