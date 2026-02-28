import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function SubscriptionAlert() {
  const { subscriptionInfo } = useSubscription();
  const { user } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user?.created_at && subscriptionInfo?.type === 'free') {
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 14 - diffDays);
      setDaysRemaining(remaining);
    }
  }, [user, subscriptionInfo]);

  if (!subscriptionInfo || subscriptionInfo.type === 'paid' || daysRemaining === null) {
    return null;
  }

  return (
    <div className="bg-primary-500/10 backdrop-blur-lg border border-primary-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-primary-500">Période d'essai gratuit</h3>
          <p className="text-primary-400 text-sm mt-1">
            Il vous reste {daysRemaining} jour{daysRemaining !== 1 ? 's' : ''} d'essai gratuit pour profiter de toutes les fonctionnalités.
            Aucune limite de clients pendant cette période.
          </p>
        </div>
        <Link
          to="/pricing"
          className="text-sm font-medium text-primary-500 hover:text-primary-400 whitespace-nowrap hidden sm:block"
        >
          S'abonner
        </Link>
      </div>
    </div>
  );
}