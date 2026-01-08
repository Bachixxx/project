import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';

function ClientPrivateRoute({ children }) {
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

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/client/login" replace />;
  }

  if (isClient === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ClientPrivateRoute;