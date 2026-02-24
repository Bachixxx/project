import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Loading from '../Loading';

function CoachPrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (!user) {
                setChecking(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('coaches')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                setOnboardingCompleted(data?.onboarding_completed ?? false);
            } catch (error) {
                console.error('Error checking coach onboarding status:', error);
                // Default to false if we can't fetch it, forcing them to the onboarding screen just in case
                setOnboardingCompleted(false);
            } finally {
                setChecking(false);
            }
        };

        if (!authLoading) {
            checkOnboardingStatus();
        }
    }, [user, authLoading]);

    if (authLoading || checking) {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // They are logged in, now routing logic based on onboarding status
    if (onboardingCompleted === false && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    if (onboardingCompleted === true && location.pathname === '/onboarding') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export default CoachPrivateRoute;
