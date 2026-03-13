import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import SEO from '../components/SEO';

function Terms() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 md:p-8 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      <SEO
        title="Conditions d'Utilisation | Coachency"
        description="Conditions générales d'utilisation de la plateforme Coachency. Informations sur la licence SaaS, les obligations, la facturation et la juridiction applicable (Genève, Suisse)."
        url="https://coachency.app/terms"
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5 shadow-inner">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Conditions d'utilisation
                </h1>
                <div className="text-sm text-blue-400 font-medium mt-1">
                  Dernière mise à jour : 13 février 2025
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent my-8"></div>

            {/* Document Prose */}
            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-headings:text-white prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 transition-colors">
              <p className="font-medium text-slate-200 text-lg leading-relaxed">
                Bienvenue sur Coachency.app ! Les présentes Conditions Générales d'Utilisation (ci-après "CGU") constituent un accord légal et contraignant entre Bächtold Jérémy (ci-après "l'Exploitant", "nous", "notre") et toute personne accédant ou utilisant la Plateforme (ci-après "l'Utilisateur", "vous").
              </p>
              <p>
                En créant un compte ou en utilisant Coachency.app, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser notre Plateforme.
              </p>

              <section>
                <h2>1. Définitions</h2>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li><strong>Plateforme :</strong> désigne l'application web Coachency.app et toutes ses interfaces accessibles par les utilisateurs.</li>
                  <li><strong>Coach :</strong> professionnel du sport ou de la santé utilisant la Plateforme pour gérer, suivre et facturer ses propres clients.</li>
                  <li><strong>Client :</strong> personne physique invitée par un Coach pour bénéficier de ses services sportifs via la Plateforme.</li>
                  <li><strong>Utilisateur :</strong> désigne indistinctement les Coachs et les Clients utilisant la Plateforme.</li>
                  <li><strong>Contenu :</strong> désigne l'ensemble des textes, vidéos, photos, données de santé, programmes d'entraînement ou autres informations téléchargés, saisis ou partagés sur la Plateforme par les Utilisateurs.</li>
                </ul>
              </section>

              <section>
                <h2>2. Description des services et Licence (SaaS)</h2>
                <p>
                  Coachency.app est fourni sous la forme d'un logiciel en tant que service (SaaS - Software as a Service). Sous réserve du respect des présentes CGU et du paiement des éventuels abonnements applicables, l'Exploitant vous accorde une licence limitée, non exclusive, non transférable et révocable afin d'accéder et d'utiliser la Plateforme.
                </p>
                <p>Il est formellement interdit de :</p>
                <ul className="list-disc pl-6 marker:text-red-500 text-red-100">
                  <li>Copier, modifier, distribuer, vendre ou louer toute ou partie de la Plateforme.</li>
                  <li>Faire de l'ingénierie inverse (reverse engineering) ou tenter d'extraire le code source.</li>
                  <li>Utiliser la Plateforme pour héberger ou transmettre des virus, malwares ou tout code nuisible.</li>
                  <li>Effectuer des actions de type aspiration de données (scraping).</li>
                </ul>
              </section>

              <section>
                <h2>3. Accès au service et Sécurité du compte</h2>
                <p>
                  Pour utiliser la Plateforme, l'Utilisateur doit créer un compte. L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour.
                </p>
                <p>
                  L'Utilisateur est seul responsable de la sécurité et de la confidentialité de ses identifiants de connexion. Toute action effectuée depuis le compte de l'Utilisateur est réputée avoir été effectuée par lui-même. En cas de perte ou d'accès non autorisé, l'Utilisateur doit en informer immédiatement l'Exploitant à <strong>contact@coachency.ch</strong>.
                </p>
              </section>

              <section>
                <h2>4. Conditions financières et Abonnements (Coachs)</h2>
                <p>
                  Certaines fonctionnalités destinées aux Coachs peuvent requérir un abonnement payant. Les tarifs, cycles de facturation et fonctionnalités incluses sont affichés sur la Plateforme.
                </p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li><strong>Paiement :</strong> Les transactions sont opérées par des prestataires de paiement tiers sécurisés (par ex. Stripe ou Apple Store). L'Exploitant ne stocke aucune donnée de carte bancaire complète.</li>
                  <li><strong>Renouvellement :</strong> Sauf résiliation effectuée par le Coach avant la fin de la période de facturation en cours, l'abonnement se renouvelle automatiquement.</li>
                  <li><strong>Politique de remboursement :</strong> Pour les services numériques SaaS, l'Exploitant n'accorde aucun remboursement pour la période de facturation entamée, sauf obligation légale impérative ou disposition contraire de la plateforme d'achat tierce (ex: Apple Store).</li>
                  <li><strong>Taxes :</strong> Sauf mention contraire, les prix peuvent exclure les taxes applicables (comme la TVA), qui seront ajoutées au moment du paiement en fonction de la juridiction de résidence du Coach.</li>
                </ul>
              </section>

              <section>
                <h2>5. Rôles et Obligations Spécifiques du Coach</h2>
                <p>
                  La Plateforme n'est qu'un outil technologique d'intermédiation logicielle. En utilisant Coachency.app, le Coach reconnaît et accepte expressément que :
                </p>
                <ul className="list-disc pl-6 marker:text-blue-500">
                  <li>Il exerce son activité de manière totalement indépendante de l'Exploitant. L'Exploitant n'est ni son employeur, ni son partenaire commercial, ni son agent.</li>
                  <li>Il est seul et unique responsable des services (entraînements, conseils) vendus et fournis à ses Clients, ainsi que de la gestion de ses propres tarifs et facturations clients.</li>
                  <li>Il est de sa propre responsabilité d'obtenir toutes les accréditations, assurances professionnelles ou diplômes nécessaires pour exercer l'activité de coaching dans sa juridiction.</li>
                  <li>Il est seul responsable du traitement juridique et du respect du RGPD/nLPD vis-à-vis des données personnelles de ses Clients qu'il renseigne ou gère sur la Plateforme (l'Exploitant n'étant qu'un sous-traitant technique de ces données).</li>
                </ul>
              </section>

              <section>
                <h2>6. Avertissement sur la santé et Indépendance médicale</h2>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 my-6">
                  <p className="font-bold text-red-400 m-0">L'utilisation de la plateforme ne remplace en aucun cas une consultation médicale.</p>
                </div>
                <p>
                  L'Exploitant ne fournit <strong>aucun conseil médical, diagnostic ou prescription</strong> de nature médicale, paramédicale, diététique ou sportive.
                </p>
                <p>
                  Le Client reconnaît que les programmes sportifs comportent des risques inhérents de blessures ou de problèmes de santé. Il incombe au Client de s'assurer auprès d'un professionnel de santé de son aptitude physique à suivre les entraînements proposés par son Coach.
                </p>
                <p>
                  L'Exploitant décline formellement toute responsabilité relative à l'adéquation, l'innocuité ou les effets (y compris pertes matérielles, blessures physiques ou décès) des programmes ou exercices conçus ou distribués via la Plateforme par les Coachs.
                </p>
              </section>

              <section>
                <h2>7. Disponibilité des services (SLA)</h2>
                <p>
                  L'Exploitant est soumis à une obligation de moyens (et non de résultat) concernant la mise à disposition de la Plateforme (SLA basé sur le principe du "Best Effort"). Bien que nous nous efforcions d'assurer un accès 24/7, la Plateforme peut être temporairement suspendue pour des raisons de maintenance, de mises à jour ou en cas de pannes techniques liées à nos hébergeurs.
                </p>
                <p>L'Exploitant ne garantit pas que le service sera totalement exempt d'erreurs, de bugs ou d'interruptions, et décline toute responsabilité pour les éventuelles pertes de données.</p>
              </section>

              <section>
                <h2>8. Propriété intellectuelle</h2>
                <p>
                  Tous les droits rattachés au logiciel, au nom "Coachency", à l'interface, aux logos et aux bases de données structurelles sont la propriété exclusive de l'Exploitant.
                </p>
                <p>
                  L'Utilisateur conserve l'entière propriété intellectuelle sur les Contenus originaux qu'il publie (vidéos personnelles, programmes sur mesure). Toutefois, en publiant ces Contenus sur la Plateforme, l'Utilisateur concède à l'Exploitant une licence mondiale, gratuite et transférable à la seule et unique fin d'héberger, afficher et exécuter ces Contenus dans le cadre strict du fonctionnement normal du service.
                </p>
              </section>

              <section>
                <h2>9. Limitation de responsabilité et Indemnisation</h2>
                <p>
                  Dans toute la mesure permise par la loi applicable, l'Exploitant (ainsi que ses dirigeants, employés ou partenaires) ne saurait être tenu responsable des dommages indirects, accessoires, matériels ou consécutifs (y compris, mais sans s'y limiter, la perte de données, de réputation, de profits ou d'opportunités commerciales) découlant de l'utilisation ou de l'impossibilité d'utiliser la Plateforme.
                </p>
                <p>
                  <strong>Clause d'Indemnisation :</strong> Le Coach s'engage à garantir, indemniser et protéger l'Exploitant face à toute plainte, réclamation ou action en justice (y compris les frais d'avocats raisonnables) intentée par un de ses Clients ou par un tiers, fondée sur (a) un manquement du Coach aux présentes CGU, ou (b) le Contenu ou les conseils sportifs/nutritionnels fournis par ledit Coach via la Plateforme.
                </p>
              </section>

              <section>
                <h2>10. Modifications des CGU</h2>
                <p>
                  L'Exploitant se réserve le droit de modifier les présentes CGU à tout moment, notamment pour se conformer aux évolutions légales ou techniques. En cas de modification substantielle, les Utilisateurs seront informés par email ou via une notification sur la Plateforme. Continuer à utiliser la Plateforme après de telles modifications vaut acceptation ferme des nouvelles CGU.
                </p>
              </section>

              <section>
                <h2>11. Force Majeure</h2>
                <p>
                  L'Exploitant ne pourra être tenu responsable de la non-exécution ou d'un retard dans l'exécution de ses obligations découlant des présentes CGU si cela résulte d'un cas de force majeure, tel que reconnu par la jurisprudence suisse (catastrophes naturelles, grèves, pandémies, coupures d'infrastructures télécoms, attaques de piratage massif, défaillances durables d'AWS/fournisseurs cloud).
                </p>
              </section>

              <section>
                <h2>12. Invalidité partielle et Intégralité de l'accord</h2>
                <p>
                  Si une ou plusieurs stipulations des présentes CGU sont tenues pour non valides ou déclarées comme telles en application d'une loi, d'un règlement ou à la suite d'une décision définitive d'une juridiction compétente, les autres stipulations garderont toute leur force et leur portée. Les présentes CGU constituent l'intégralité de l'accord entre l'Exploitant et l'Utilisateur.
                </p>
              </section>

              <section>
                <h2>13. Droit applicable et For juridique</h2>
                <p>
                  Les présentes Conditions Générales d'Utilisation sont exclusivement soumises au <strong>droit matériel suisse</strong>, à l'exclusion des règles de conflits de lois.
                </p>
                <p>
                  En cas de litige relatif à l'interprétation, la formation ou l'exécution des présentes CGU, interdisant une résolution à l'amiable, le for juridique est de la compétence exclusive des tribunaux du <strong>Canton de Genève (Suisse)</strong>, sous réserve impérative du for du domicile en matière de droit de la consommation (si et seulement si l'Utilisateur qualifie pour le statut de consommateur protégé au sens des lois suisses et/ou européennes applicables).
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;