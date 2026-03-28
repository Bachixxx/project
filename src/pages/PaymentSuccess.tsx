import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Paiement réussi</h1>
        <p className="text-slate-400 mb-8">Merci ! Votre paiement a bien été enregistré.</p>
        <Link to="/" className="inline-flex px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
