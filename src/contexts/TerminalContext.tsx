
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StripeTerminal, ConnectionStatus, ReaderInterface } from '@capacitor-community/stripe-terminal';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface TerminalContextType {
    terminal: typeof StripeTerminal | null;
    reader: any;
    connectionStatus: ConnectionStatus;
    initialize: () => Promise<void>;
    connectLocalReader: () => Promise<boolean>;
    collectPayment: (paymentIntent: string) => Promise<void>;
    isReady: boolean;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [terminal] = useState(() => StripeTerminal);
    const [reader, setReader] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.NotConnected);
    const [isReady, setIsReady] = useState(false);

    // Initialize Terminal SDK
    const initialize = async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await terminal.initialize({
                tokenProvider: async () => {
                    // Fetch coach profile to get stripe_account_id
                    const { data: coach, error: coachError } = await supabase
                        .from('coaches')
                        .select('stripe_account_id')
                        .eq('id', user?.id)
                        .single();

                    if (coachError || !coach?.stripe_account_id) {
                        console.error('Failed to fetch coach stripe account:', coachError);
                        throw new Error('Coach has no connected Stripe account');
                    }

                    // Fetch connection token using the coach's account ID
                    const { data, error } = await supabase.functions.invoke('create-stripe-connection-token', {
                        body: {
                            stripe_account_id: coach.stripe_account_id
                        }
                    });

                    if (error) throw error;
                    return data.secret;
                }
            });
            setIsReady(true);
            console.log('Stripe Terminal initialized');

            // Listeners
            terminal.addListener('didReportReaderEvent', (event: any) => {
                console.log('Reader Event:', event);
            });

        } catch (err) {
            console.error('Error initializing Stripe Terminal:', err);
        }
    };

    // Connect to Local Mobile Reader (The Device itself)
    const connectLocalReader = async (): Promise<boolean> => {
        if (!isReady) {
            try {
                await initialize();
            } catch (e) {
                alert("Erreur init: " + (e as any).message);
                return false;
            }
        }

        try {
            // 1. Discover Readers
            // @ts-ignore
            const result = await terminal.discoverReaders({
                discoveryMethod: 'localMobile',
                simulated: true // Enabled for testing without paid account
            });

            if (result.readers.length > 0) {
                const selectedReader = result.readers[0];
                // 2. Connect
                // @ts-ignore
                const connectResult = await terminal.connectReader({
                    reader: selectedReader
                });

                if (connectResult.reader) {
                    setReader(connectResult.reader);
                    setConnectionStatus(ConnectionStatus.Connected);
                    return true;
                }
            } else {
                alert("Aucun lecteur trouvé.");
                return false;
            }
        } catch (err) {
            console.error('Error connecting to local reader:', err);
            alert("Erreur connexion lecteur: " + (err as any).message);
            return false;
        }
        return false;
    };

    const collectPayment = async (clientSecret: string) => {
        try {
            await terminal.collectPaymentMethod({ paymentIntent: clientSecret });
            await terminal.processPayment({ paymentIntent: clientSecret });
        } catch (err) {
            console.error('Payment failed:', err);
            throw err;
        }
    };

    useEffect(() => {
        if (Capacitor.isNativePlatform() && user) {
            initialize();
        }
    }, [user]);

    return (
        <TerminalContext.Provider value={{
            terminal,
            reader,
            connectionStatus,
            initialize,
            connectLocalReader,
            collectPayment,
            isReady
        }}>
            {children}
        </TerminalContext.Provider>
    );
};

export const useTerminal = () => {
    const context = useContext(TerminalContext);
    if (context === undefined) {
        throw new Error('useTerminal must be used within a TerminalProvider');
    }
    return context;
};
