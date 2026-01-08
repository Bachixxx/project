import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { t } from '../i18n';

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export function UpgradeModal({ onClose, onUpgrade }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold">Limite de clients atteinte</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Vous avez atteint le nombre maximum de clients autorisés avec votre compte gratuit.
            Passez au plan Pro pour ajouter des clients illimités et accéder à toutes les fonctionnalités premium.
          </p>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Passer à Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}