import React from 'react';
import { CreditCard } from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';
import { t } from '../i18n';

interface PaymentButtonProps {
  programId: string;
  clientId: string;
  price: number;
  disabled?: boolean;
}

export function PaymentButton({ programId, clientId, price, disabled }: PaymentButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      await createCheckoutSession(programId, clientId);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {loading ? t('common.loading') : `${t('common.pay')} ${price} CHF`}
    </button>
  );
}