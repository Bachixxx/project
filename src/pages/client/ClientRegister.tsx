import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, ChevronLeft } from 'lucide-react';
import { Icon } from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff';
import { eye } from 'react-icons-kit/feather/eye';
import { supabase } from '../../lib/supabase';

function ClientRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [coachCode, setCoachCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInviteFlow, setIsInviteFlow] = useState(false);

  useEffect(() => {
    // Check if email was passed from check-email (Invite Flow)
    const state = location.state as { email?: string };
    if (state?.email) {
      setEmail(state.email);
      setIsInviteFlow(true);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Create Auth User
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            coach_code: coachCode || null,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message === 'User already registered') {
          navigate('/client/login', {
            state: {
              email,
              message: 'Un compte existe déjà avec cet email. Veuillez vous connecter.'
            }
          });
          return;
        }
        throw signUpError;
      }

      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // 2. Client Profile Handling
      if (isInviteFlow) {
        // INVITE FLOW: Update existing placeholder client
        const { data: updateData, error: updateError } = await supabase
          .rpc('update_client_auth_id', {
            p_email: email,
            p_auth_id: authData.user.id,
            p_full_name: fullName || null // Update name if provided? simplified to null as before if hidden
          });

        if (updateError) throw updateError;
      } else {
        // SELF-REGISTER FLOW: Create new client profile
        const { error: insertError } = await supabase
          .from('clients')
          .insert({
            auth_id: authData.user.id,
            email: email,
            full_name: fullName,
            status: 'active' // Default status
          });

        if (insertError) throw insertError;

        // 3. Link Coach if Code provided (Only for self-register usually)
        if (coachCode) {
          const { data: linkResult, error: linkError } = await supabase
            .rpc('link_client_to_coach', { p_code: coachCode });

          if (linkError) {
            console.error('Error linking coach:', linkError);
            // Don't block registration, just warn? Or maybe silent fail.
          }
        }
      }

      navigate('/client/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour à l'accueil
        </Link>
      </div>
      <div className="flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8 animate-fade-in">
          <div className="text-center mb-8">
            <LogIn className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Créer un compte client</h2>
            <p className="text-white/70 mt-2">
              {isInviteFlow ? 'Finalisez votre inscription' : 'Rejoignez Coachency'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-200 p-4 rounded-lg mb-6 border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isInviteFlow && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white/90">
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="Votre nom"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={isInviteFlow ? undefined : (e) => setEmail(e.target.value)}
                disabled={isInviteFlow}
                className={`mt-1 block w-full rounded-lg bg-white/5 border border-white/20 shadow-sm ${isInviteFlow ? 'text-white/50 cursor-not-allowed' : 'text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                required
              />
            </div>

            {!isInviteFlow && (
              <div>
                <label htmlFor="coachCode" className="block text-sm font-medium text-white/90">
                  Code Coach (Optionnel)
                </label>
                <input
                  id="coachCode"
                  type="text"
                  value={coachCode}
                  onChange={(e) => setCoachCode(e.target.value.toUpperCase())}
                  className="mt-1 input-field font-mono"
                  placeholder="Ex: JEREMY-1234"
                />
                <p className="text-xs text-gray-500 mt-1">Si vous avez un code fourni par votre coach</p>
              </div>
            )}

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Mot de passe
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 input-field pr-10"
                placeholder="Choisissez un mot de passe"
                minLength={6}
              />
              <span
                className="absolute right-3 top-9 cursor-pointer text-white/60 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                <Icon icon={showPassword ? eye : eyeOff} size={16} />
              </span>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 input-field pr-10"
                placeholder="Confirmez votre mot de passe"
              />
              <span
                className="absolute right-3 top-9 cursor-pointer text-white/60 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon icon={showConfirmPassword ? eye : eyeOff} size={16} />
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full primary-button"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center text-white/80">
            <p className="text-sm">
              Déjà un compte ?{' '}
              <Link to="/client/login" className="font-medium text-primary-400 hover:text-primary-300">
                Connexion client
              </Link>
            </p>
            <p className="mt-2 text-sm">
              Vous êtes un coach ?{' '}
              <Link to="/register" className="font-medium text-primary-400 hover:text-primary-300">
                Créer un compte coach
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientRegister;