import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import Loading from '../Loading';

function ClientPrivateRoute({ children }: { children: React.ReactNode }) {
  const { client, loading } = useClientAuth();
  const [isClient, setIsClient] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyClient = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Check if user is a coach (should not have access to client space)
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (coachData) {
          setIsClient(false);
        } else {
          setIsClient(true);
        }
      } catch (error) {
        console.error('Error verifying client:', error);
        setIsClient(false);
      } finally {
        setChecking(false);
      }
    };

    verifyClient();
  }, [client]);

  const location = useLocation();

  if (loading || checking) {
    return <Loading />;
  }

  if (!client) {
    return <Navigate to="/client/login" replace />;
  }

  if (isClient === false) {
    return <Navigate to="/login" replace />;
  }

  // Check onboarding status
  if (!client.onboarding_completed && location.pathname !== '/client/onboarding') {
    return <Navigate to="/client/onboarding" replace />;
  }

  if (client.onboarding_completed && location.pathname === '/client/onboarding') {
    return <Navigate to="/client/dashboard" replace />;
  }

  return children;
}

export default ClientPrivateRoute;