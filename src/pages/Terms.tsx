import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function Terms() {
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
            Conditions d'utilisation
          </h1>
          <div className="text-sm text-gray-600 mb-8">
            Dernière mise à jour : 13 février 2025
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Bienvenue sur Coachency.app ! Ce document définit les conditions d'utilisation du service.
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1. Présentation du service
              </h2>
              <p className="text-gray-600">
                Coachency.app est une plateforme de gestion dédiée aux coachs sportifs et à leurs clients, permettant la gestion des clients, la création de programmes personnalisés, la gestion des revenus et l'accès à une bibliothèque d'exercices. La plateforme facilite l'organisation et le suivi des performances des clients.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Accès et utilisation
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>L'accès est réservé aux coachs sportifs et à leurs clients.</li>
                <li>Chaque coach ne peut voir que ses propres clients et inversement.</li>
                <li>L'utilisateur s'engage à fournir des informations exactes et à respecter les lois en vigueur.</li>
                <li>Toute utilisation frauduleuse du service entraînera une suspension immédiate du compte.</li>
                <li>Coachency.app se réserve le droit de modifier ou de supprimer toute information jugée inappropriée.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                3. Comportement des utilisateurs
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Les utilisateurs doivent respecter la législation en vigueur et s'abstenir de publier du contenu offensant, diffamatoire ou illégal.</li>
                <li>Tout comportement abusif ou non conforme entraînera une suspension du compte sans préavis.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                4. Accès au service & maintenance
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Coachency.app peut suspendre temporairement le service pour maintenance ou en cas de force majeure.</li>
                <li>Les utilisateurs seront informés à l'avance dans la mesure du possible.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                5. Modification des conditions
              </h2>
              <p className="text-gray-600">
                Coachency.app se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des modifications via un message sur la plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                6. Abonnements et paiements
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>L'utilisation de certaines fonctionnalités pour les coachs peut nécessiter la souscription à un abonnement payant.</li>
                <li>Le paiement s'effectue via des prestataires sécurisés (ex: Stripe, Apple App Store). Les conditions de paiement et de remboursement sont régies par ces prestataires ainsi que par la loi applicable.</li>
                <li>Sauf mention contraire, les abonnements sont renouvelés automatiquement. L'utilisateur peut résilier son abonnement à tout moment selon les modalités prévues sur la plateforme.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                7. Propriété intellectuelle
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>La plateforme Coachency.app (code, design, marque, logo) est protégée par le droit d'auteur. Toute reproduction ou utilisation non autorisée est strictement interdite.</li>
                <li>Les coachs restent propriétaires de leurs contenus (programmes, vidéos, conseils) et accordent à Coachency.app une licence d'utilisation limitée au fonctionnement du service.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                8. Limitation de responsabilité
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Coachency.app s'efforce de maintenir un service continu, mais ne saurait être tenu responsable des temps d'arrêt, de perte de données ou de bugs informatiques. La plateforme est fournie "en l'état".</li>
                <li><strong>Avertissement sur la santé :</strong> Coachency.app est une plateforme logicielle et ne fournit **aucun conseil médical, sportif ou nutritionnel directement**. La relation et les conseils donnés engagent uniquement la responsabilité du coach envers son client. Coachency.app décline toute responsabilité quant aux blessures, problèmes de santé ou dommages résultant de l'utilisation des programmes créés par les coachs.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                9. Résiliation et suppression de compte
              </h2>
              <p className="text-gray-600">
                L'utilisateur peut demander la suppression de son compte à tout moment. L'accès aux services et aux données associées sera définitivement perdu après traitement de la demande.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                10. Droit applicable et for juridique
              </h2>
              <p className="text-gray-600">
                Les présentes conditions sont soumises au <strong>droit suisse</strong>. En cas de litige qui ne pourrait être résolu à l'amiable, le for juridique exclusif est fixé dans le canton de <strong>Genève</strong>, sous réserve de fors impératifs (notamment en matière de protection des consommateurs).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;