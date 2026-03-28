export default function PaymentCancelled() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#f87171' }}>&#10007;</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>
          Paiement annulé
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Le paiement n'a pas été effectué. Aucun montant n'a été débité.
        </p>
        <a href="/" style={{ color: '#34d399', textDecoration: 'underline' }}>
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
