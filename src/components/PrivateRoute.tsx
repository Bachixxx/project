import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Loading from './Loading';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const [isCoach, setIsCoach] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    const verifyCoach = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id, subscription_type')
          .eq('id', user.id)
          .maybeSingle();

        setIsCoach(!!coachData);

        // Trial Enforcement
        if (coachData) {
          const createdAt = new Date(user.created_at || ''); // Auth user creation date
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // If trial expired ( > 14 days) and still free plan
          if (coachData.subscription_type === 'free' && diffDays > 14) {
            // Redirect to pricing
            // We use window.location because Navigate might be intercepted or we want a hard redirect
            // actually standard Navigate via state might be better, but let's return a specific component or state
            setTrialExpired(true);
          }
        }

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
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isCoach === false) {
    return <Navigate to="/client/login" replace />;
  }

  if (trialExpired) {
    return <Navigate to="/pricing" state={{ reason: 'trial_expired' }} replace />;
  }

  return children;
}

export default PrivateRoute;