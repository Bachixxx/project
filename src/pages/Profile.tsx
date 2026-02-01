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
  // ... existing state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ... (existing fetchCoachData, etc.)

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

  if (loading) {
    // ... existing loading state
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ... existing header and back link ... */}

        <div className="grid gap-6">
          {/* ... existing profile sections ... */}

          {/* Business & Payments Section */}
          {/* ... existing code ... */}

          {/* Profile Form (Editing Mode) or Display Mode */}
          {/* ... existing code ... */}

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
    </div>
  );
}