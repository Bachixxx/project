import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function Privacy() {
  return (
    <div className="min-h-screen bg-[#09090b] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Politique de confidentialité
          </h1>
          <div className="text-sm text-gray-600 mb-8">
            Dernière mise à jour : 13 février 2025
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1. Délégué à la protection des données (DPO) et contact
              </h2>
              <p className="text-gray-600">
                Pour toute question relative à la protection des données, vous pouvez contacter notre responsable à : coachency@gmail.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Données collectées
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Données d'identité et de contact :</strong> Nom, prénom, adresse email.</li>
                <li><strong>Données de santé et biométriques (sensibles) :</strong> Âge, poids, mensurations, historique d'entraînement et photos de progression.</li>
                <li><strong>Données de paiement :</strong> Informations transactionnelles liées aux abonnements.</li>
                <li><strong>Données techniques :</strong> Adresse IP, type d'appareil, logs de connexion, utilisées pour des raisons de sécurité et d'amélioration du service.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                3. Base légale du traitement des données
              </h2>
              <p className="text-gray-600 mb-4">
                Le traitement des données repose sur :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>L'exécution du contrat entre l'utilisateur et Coachency.app.</li>
                <li><strong>Le consentement explicite</strong> des utilisateurs, notamment indispensable pour le traitement des données sensibles relatives à la santé physique et aux mensurations.</li>
                <li>L'obligation légale (ex. : respect des règles fiscales et comptables suisses).</li>
                <li>L'intérêt légitime pour assurer la sécurité et l'amélioration des services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                4. Utilisation des données
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Les informations sont utilisées pour optimiser le suivi personnel, la création de programmes et la gestion globale du coaching.</li>
                <li>Coachency.app ne vend ni ne loue jamais vos données personnelles à des tiers.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                5. Sous-traitants et partage des données
              </h2>
              <p className="text-gray-600 mb-4">
                Pour fournir ses services, Coachency.app fait appel à des prestataires de confiance (sous-traitants) qui traitent les données en notre nom :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Hébergement et base de données :</strong> AWS (serveurs à Zurich, Suisse) et Supabase.</li>
                <li><strong>Paiements et facturation :</strong> Stripe (pour le traitement sécurisé des paiements).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                6. Transferts internationaux de données
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>La majorité des données sont stockées en Suisse (Zurich) sur des serveurs Cloud sécurisés.</li>
                <li>Tout transfert de données hors de la Suisse (ou de l'UE) s'effectue dans le strict respect de la LPD et du RGPD, moyennant des garanties de protection adéquates.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                7. Durée de conservation
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Les données personnelles et de santé sont conservées tant que le compte est actif.</li>
                <li>En cas de suppression de compte, les données liées au profil sont effacées dans un délai maximal de 30 jours.</li>
                <li>Cependant, conformément aux obligations légales suisses (Code des obligations - CO), les données liées à la facturation et aux transactions sont conservées pendant <strong>10 ans</strong>.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                8. Droits des utilisateurs
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Accès et rectification :</strong> Vous pouvez consulter ou modifier vos données depuis votre espace personnel.</li>
                <li><strong>Suppression et Oubli :</strong> Vous pouvez demander la suppression définitive de vos données à coachency@gmail.com.</li>
                <li><strong>Retrait du consentement :</strong> Vous pouvez retirer à tout moment votre consentement concernant l'utilisation de vos données santé. Cela impliquera l'impossibilité d'utiliser certaines fonctionnalités de l'application.</li>
                <li><strong>Portabilité :</strong> Vous pouvez obtenir une copie de vos données dans un format structuré.</li>
                <li><strong>Plainte :</strong> Vous avez le droit de déposer une plainte auprès de l'autorité de contrôle compétente (le Préposé fédéral à la protection des données et à la transparence - PFPDT en Suisse, ou la CNIL en France).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                9. Violation de données
              </h2>
              <p className="text-gray-600">
                En cas de violation de données personnelles posant un risque élevé pour vos droits et libertés, Coachency.app s'engage à notifier l'autorité compétente et les utilisateurs concernés dans les meilleurs délais, conformément à la nLPD et au RGPD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                10. Mineurs
              </h2>
              <p className="text-gray-600">
                Coachency.app ne s'adresse pas aux enfants. Nous ne collectons pas sciemment de données auprès de mineurs de moins de 16 ans sans un accord parental explicite ou celui du tuteur légal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                11. Cookies
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Coachency.app n'utilise <strong>aucun cookie à des fins de ciblage publicitaire</strong>.</li>
                <li>Des cookies strictement nécessaires (techniques) sont utilisés pour maintenir votre session de connexion et assurer la sécurité de la plateforme.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;