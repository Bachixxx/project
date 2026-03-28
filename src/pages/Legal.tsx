import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import SEO from '../components/SEO';

function Legal() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 md:p-8 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      <SEO
        title="Mentions Légales | Coachency"
        description="Mentions légales de Coachency.app. Éditeur : Jeremy Bächtold, Bellevue, Genève. Hébergement : Supabase / AWS Zurich (eu-central-2). Propriété intellectuelle et signalement de contenus."
        url="https://coachency.app/legal"
      />
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen opacity-30 animate-pulse-slow delay-1000"></div>
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 shadow-inner">
                <Scale className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Mentions légales
                </h1>
                <div className="text-sm text-blue-400 font-medium mt-1">
                  Dernière mise à jour : 13 mars 2025
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent my-8"></div>

            {/* Document Prose */}
            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-headings:text-white prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 transition-colors">
              <p className="font-medium text-slate-200 text-lg leading-relaxed">
                Conformément à la législation en vigueur en Suisse concernant les prestataires de services numériques, et par sécurité juridique en conformité avec les directives standards européennes (telles que la Loi pour la Confiance dans l'Économie Numérique - LCEN pour la France), voici les mentions légales et l'identification des éditeurs et hébergeurs de la plateforme Coachency.app.
              </p>

              <section>
                <h2>
                  1. Éditeur de la Plateforme (Propriétaire)
                </h2>
                <p>L'application web et mobile Coachency.app est éditée, détenue et exploitée par :</p>
                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-6 shadow-inner mt-4">
                  <ul className="space-y-3 m-0 pl-0 list-none">
                    <li className="flex items-start"><span className="text-blue-400 mr-2">▹</span><span><strong>Nom et prénom :</strong> Bächtold Jérémy</span></li>
                    <li className="flex items-start"><span className="text-blue-400 mr-2">▹</span><span><strong>Statut actuel :</strong> Indépendant / Personne Physique</span></li>
                    <li className="flex items-start"><span className="text-blue-400 mr-2">▹</span><span><strong>Adresse de domiciliation :</strong> Route des Romelles 9, 1293 Bellevue, Canton de Genève, Suisse</span></li>
                    <li className="flex items-start"><span className="text-blue-400 mr-2">▹</span><span><strong>Email de contact officiel :</strong> <a href="mailto:contact@coachency.ch">contact@coachency.ch</a></span></li>
                    <li className="flex items-start"><span className="text-blue-400 mr-2">▹</span><span><strong>Responsable de la Publication :</strong> Bächtold Jérémy</span></li>
                    <li className="flex items-start"><span className="text-blue-400 mr-2">▹</span><span className="text-slate-400"><strong>Numéro d'Identification des Entreprises (IDE / CHE) :</strong> <em>[Sera complété lors de l'inscription au RC/TVA si les seuils sont atteints]</em></span></li>
                  </ul>
                </div>
              </section>

              <section>
                <h2>
                  2. Hébergement de l'Application et des Données
                </h2>
                <p>
                  Soucieux de la sécurité et de la protection des données de nos utilisateurs, nous avons fait le choix de localiser notre pôle d'hébergement principal sur le sol Suisse.
                </p>
                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-6 shadow-inner mt-4">
                  <ul className="space-y-3 m-0 pl-0 list-none">
                    <li className="flex items-start"><span className="text-purple-400 mr-2">▹</span><span><strong>Gérant de Structure de Données (BaaS) :</strong> Supabase Inc. (avec restriction locale)</span></li>
                    <li className="flex items-start"><span className="text-purple-400 mr-2">▹</span><span><strong>Fournisseur d'Infrastructure physique (Cloud) :</strong> Amazon Web Services EMEA SARL, Succursale de Zurich</span></li>
                    <li className="flex items-start"><span className="text-purple-400 mr-2">▹</span><span><strong>Adresse du centre de serveurs utilisé :</strong> Région AWS eu-central-2 (Zurich, Suisse)</span></li>
                    <li className="flex items-start"><span className="text-purple-400 mr-2">▹</span><span><strong>Site internet de l'hébergeur cloud :</strong> <a href="https://aws.amazon.com/fr/local/switzerland/" target="_blank" rel="noopener noreferrer">https://aws.amazon.com/fr/local/switzerland/</a></span></li>
                  </ul>
                </div>
              </section>

              <section>
                <h2>
                  3. Avertissement Légal Global et Propriété Intellectuelle
                </h2>
                <p>
                  L'ensemble de ce site et de l'application Coachency.app relève de la législation suisse et internationale sur le droit d'auteur et la propriété intellectuelle.
                </p>
                <p>
                  Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables, les représentations iconographiques et photographiques, ainsi que le code source, le design et l'architecture logicielle.
                </p>
                <p>
                  La reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la plateforme, quel que soit le moyen ou le procédé utilisé, est strictement interdite sans une autorisation écrite préalable formelle de Monsieur Bächtold Jérémy. Toute exploitation non autorisée entraînera des poursuites judiciaires immédiates.
                </p>
              </section>

              <section>
                <h2>
                  4. Signaler des contenus illicites ou abus
                </h2>
                <p>
                  En qualité de prestataire technique logiciel, l'Exploitant de Coachency.app intervient en tant qu'hébergeur des contenus générés par les Coachs Utilisateurs.
                </p>
                <p>
                  Afin de signaler la présence d'un contenu susceptible d'enfreindre la loi, constitutif d'une infraction, ou de toute activité illicite de la part d'un utilisateur utilisant Coachency.app, vous pouvez joindre l'éditeur par courriel avec accusé de réception à l'adresse suivante : <strong>contact@coachency.ch</strong>, en mentionnant précisément l'objet de votre réclamation avec les preuves associées.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legal;