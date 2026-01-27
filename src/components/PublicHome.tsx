import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClientAuth } from '../contexts/ClientAuthContext';
import Home from '../pages/Home';
import Loading from './Loading';

const PublicHome = () => {
    const { user, loading: authLoading } = useAuth();
    const { client, loading: clientLoading } = useClientAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !clientLoading) {
            if (user) {
                navigate('/dashboard');
            } else if (client) {
                navigate('/client/dashboard');
            }
        }
    }, [user, client, authLoading, clientLoading, navigate]);

    if (authLoading || clientLoading) {
        return <Loading />;
    }

    return <Home />;
};

export default PublicHome;
