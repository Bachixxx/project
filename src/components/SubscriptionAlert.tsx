import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionAlert() {
  const { subscriptionInfo } = useSubscription();

  if (!subscriptionInfo || subscriptionInfo.type === 'paid') {
    return null;
  }

  const remainingClients = subscriptionInfo.clientLimit - subscriptionInfo.currentClients;

  return (
    <div className="bg-yellow-500/10 backdrop-blur-lg border border-yellow-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-yellow-500">Limitations du compte gratuit</h3>
          <p className="text-yellow-500/80 text-sm mt-1">
            Vous pouvez ajouter {remainingClients} client{remainingClients !== 1 ? 's' : ''} supplémentaire{remainingClients !== 1 ? 's' : ''} avec votre compte gratuit.
            Passez à un abonnement payant pour obtenir des clients illimités et accéder à toutes les fonctionnalités.
          </p>
        </div>
      </div>
    </div>
  );
}