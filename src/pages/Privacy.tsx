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
              <p className="text-gray-600">
                Nous collectons les informations suivantes : Nom, prénom, email, âge, mensurations et photos.
              </p>
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
                <li>Le consentement explicite des utilisateurs.</li>
                <li>L'obligation légale (exemple : respect des règles fiscales en cas de facturation).</li>
                <li>L'intérêt légitime pour assurer la sécurité et l'amélioration des services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                4. Utilisation des données
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Les informations sont utilisées pour optimiser le suivi des performances et la création de programmes personnalisés.</li>
                <li>Coachency.app ne vend ni ne partage les données à des tiers à des fins commerciales.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                5. Transferts internationaux de données
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Les données sont stockées en Suisse (Zurich) sur des serveurs AWS sécurisés.</li>
                <li>Aucun transfert de données hors de la Suisse n'est effectué sans garanties de protection adéquates.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                6. Durée de conservation
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Les données sont conservées aussi longtemps que le compte est actif.</li>
                <li>En cas de suppression d'un compte, les données sont effacées dans un délai de 30 jours.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                7. Droits des utilisateurs
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Accès et rectification : Les utilisateurs peuvent demander à consulter ou modifier leurs données.</li>
                <li>Suppression : Les utilisateurs peuvent demander la suppression de leurs données à tout moment en contactant coachency@gmail.com.</li>
                <li>Portabilité des données : Les utilisateurs peuvent demander une copie de leurs données dans un format structuré, couramment utilisé et lisible par machine.</li>
                <li>Opposition et limitation : Les utilisateurs peuvent limiter l'utilisation de leurs données en adressant une demande au support.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                8. Violation de données
              </h2>
              <p className="text-gray-600">
                En cas de violation des données personnelles susceptible d'entraîner un risque élevé pour les utilisateurs, Coachency.app s'engage à notifier immédiatement les personnes concernées et les autorités compétentes conformément aux réglementations RGPD et LPD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                9. Mineurs et consentement parental
              </h2>
              <p className="text-gray-600">
                Coachency.app ne collecte pas sciemment de données auprès de mineurs de moins de 16 ans sans consentement parental explicite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                10. Cookies
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Coachency.app n'utilise pas de cookies à des fins publicitaires.</li>
                <li>Certains cookies techniques peuvent être utilisés pour assurer le bon fonctionnement de la plateforme.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;