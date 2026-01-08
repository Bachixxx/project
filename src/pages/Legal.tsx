import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function Legal() {
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
            Mentions légales
          </h1>
          <div className="text-sm text-gray-600 mb-8">
            Dernière mise à jour : 13 février 2025
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1. Propriétaire du site
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Nom : Bächtold Jérémy</li>
                <li>Adresse : Route des Romelles 9, 1293 Bellevue, Genève, Suisse</li>
                <li>Email de contact : coachency@gmail.com</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Hébergeur
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Nom : [À compléter lorsque disponible]</li>
                <li>Adresse : [À compléter lorsque disponible]</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                3. Responsabilité en cas de faille de sécurité
              </h2>
              <p className="text-gray-600">
                Coachency.app s'engage à notifier rapidement toute faille de sécurité affectant les données des utilisateurs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                4. Contact pour signaler un abus
              </h2>
              <p className="text-gray-600">
                Toute violation des conditions d'utilisation peut être signalée à coachency@gmail.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legal;