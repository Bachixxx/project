import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';

function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 md:p-8 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      <SEO
        title="Politique de Confidentialité | Coachency"
        description="Politique de confidentialité de Coachency conforme au RGPD et à la nLPD suisse. Protection des données personnelles, droits des utilisateurs, sous-traitants et durées de conservation."
        url="https://coachency.app/privacy"
      />
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen opacity-30 animate-pulse-slow delay-1000"></div>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 pt-16 md:pt-8 mb-20 animate-fade-in">
        {/* Back button */}
        <div className="absolute top-0 left-0 md:-left-16 z-20">
          <Link
            to="/"
            className="group flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center mr-3 md:mr-0 group-hover:bg-white/10 transition-colors border border-white/5">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm md:hidden">Retour</span>
          </Link>
        </div>

        {/* Content Container (Glass Card) */}
        <div className="relative rounded-[2rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden mt-8 md:mt-0">
          {/* Animated gradient border top */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-70"></div>

          <div className="p-8 md:p-12 relative">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Politique de confidentialité
                </h1>
                <div className="text-sm text-blue-400 font-medium mt-1">
                  Dernière mise à jour : 13 février 2025
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent my-8"></div>

            {/* Document Prose */}
            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-headings:text-white prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 transition-colors prose-td:text-slate-300 prose-th:text-white prose-th:bg-white/5 prose-table:border-white/10">
              <p className="font-medium text-slate-200 text-lg leading-relaxed">
                Coachency.app accorde une importance primordiale à la confidentialité et à la sécurité de vos données personnelles. Cette politique décrit formellement comment nous collectons, utilisons, protégeons et partageons ces données, en stricte conformité avec la nouvelle Loi fédérale sur la protection des données (nLPD - Suisse) et le Règlement Général sur la Protection des Données (RGPD - Europe).
              </p>

              <section>
                <h2>1. Identité du Responsable de Traitement et Rôles</h2>
                <p><strong>Distinction fondamentale des rôles :</strong></p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li>
                    Pour les données d'inscription et de facturation des <strong>Coachs</strong>, Coachency.app agit en qualité de <strong>Responsable de Traitement</strong> (Data Controller).
                  </li>
                  <li>
                    Pour toutes les données relatives aux <strong>Clients</strong> (profils, entraînements, données de santé ou biométriques) saisies par les Coachs ou par les Clients eux-mêmes dans le cadre d'un accompagnement, le Coach agit en qualité de <strong>Responsable de Traitement</strong>. Coachency.app intervient ici exclusivement en tant que <strong>Sous-traitant</strong> (Data Processor), fournissant uniquement l'infrastructure technique d'hébergement et de gestion au nom du Coach.
                  </li>
                </ul>
                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-6 shadow-inner mt-6">
                  <p className="m-0">
                    L'Exploitant légal et Délégué à la protection des données (DPO) pour Coachency.app est :<br />
                    <strong>Bächtold Jérémy</strong><br />
                    Route des Romelles 9, 1293 Bellevue, Genève, Suisse<br />
                    Contact : <strong><a href="mailto:contact@coachency.ch">contact@coachency.ch</a></strong>
                  </p>
                </div>
              </section>

              <section>
                <h2>2. Catégories de Données Collectées</h2>
                <p>Lors de l'utilisation de la plateforme, nous sommes amenés à traiter les données suivantes :</p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li><strong>Données d'identité et de contact :</strong> Nom, prénom, adresse email, téléphone.</li>
                  <li><strong>Données de santé et biométriques (Données Sensibles) :</strong> Âge, poids, mensurations physiques, historiques sportifs, performances, ressentis de séances, et photos d'évolution (avant/après).</li>
                  <li><strong>Données liées aux transactions financières :</strong> Historique de paiements, montants, détails d'abonnements. (Les numéros de carte de crédit complets ne sont ni traités ni stockés par Coachency, mais exclusivement par notre partenaire Stripe ou Apple).</li>
                  <li><strong>Données techniques et de connexion :</strong> Adresse IP, type de navigateur, type d'appareil (mobile/desktop), fuseau horaire, et logs systèmes.</li>
                </ul>
              </section>

              <section>
                <h2>3. Finalités et Bases Légales du Traitement</h2>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm text-left border-collapse border border-white/10 rounded-lg overflow-hidden">
                    <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="border-b border-white/10 px-4 py-3 font-semibold">Finalité du Traitement</th>
                        <th className="border-b border-l border-white/10 px-4 py-3 font-semibold">Base Légale (RGPD/LPD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-slate-950/30">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">Création des comptes et fourniture du service applicatif.</td>
                        <td className="border-l border-white/10 px-4 py-3"><strong>Exécution du contrat</strong> (CGU).</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">Facturation, gestion des paiements et comptabilité.</td>
                        <td className="border-l border-white/10 px-4 py-3"><strong>Obligation légale</strong> (droit fiscal suisse).</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">Hébergement et suivi des performances (poids, mensurations, ressentis).</td>
                        <td className="border-l border-white/10 px-4 py-3"><strong>Consentement explicite</strong> (données sensibles de santé).</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">Sécurité, prévention des fraudes et résolution de bugs.</td>
                        <td className="border-l border-white/10 px-4 py-3"><strong>Intérêt légitime</strong> du responsable de traitement.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2>4. Destinataires et Sous-traitants (Tiers)</h2>
                <p>Vos données personnelles ne sont jamais vendues ou louées à des fins marketing. Elles sont uniquement partagées avec nos prestataires techniques (sous-traitants) strictement sélectionnés pour assurer le fonctionnement de la Plateforme :</p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li><strong>Hébergement Cloud & Base de Données :</strong> AWS (Amazon Web Services) / Supabase. Les serveurs sont localisés à <strong>Zurich (Suisse)</strong>.</li>
                  <li><strong>Passerelles de paiement :</strong> Stripe Inc. (États-Unis/Irlande) ou Apple (selon la plateforme). Utilisation sécurisée certifiée PCI-DSS.</li>
                  <li><strong>Gestion des notifications :</strong> OneSignal (États-Unis) ou services natifs Firebase Cloud Messaging / Apple Push Notification.</li>
                </ul>
              </section>

              <section>
                <h2>5. Transferts Internationaux de Données</h2>
                <p>
                  Le centre de données principal de Coachency.app est situé en Suisse. Cependant, en utilisant des sous-traitants mondiaux (comme Stripe ou OneSignal), il est possible que certaines données soient transférées hors de la Suisse ou de l'Espace Économique Européen (EEE).
                  Dans ce cas, nous nous assurons que des garanties adéquates sont en place (Pays reconnus adéquats par le PFPDT/Commission Européenne, ou application des Clauses Contractuelles Types standards - SCCs).
                </p>
              </section>

              <section>
                <h2>6. Sécurité des Données</h2>
                <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles conformes aux standards de l'industrie pour protéger vos données :</p>
                <ul className="list-disc pl-6 marker:text-cyan-500">
                  <li>Chiffrement de toutes les connexions web (TLS/HTTPS).</li>
                  <li>Stockage de la base de données avec chiffrement au repos et accès restreint via réseau privé.</li>
                  <li>Hachage irréversible des mots de passe.</li>
                  <li>Séparation stricte (Row Level Security) des données dans la base documentaire afin que chaque Coach ou Client ne puisse accéder qu'aux données strictement liées à son propre compte.</li>
                </ul>
              </section>

              <section>
                <h2>7. Durée de Conservation</h2>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li><strong>Données de profil et de santé :</strong> Conservées pendant toute la durée d'activité du compte. En cas de suppression du compte, elles sont purgées de nos bases primaires dans un délai de 30 jours (puis effacées de nos sauvegardes chiffrées roulantes sous 60 jours supplémentaires).</li>
                  <li><strong>Données comptables et de facturation :</strong> Conformément à l'Article 958f du Code des obligations suisse (CO), les factures, journaux comptables et preuves de transaction sont conservées pendant <strong>10 ans</strong>.</li>
                </ul>
              </section>

              <section>
                <h2>8. Exercice de Vos Droits</h2>
                <p>Conformément à la nLPD et au RGPD, vous disposez des droits suivants, exerçables gratuitement en contactant <strong><a href="mailto:contact@coachency.ch">contact@coachency.ch</a></strong> :</p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li><strong>Droit d'accès :</strong> Obtenir une copie des données traitées.</li>
                  <li><strong>Droit de rectification :</strong> Corriger des données inexactes ou incomplètes.</li>
                  <li><strong>Droit de suppression (Droit à l'oubli) :</strong> Demander l'effacement définitif des données (sous réserve des durées de conservation légales).</li>
                  <li><strong>Droit de retrait du consentement :</strong> Retirer votre consentement au traitement des données sensibles à tout moment. Note : ce retrait peut rendre impossible la continuité du suivi personnalisé sportif.</li>
                  <li><strong>Droit à la portabilité :</strong> Recevoir ses données dans un format informatique standard (JSON / CSV).</li>
                </ul>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 my-6">
                  <p className="m-0 text-blue-200 text-sm">Nous nous engageons à répondre à toute demande relative à vos droits dans un délai maximum de <strong>30 jours</strong> après vérification de votre identité.</p>
                </div>
                <p>Vous disposez également du droit de déposer une plainte auprès de l'autorité de contrôle compétente du lieu de votre résidence (par ex. le PFPDT en Suisse, la CNIL en France, la CNPD au Luxembourg, l'APD en Belgique, etc.).</p>
              </section>

              <section>
                <h2>9. Signalement et Violations de Données (Data Breach)</h2>
                <p>
                  Dans l'éventualité d'une faille de sécurité ou d'un accès non autorisé incident de nature à engendrer un risque élevé pour les droits ou libertés fondamentales de nos utilisateurs, Coachency.app s'engage à le notifier au PFPDT (et organismes européens compétents) ainsi qu'aux utilisateurs concernés dans les meilleurs délais constitutionnels.
                </p>
              </section>

              <section>
                <h2>10. Mineurs</h2>
                <p>
                  La Plateforme n'est pas librement destinée aux enfants de moins de 16 ans. Aucune donnée n'est collectée sciemment auprès d'une personne de moins de 16 ans de manière autonome. L'utilisation par un mineur requiert obligatoirement la création parentale du compte ou l'accord explicite formalisé par le tuteur légal auprès du responsable légal (le Coach).
                </p>
              </section>

              <section>
                <h2>11. Politique en matière de Cookies</h2>
                <p>
                  L'application Coachency.app est conçue en gardant la confidentialité à l'esprit (Privacy by design). Par conséquent :
                </p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li>Nous <strong>n'utilisons PAS</strong> de cookies de tracking marketing (ex: Meta Pixel, Google Ads Tracking).</li>
                  <li>Nous utilisons exclusivement des <strong>Cookies Techniques ou Stockages Locaux (Local Storage) Strictement Nécessaires</strong>. Ces éléments ne nécessitent pas de consentement préalable selon la Directive ePrivacy, car ils servent uniquement à :
                    <ul className="list-[circle] pl-6 mt-2 marker:text-slate-500">
                      <li>Maintenir votre session de connexion active de manière sécurisée (Jetons d'authentification / JWT).</li>
                      <li>Mémoriser vos préférences d'affichage interface locale.</li>
                      <li>Assurer la sécurité (prévention d'attaques de type CSRF).</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section>
                <h2>12. Modifications de la Politique</h2>
                <p>
                  Nous nous réservons le droit de modifier la présente Politique de Confidentialité à tout moment afin de refléter des changements réglementaires ou évolutions de nos outils. La date de "Dernière mise à jour" au sommet du document sera révisée en conséquence. En cas de modification majeure des finalités, vous serez notifié activement.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;