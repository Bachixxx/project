import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

function PaymentSuccess() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <CheckCircle className="w-10 h-10 text-emerald-400" style={{ color: '#34d399' }} />
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>
          Paiement réussi
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Merci ! Votre paiement a bien été enregistré.
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

export default PaymentSuccess;
