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
                1. Propriétaire de l'application
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Nom : Bächtold Jérémy</li>
                <li>Adresse : Route des Romelles 9, 1293 Bellevue, Genève, Suisse</li>
                <li>Email de contact : coachency@gmail.com</li>
                <li>Numéro IDE (Suisse) : [À compléter si enregistré au registre du commerce]</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Hébergement
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Fournisseur d'infrastructure (Base de données et Stockage) : <strong>Amazon Web Services EMEA SARL, Succursale de Zurich</strong> (via Supabase)</li>
                <li>Adresse du centre de données principal : Zurich, Suisse</li>
                <li>Site web : aws.amazon.com</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                3. Contact pour signaler un abus ou une faille
              </h2>
              <p className="text-gray-600">
                Toute violation des conditions d'utilisation, contenu illicite ou problème de sécurité peut être directement signalé à l'adresse suivante : <strong>coachency@gmail.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legal;