import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Award, Crown, Clock, BadgeEuro, ExternalLink, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { createPortalSession, createLoginLink, getStripeAccountStatus } from '../lib/stripe';
import { ResponsiveModal } from '../components/ResponsiveModal';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  profile_image_url: string | null;
  created_at: string;
  stripe_account_id?: string;
}

function ProfilePage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{ detailsSubmitted: boolean; payoutsEnabled: boolean } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    specialization: '',
    bio: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user } = useAuth();
  const { subscriptionInfo } = useSubscription();

  useEffect(() => {
    if (user) {
      fetchCoachData();
    }
  }, [user]);

  // Handle Stripe Connect Return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get('stripe_connect');

    if (stripeStatus === 'success') {
      // Clear URL param
      window.history.replaceState({}, '', '/profile');
      alert("Félicitations ! Votre compte de paiement est connecté. Vous pouvez maintenant recevoir des paiements.");
      fetchCoachData(); // Refresh to get the stripe_account_id if updated
    } else if (stripeStatus === 'refresh') {
      window.history.replaceState({}, '', '/profile');
      alert("La configuration a été interrompue. Veuillez réessayer.");
    }
  }, []);

  const fetchCoachData = async () => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setCoach(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        specialization: data.specialization || '',
        bio: data.bio || '',
      });

      // Fetch Stripe Status if account exists
      if (data.stripe_account_id) {
        try {
          const status = await getStripeAccountStatus();
          setStripeStatus(status);
        } catch (err) {
          console.error("Failed to fetch stripe status", err);
        }
      }
    } catch (error) {
      console.error('Error fetching coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setStripeLoading(true);
      const { data, error } = await supabase.functions.invoke('create-connect-account');

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Pas d'URL de redirection reçue");
      }
    } catch (err: any) {
      console.error("Stripe Connect Error:", err);
      alert("Erreur lors de la connexion Stripe: " + (err.message || "Erreur inconnue"));
    } finally {
      setStripeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await createPortalSession();
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Impossible d\'ouvrir le portail de gestion. Veuillez réessayer.');
    }
  };


  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;

      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      console.error('Delete Account Error:', err);
      alert('Erreur lors de la suppression du compte: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('coaches')
        .update(formData)
        .eq('id', user?.id);

      if (error) throw error;
      setIsEditing(false);
      fetchCoachData();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour au tableau de bord
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Profile Header */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  {coach?.profile_image_url ? (
                    <img
                      src={coach.profile_image_url}
                      alt={coach.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {coach?.full_name}
                  </h1>
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-white/80">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {coach?.email}
                    </span>
                    {coach?.phone && (
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {coach.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg text-white"
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 text-center md:text-left">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Crown className="w-5 h-5" />
                  Abonnement
                </h2>
                <p className="text-white/80">
                  {subscriptionInfo?.type === 'paid' ? (
                    'Abonnement Pro actif'
                  ) : (
                    'Compte gratuit'
                  )}
                </p>
                {subscriptionInfo?.type === 'paid' && subscriptionInfo.subscriptionEnd && (
                  <p className="text-white/60 text-sm flex items-center justify-center md:justify-start gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    Prochain renouvellement le {new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscriptionInfo?.type === 'free' ? (
                <Link
                  to="/upgrade"
                  className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 text-center"
                >
                  Passer à Pro
                </Link>
              ) : (
                <button
                  onClick={handleManageSubscription}
                  className="w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Gérer l'abonnement
                </button>
              )}
            </div>
          </div>

          {/* Business & Payments Section (New) */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 text-center md:text-left">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                  <BadgeEuro className="w-5 h-5" />
                  Paiements & Encaissement
                </h2>
                <p className="text-white/80">
                  {coach?.stripe_account_id ? (
                    'Votre compte de paiement est actif. Vous pouvez recevoir des fonds.'
                  ) : (
                    'Connectez votre compte bancaire pour recevoir les paiements de vos clients.'
                  )}
                </p>
              </div>

              {coach?.stripe_account_id && stripeStatus?.detailsSubmitted ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Compte Connecté</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setStripeLoading(true);
                        await createLoginLink();
                      } catch (error: any) {
                        console.error("Login Link Error:", error);
                        alert(`Impossible d'accéder au tableau de bord Stripe: ${error.message || 'Erreur inconnue'}`);
                      } finally {
                        setStripeLoading(false);
                      }
                    }}
                    disabled={stripeLoading}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {stripeLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Gérer mon compte</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : coach?.stripe_account_id ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Configuration Incomplète</span>
                  </div>
                  <button
                    onClick={handleConnectStripe}
                    disabled={stripeLoading}
                    className="px-4 py-2 bg-[#635BFF] hover:bg-[#5851df] text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {stripeLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Terminer la configuration</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectStripe}
                  disabled={stripeLoading}
                  className="w-full md:w-auto px-4 py-2 bg-[#635BFF] hover:bg-[#5851df] text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {stripeLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Configurer les paiements</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Spécialisation
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 space-y-6">
              {coach?.specialization && (
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Spécialisation
                  </h3>
                  <p className="text-white">{coach.specialization}</p>
                </div>
              )}

              {coach?.bio && (
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-2">Bio</h3>
                  <p className="text-white whitespace-pre-wrap">{coach.bio}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-white/80 mb-2">Membre depuis</h3>
                <p className="text-white">
                  {new Date(coach?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* DANGER ZONE - Only verify not editing */}
          {!isEditing && (
            <div className="bg-red-500/5 border border-red-500/20 backdrop-blur-lg rounded-xl p-6 mt-8">
              <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Zone de Danger
              </h2>
              <p className="text-gray-400 mb-6">
                La suppression de votre compte est irréversible. Toutes vos données, vos clients et vos abonnements seront définitivement supprimés.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ResponsiveModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title="Supprimer le compte ?"
      >
        <div className="p-4 space-y-4">
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <p className="text-sm text-red-200">
              Cette action est irréversible. Vos clients perdront l'accès à vos programmes et votre abonnement sera annulé.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Pour confirmer, tapez <span className="font-bold text-white">DELETE</span> ci-dessous :
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="DELETE"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || deleteLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {deleteLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmer la suppression</span>
                </>
              )}
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </div >
  );
}

export default ProfilePage;