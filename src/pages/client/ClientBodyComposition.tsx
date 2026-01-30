import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { BiometricsDashboard } from '../../components/client/biometrics/BiometricsDashboard';
import { AddBodyScanModal } from '../../components/client/biometrics/AddBodyScanModal';

function ClientBodyComposition() {
    const navigate = useNavigate();
    const { client } = useClientAuth();

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 pb-24 md:p-8">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="mb-4 p-2 -ml-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <ChevronLeft className="w-6 h-6" />
                    Retour
                </button>

                {client?.id && <BiometricsDashboard clientId={client.id} readOnly={false} />}
            </div>
        </div>
    );
}

export default ClientBodyComposition;
