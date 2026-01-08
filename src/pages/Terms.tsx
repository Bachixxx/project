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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;