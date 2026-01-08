import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Award, Crown, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  profile_image_url: string | null;
  created_at: string;
}

function ProfilePage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    specialization: '',
    bio: '',
  });
  const { user } = useAuth();
  const { subscriptionInfo } = useSubscription();

  useEffect(() => {
    if (user) {
      fetchCoachData();
    }
  }, [user]);

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
    } catch (error) {
      console.error('Error fetching coach data:', error);
    } finally {
      setLoading(false);
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
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
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
                  <div className="flex items-center gap-4 text-white/80">
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
                className="px-4 py-2 bg-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg text-white"
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
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
                  <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    Prochain renouvellement le {new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscriptionInfo?.type === 'free' && (
                <Link
                  to="/upgrade"
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700"
                >
                  Passer à Pro
                </Link>
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
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;