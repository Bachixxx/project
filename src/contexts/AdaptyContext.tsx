import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { adapty } from '@adapty/capacitor';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './AuthContext';

// Replace with your actual Adapty Public API Key
const ADAPTY_PUBLIC_KEY = 'public_live_YOUR_API_KEY_HERE';

interface AdaptyContextType {
    loading: boolean;
    error: string | null;
    paywalls: any[];
    products: any[];
    profile: any | null;
    makePurchase: (product: any) => Promise<boolean>;
    restorePurchases: () => Promise<any>;
    hasPremium: () => boolean;
}

const AdaptyContext = createContext<AdaptyContextType | undefined>(undefined);

export function AdaptyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [paywalls, setPaywalls] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [profile, setProfile] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize Adapty
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            setLoading(false);
            return;
        }

        const initAdapty = async () => {
            try {
                await adapty.activate({ apiKey: ADAPTY_PUBLIC_KEY });

                if (user?.id) {
                    await adapty.identify({ customerUserId: user.id });
                }

                const profile = await adapty.getProfile();
                setProfile(profile);

                // Load Paywalls
                try {
                    const paywall = await adapty.getPaywall({ placementId: 'main_paywall', locale: 'en' });
                    const products = await adapty.getPaywallProducts({ paywall });

                    setPaywalls([paywall]);
                    setProducts(products);
                } catch (e: any) {
                    // specific error handling if needed
                    // console.log('Paywall error', e); 
                }

            } catch (err: any) {
                console.error('Adapty init error:', err);
                // Only set error if critical
                // setError(err.message || 'Failed to initialize Adapty');
            } finally {
                setLoading(false);
            }
        };

        initAdapty();
    }, [user?.id]);

    // Handle Purchase
    const makePurchase = async (product: any) => {
        try {
            setError(null);
            const purchaseResult = await adapty.makePurchase(product);

            if (purchaseResult.type === 'success') {
                setProfile(purchaseResult.profile);

                // Sync with backend
                import('../lib/supabase').then(({ supabase }) => {
                    supabase.functions.invoke('sync-mobile-subscription').catch(console.error);
                });

                return true;
            }
            return false;
        } catch (err: any) {
            console.error('Purchase error:', err);
            // Don't show error if user cancelled (code 2)
            if (err.code !== 2 && err.adaptyCode !== 2) {
                setError(err.message || 'Purchase failed');
            }
            throw err;
        }
    };

    // Restore Purchases
    const restorePurchases = async () => {
        try {
            const result = await adapty.restorePurchases();
            setProfile(result);

            // Sync with backend
            import('../lib/supabase').then(({ supabase }) => {
                supabase.functions.invoke('sync-mobile-subscription').catch(console.error);
            });

            return result;
        } catch (err: any) {
            console.error('Restore error:', err);
            setError(err.message || 'Failed to restore purchases');
            throw err;
        }
    };

    const hasPremium = useCallback(() => {
        if (!profile) return false;
        const premiumAccess = profile.accessLevels?.['premium'];
        return premiumAccess?.isActive || false;
    }, [profile]);

    const value = {
        loading,
        error,
        paywalls,
        products,
        profile,
        makePurchase,
        restorePurchases,
        hasPremium
    };

    return (
        <AdaptyContext.Provider value={value}>
            {children}
        </AdaptyContext.Provider>
    );
}

export function useAdaptyContext() {
    const context = useContext(AdaptyContext);
    if (context === undefined) {
        throw new Error('useAdaptyContext must be used within an AdaptyProvider');
    }
    return context;
}
