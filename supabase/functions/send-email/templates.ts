
export const MASTER_TEMPLATE = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; text-decoration: none; }
    .logo span { color: #06b6d4; }
    .card { background-color: #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #334155; }
    h1 { color: #f8fafc; margin-top: 0; font-size: 24px; margin-bottom: 24px; }
    p { line-height: 1.6; margin-bottom: 24px; color: #cbd5e1; }
    .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
    .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
    .footer a { color: #64748b; text-decoration: underline; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }
    .info-label { color: #94a3b8; }
    .info-value { color: #f8fafc; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://coachency.app" class="logo">Coach<span>ency</span></a>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Coachency. Tous droits réservés.</p>
      <p>
        <a href="https://coachency.app/privacy">Politique de confidentialité</a> • 
        <a href="https://coachency.app/terms">CGU</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export const TEMPLATES = {
  'coach.welcome': (data: Record<string, any>) => ({
    subject: 'Bienvenue sur Coachency ! 🚀',
    html: MASTER_TEMPLATE(`
      <h1>Bienvenue ${data.name} !</h1>
      <p>Nous sommes ravis de vous compter parmi nos coachs. Coachency est conçu pour vous faire gagner du temps et propulser votre activité.</p>
      <p>Pour bien démarrer, nous vous conseillons de :</p>
      <ul style="color: #cbd5e1; margin-bottom: 24px; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Compléter votre profil professionnel</li>
        <li style="margin-bottom: 10px;">Configurer vos offres et tarifs</li>
        <li style="margin-bottom: 10px;">Inviter vos premiers clients</li>
      </ul>
      <div style="text-align: center;">
        <a href="${data.dashboard_url}" class="btn">Accéder à mon Dashboard</a>
      </div>
    `, 'Bienvenue sur Coachency')
  }),

  'client.welcome': (data: Record<string, any>) => ({
    subject: 'Bienvenue sur votre espace client Coachency',
    html: MASTER_TEMPLATE(`
      <h1>Votre espace personnel est prêt</h1>
      <p>Bonjour ${data.name},</p>
      <p>Votre compte client a été créé avec succès. Vous pouvez désormais accéder à vos programmes, suivre vos progrès et échanger avec votre coach.</p>
      <div style="text-align: center;">
        <a href="${data.dashboard_url}" class="btn">Accéder à mon Espace</a>
      </div>
    `, 'Bienvenue Client')
  }),

  'client.invite': (data: Record<string, any>) => ({
    subject: `${data.coach_name} vous invite sur Coachency`,
    html: MASTER_TEMPLATE(`
      <h1>Invitation de ${data.coach_name}</h1>
      <p>Bonjour ${data.client_name || ''},</p>
      <p>Votre coach utilise Coachency pour gérer ses suivis et vous invite à rejoindre sa plateforme.</p>
      <p>En acceptant cette invitation, vous aurez accès à :</p>
      <ul style="color: #cbd5e1; margin-bottom: 24px; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Vos programmes d'entraînement interactifs</li>
        <li style="margin-bottom: 10px;">Votre calendrier de séances</li>
        <li style="margin-bottom: 10px;">Un chat direct avec votre coach</li>
      </ul>
      <div style="text-align: center;">
        <a href="${data.invite_url}" class="btn">Accepter l'invitation</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 20px; text-align: center;">Ce lien n'expire pas.</p>
    `, 'Invitation Client')
  }),

  'session.confirm': (data: Record<string, any>) => ({
    subject: 'Confirmation de séance : ' + data.date,
    html: MASTER_TEMPLATE(`
      <h1>Séance confirmée ✅</h1>
      <p>Votre séance est bien programmée.</p>
      
      <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${data.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Heure</span>
          <span class="info-value">${data.time}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Type</span>
          <span class="info-value">${data.type}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${data.dashboard_url}" class="btn">Voir ma séance</a>
      </div>
    `, 'Séance Confirmée')
  }),

  'payment.receipt': (data: Record<string, any>) => ({
    subject: `Reçu de paiement - ${data.amount}`,
    html: MASTER_TEMPLATE(`
      <h1>Paiement reçu</h1>
      <p>Merci ! Votre paiement a été validé avec succès.</p>
      
      <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <div class="info-row">
          <span class="info-label">Montant</span>
          <span class="info-value">${data.amount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${data.date}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Référence</span>
          <span class="info-value">${data.invoice_id}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${data.dashboard_url}" class="btn">Télécharger la facture</a>
      </div>
    `, 'Reçu de Paiement')
  })
};
