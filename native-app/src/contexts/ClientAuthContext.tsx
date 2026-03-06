import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    client: any | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, client: null, isLoading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [client, setClient] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClient = async (authId: string) => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('auth_id', authId)
                .maybeSingle();

            if (error) throw error;
            setClient(data);
        } catch (err) {
            console.error('Error fetching client profile:', err);
            setClient(null);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (isMounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        await fetchClient(session.user.id);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (isMounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        await fetchClient(session.user.id);
                    } else {
                        setClient(null);
                    }
                }
            } catch (err) {
                console.error('Auth state change error:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, client, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
