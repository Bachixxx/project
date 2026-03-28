import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

function PaymentCancelled() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <XCircle className="w-10 h-10 text-red-400" style={{ color: '#f87171' }} />
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>
          Paiement annulé
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Le paiement n'a pas été effectué. Aucun montant n'a été débité.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            textDecoration: 'none',
          }}
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default PaymentCancelled;
