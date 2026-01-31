import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SplashScreen from './SplashScreen';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const [isCoach, setIsCoach] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyCoach = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        setIsCoach(!!coachData);
      } catch (error) {
        console.error('Error verifying coach:', error);
        setIsCoach(false);
      } finally {
        setChecking(false);
      }
    };

    verifyCoach();
  }, [user]);

  if (loading || checking) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isCoach === false) {
    return <Navigate to="/client/login" replace />;
  }

  return children;
}

export default PrivateRoute;