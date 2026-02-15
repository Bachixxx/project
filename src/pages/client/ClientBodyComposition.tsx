import React from 'react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { PageHero } from '../../components/client/shared/PageHero';
import { BiometricsDashboard } from '../../components/client/biometrics/BiometricsDashboard';
import { TutorialCard } from '../../components/client/TutorialCard';

function ClientBodyComposition() {
    const { client } = useClientAuth();

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24">
            <PageHero
                title="Biométrie"
                subtitle="Suivez l'évolution de votre corps : poids, mensurations, et composition."
                backgroundImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
                showBackButton={true}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 space-y-8">
                <TutorialCard
                    tutorialId="biometrics_intro"
                    title="Votre évolution corporelle 📉"
                    message="Suivez votre poids, vos mensurations et vos photos de progression. Ajoutez régulièrement de nouvelles mesures pour visualiser votre transformation."
                />

                {client?.id && <BiometricsDashboard clientId={client.id} readOnly={false} />}
            </div>
        </div>
    );
}

export default ClientBodyComposition;
