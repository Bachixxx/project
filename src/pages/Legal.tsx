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

          <div className="prose max-w-none text-gray-600">
            <p className="mb-6 font-medium text-gray-800">
              Conformément à la législation en vigueur en Suisse concernant les prestataires de services numériques, et par sécurité juridique en conformité avec les directives standards européennes (telles que la Loi pour la Confiance dans l'Économie Numérique - LCEN pour la France), voici les mentions légales et l'identification des éditeurs et hébergeurs de la plateforme Coachency.app.
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1. Éditeur de la Plateforme (Propriétaire)
              </h2>
              <p className="mb-4">L'application web et mobile Coachency.app est éditée, détenue et exploitée par :</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <ul className="space-y-2">
                  <li><strong>Nom et prénom :</strong> Bächtold Jérémy</li>
                  <li><strong>Statut actuel :</strong> Indépendant / Personne Physique</li>
                  <li><strong>Adresse de domiciliation :</strong> Route des Romelles 9, 1293 Bellevue, Canton de Genève, Suisse</li>
                  <li><strong>Email de contact officiel :</strong> contact@coachency.ch</li>
                  <li><strong>Responsable de la Publication :</strong> Bächtold Jérémy</li>
                  <li><strong>Numéro d'Identification des Entreprises (IDE / CHE) :</strong> <em>[Sera complété lors de l'inscription au RC/TVA si les seuils sont atteints]</em></li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Hébergement de l'Application et des Données
              </h2>
              <p className="mb-4">
                Soucieux de la sécurité et de la protection des données de nos utilisateurs, nous avons fait le choix de localiser notre pôle d'hébergement principal sur le sol Suisse.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <ul className="space-y-2">
                  <li><strong>Gérant de Structure de Données (BaaS) :</strong> Supabase Inc. (avec restriction locale)</li>
                  <li><strong>Fournisseur d'Infrastructure physique (Cloud) :</strong> Amazon Web Services EMEA SARL, Succursale de Zurich</li>
                  <li><strong>Adresse du centre de serveurs utilisé :</strong> Région AWS eu-central-2 (Zurich, Suisse)</li>
                  <li><strong>Site internet de l'hébergeur cloud :</strong> https://aws.amazon.com/fr/local/switzerland/</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                3. Avertissement Légal Global et Propriété Intellectuelle
              </h2>
              <p className="mb-4">
                L'ensemble de ce site et de l'application Coachency.app relève de la législation suisse et internationale sur le droit d'auteur et la propriété intellectuelle.
              </p>
              <p className="mb-4">
                Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables, les représentations iconographiques et photographiques, ainsi que le code source, le design et l'architecture logicielle.
              </p>
              <p>
                La reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la plateforme, quel que soit le moyen ou le procédé utilisé, est strictement interdite sans une autorisation écrite préalable formelle de Monsieur Bächtold Jérémy. Toute exploitation non autorisée entraînera des poursuites judiciaires immédiates.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                4. Signaler des contenus illicites ou abus
              </h2>
              <p>
                En qualité de prestataire technique logiciel, l'Exploitant de Coachency.app intervient en tant qu'hébergeur des contenus générés par les Coachs Utilisateurs.
              </p>
              <p className="mt-2 text-gray-600">
                Afin de signaler la présence d'un contenu susceptible d'enfreindre la loi, constitutif d'une infraction, ou de toute activité illicite de la part d'un utilisateur utilisant Coachency.app, vous pouvez joindre l'éditeur par courriel avec accusé de réception à l'adresse suivante : <strong>contact@coachency.ch</strong>, en mentionnant précisément l'objet de votre réclamation avec les preuves associées.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legal;