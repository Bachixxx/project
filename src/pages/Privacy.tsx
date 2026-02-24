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

          <div className="prose max-w-none text-gray-600">
            <p className="mb-6 font-medium text-gray-800">
              Coachency.app accorde une importance primordiale à la confidentialité et à la sécurité de vos données personnelles. Cette politique décrit formellement comment nous collectons, utilisons, protégeons et partageons ces données, en stricte conformité avec la nouvelle Loi fédérale sur la protection des données (nLPD - Suisse) et le Règlement Général sur la Protection des Données (RGPD - Europe).
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Identité du Responsable de Traitement et Rôles</h2>

              <p className="mb-4"><strong>Distinction fondamentale des rôles :</strong></p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Pour les données d'inscription et de facturation des <strong>Coachs</strong>, Coachency.app agit en qualité de <strong>Responsable de Traitement</strong> (Data Controller).
                </li>
                <li>
                  Pour toutes les données relatives aux <strong>Clients</strong> (profils, entraînements, données de santé ou biométriques) saisies par les Coachs ou par les Clients eux-mêmes dans le cadre d'un accompagnement, le Coach agit en qualité de <strong>Responsable de Traitement</strong>. Coachency.app intervient ici exclusivement en tant que <strong>Sous-traitant</strong> (Data Processor), fournissant uniquement l'infrastructure technique d'hébergement et de gestion au nom du Coach.
                </li>
              </ul>
              <p>
                L'Exploitant légal et Délégué à la protection des données (DPO) pour Coachency.app est :<br />
                <strong>Bächtold Jérémy</strong><br />
                Route des Romelles 9, 1293 Bellevue, Genève, Suisse<br />
                Contact : <strong>contact@coachency.ch</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Catégories de Données Collectées</h2>
              <p className="mb-4">Lors de l'utilisation de la plateforme, nous sommes amenés à traiter les données suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Données d'identité et de contact :</strong> Nom, prénom, adresse email, téléphone.</li>
                <li><strong>Données de santé et biométriques (Données Sensibles) :</strong> Âge, poids, mensurations physiques, historiques sportifs, performances, ressentis de séances, et photos d'évolution (avant/après).</li>
                <li><strong>Données liées aux transactions financières :</strong> Historique de paiements, montants, détails d'abonnements. (Les numéros de carte de crédit complets ne sont ni traités ni stockés par Coachency, mais exclusivement par notre partenaire Stripe ou Apple).</li>
                <li><strong>Données techniques et de connexion :</strong> Adresse IP, type de navigateur, type d'appareil (mobile/desktop), fuseau horaire, et logs systèmes.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Finalités et Bases Légales du Traitement</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2 font-semibold">Finalité du Traitement</th>
                      <th className="border border-gray-200 px-4 py-2 font-semibold">Base Légale (RGPD/LPD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Création des comptes et fourniture du service applicatif.</td>
                      <td className="border border-gray-200 px-4 py-2"><strong>Exécution du contrat</strong> (CGU).</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Facturation, gestion des paiements et comptabilité.</td>
                      <td className="border border-gray-200 px-4 py-2"><strong>Obligation légale</strong> (droit fiscal suisse).</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Hébergement et suivi des performances (poids, mensurations, ressentis).</td>
                      <td className="border border-gray-200 px-4 py-2"><strong>Consentement explicite</strong> (données sensibles de santé).</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Sécurité, prévention des fraudes et résolution de bugs.</td>
                      <td className="border border-gray-200 px-4 py-2"><strong>Intérêt légitime</strong> du responsable de traitement.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Destinataires et Sous-traitants (Tiers)</h2>
              <p className="mb-4">Vos données personnelles ne sont jamais vendues ou louées à des fins marketing. Elles sont uniquement partagées avec nos prestataires techniques (sous-traitants) strictement sélectionnés pour assurer le fonctionnement de la Plateforme :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Hébergement Cloud & Base de Données :</strong> AWS (Amazon Web Services) / Supabase. Les serveurs sont localisés à <strong>Zurich (Suisse)</strong>.</li>
                <li><strong>Passerelles de paiement :</strong> Stripe Inc. (États-Unis/Irlande) ou Apple (selon la plateforme). Utilisation sécurisée certifiée PCI-DSS.</li>
                <li><strong>Gestion des notifications :</strong> OneSignal (États-Unis) ou services natifs Firebase Cloud Messaging / Apple Push Notification.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Transferts Internationaux de Données</h2>
              <p>
                Le centre de données principal de Coachency.app est situé en Suisse. Cependant, en utilisant des sous-traitants mondiaux (comme Stripe ou OneSignal), il est possible que certaines données soient transférées hors de la Suisse ou de l'Espace Économique Européen (EEE).
                Dans ce cas, nous nous assurons que des garanties adéquates sont en place (Pays reconnus adéquats par le PFPDT/Commission Européenne, ou application des Clauses Contractuelles Types standards - SCCs).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Sécurité des Données</h2>
              <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles conformes aux standards de l'industrie pour protéger vos données :</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Chiffrement de toutes les connexions web (TLS/HTTPS).</li>
                <li>Stockage de la base de données avec chiffrement au repos et accès restreint via réseau privé.</li>
                <li>Hachage irréversible des mots de passe.</li>
                <li>Séparation stricte (Row Level Security) des données dans la base documentaire afin que chaque Coach ou Client ne puisse accéder qu'aux données strictement liées à son propre compte.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Durée de Conservation</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Données de profil et de santé :</strong> Conservées pendant toute la durée d'activité du compte. En cas de suppression du compte, elles sont purgées de nos bases primaires dans un délai de 30 jours (puis effacées de nos sauvegardes chiffrées roulantes sous 60 jours supplémentaires).</li>
                <li><strong>Données comptables et de facturation :</strong> Conformément à l'Article 958f du Code des obligations suisse (CO), les factures, journaux comptables et preuves de transaction sont conservées pendant <strong>10 ans</strong>.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Exercice de Vos Droits</h2>
              <p className="mb-4">Conformément à la nLPD et au RGPD, vous disposez des droits suivants, exerçables gratuitement en contactant <strong>contact@coachency.ch</strong> :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Droit d'accès :</strong> Obtenir une copie des données traitées.</li>
                <li><strong>Droit de rectification :</strong> Corriger des données inexactes ou incomplètes.</li>
                <li><strong>Droit de suppression (Droit à l'oubli) :</strong> Demander l'effacement définitif des données (sous réserve des durées de conservation légales).</li>
                <li><strong>Droit de retrait du consentement :</strong> Retirer votre consentement au traitement des données sensibles à tout moment. Note : ce retrait peut rendre impossible la continuité du suivi personnalisé sportif.</li>
                <li><strong>Droit à la portabilité :</strong> Recevoir ses données dans un format informatique standard (JSON / CSV).</li>
              </ul>
              <p className="mt-4">Nous nous engageons à répondre à toute demande relative à vos droits dans un délai maximum de <strong>30 jours</strong> après vérification de votre identité.</p>
              <p className="mt-2">Vous disposez également du droit de déposer une plainte auprès de l'autorité de contrôle compétente du lieu de votre résidence (par ex. le PFPDT en Suisse, la CNIL en France, la CNPD au Luxembourg, l'APD en Belgique, etc.).</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Signalement et Violations de Données (Data Breach)</h2>
              <p>
                Dans l'éventualité d'une faille de sécurité ou d'un accès non autorisé incident de nature à engendrer un risque élevé pour les droits ou libertés fondamentales de nos utilisateurs, Coachency.app s'engage à le notifier au PFPDT (et organismes européens compétents) ainsi qu'aux utilisateurs concernés dans les meilleurs délais constitutionnels.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Mineurs</h2>
              <p>
                La Plateforme n'est pas librement destinée aux enfants de moins de 16 ans. Aucune donnée n'est collectée sciemment auprès d'une personne de moins de 16 ans de manière autonome. L'utilisation par un mineur requiert obligatoirement la création parentale du compte ou l'accord explicite formalisé par le tuteur légal auprès du responsable légal (le Coach).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">11. Politique en matière de Cookies</h2>
              <p className="mb-4">
                L'application Coachency.app est conçue en gardant la confidentialité à l'esprit (Privacy by design). Par conséquent :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nous <strong>n'utilisons PAS</strong> de cookies de tracking marketing (ex: Meta Pixel, Google Ads Tracking).</li>
                <li>Nous utilisons exclusivement des <strong>Cookies Techniques ou Stockages Locaux (Local Storage) Strictement Nécessaires</strong>. Ces éléments ne nécessitent pas de consentement préalable selon la Directive ePrivacy, car ils servent uniquement à :</li>
                <ul className="list-circle pl-6 space-y-1 text-sm mt-1">
                  <li>Maintenir votre session de connexion active de manière sécurisée (Jetons d'authentification / JWT).</li>
                  <li>Mémoriser vos préférences d'affichage interface locale.</li>
                  <li>Assurer la sécurité (prévention d'attaques de type CSRF).</li>
                </ul>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">12. Modifications de la Politique</h2>
              <p>
                Nous nous réservons le droit de modifier la présente Politique de Confidentialité à tout moment afin de refléter des changements réglementaires ou évolutions de nos outils. La date de "Dernière mise à jour" au sommet du document sera révisée en conséquence. En cas de modification majeure des finalités, vous serez notifié activement.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;