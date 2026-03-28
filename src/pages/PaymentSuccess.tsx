export default function PaymentSuccess() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>&#10003;</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>
          Paiement réussi
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Merci ! Votre paiement a bien été enregistré.
        </p>
        <a href="/" style={{ color: '#34d399', textDecoration: 'underline' }}>
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
