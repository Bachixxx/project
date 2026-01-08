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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Récupérer l'email de l'état de navigation
    const state = location.state as { email?: string };
    if (!state?.email) {
      // Si pas d'email, rediriger vers la vérification
      navigate('/client/check-email');
      return;
    }
    setEmail(state.email);
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Créer le compte utilisateur
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // Si l'utilisateur existe déjà, rediriger vers la connexion
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

      // Lier le compte au client (email should already be in clients table from invitation)
      const { data: updateData, error: updateError } = await supabase
        .rpc('update_client_auth_id', {
          p_email: email,
          p_auth_id: authData.user.id,
          p_full_name: null
        });

      if (updateError) {
        console.error("Error updating client auth_id:", updateError);
        throw updateError;
      }
      
      if (!updateData || !updateData.success) {
        console.error("Failed to update client auth_id:", updateData);
        throw new Error(updateData?.message || "Erreur lors de la mise à jour du compte client");
      }
      
      console.log("Client registration successful, redirecting to dashboard");

      // Rediriger vers le tableau de bord client
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
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-4 rounded-lg mb-6 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-1 block w-full rounded-lg bg-white/5 border border-white/20 shadow-sm text-white/50"
            />
          </div>

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