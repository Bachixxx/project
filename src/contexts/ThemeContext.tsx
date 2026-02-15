import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useClientAuth } from '../contexts/ClientAuthContext';

interface BrandingSettings {
    primaryColor?: string;
    logoUrl?: string;
    theme?: 'dark' | 'light';
    welcomeMessage?: string;
    appName?: string;
    dashboardHeroImage?: string; // Added field
}

interface ThemeContextType {
    branding: BrandingSettings | null;
    isLoading: boolean;
    refreshBranding: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
    branding: null,
    isLoading: true,
    refreshBranding: async () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { client } = useClientAuth();
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to hex to rgb
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
            : null;
    };

    const applyTheme = (settings: BrandingSettings) => {
        if (settings.primaryColor) {
            const rgb = hexToRgb(settings.primaryColor);
            if (rgb) {
                // We override the Tailwind CSS variables for colors
                // Assuming your Tailwind config uses --color-primary-500 or similar
                // But checking index.css, it seems 'primary-500' might be a class or defined in tailwind.config.js
                // If defined via CSS variables in index.css as standard practice:

                // However, checking provided CSS index.css:
                // :root { --glow-color: 14, 165, 233; }
                // It seems colors are likely defined in tailwind.config.js using colors directly or vars.
                // I will attempt to inject CSS variables that map to the configured primary colors.

                // Ideally, we should update index.css to use CSS variables for primary colors so we can override them easily.
                // For now, I will set a CSS variable `--primary-brand` and we might need to update tailwind config to use it.

                // Actually, looking at index.css line 38: 
                // @apply ... bg-gradient-to-r from-primary-500 ...

                // Implementation Strategy:
                // 1. Define --primary-500, --primary-600 etc in :root
                // 2. Update tailwind.config.js to assign primary color to these variables.

                // For this step, I'll just set the variables on the document root.
                document.documentElement.style.setProperty('--color-primary-500', rgb.replace(/ /g, ', ')); // If tailwind uses comma separated
                // Or specific overrides if using a style tag
            }
        }
    };

    const fetchBranding = async () => {
        try {
            // If we are logged in as a client, we fetch our coach's branding
            if (client?.coach_id) {
                const { data, error } = await supabase
                    .from('coaches')
                    .select('branding_settings')
                    .eq('id', client.coach_id)
                    .single();

                if (data?.branding_settings) {
                    setBranding(data.branding_settings as BrandingSettings);
                } else {
                    // Coach has no branding, reset to default
                    setBranding(null);
                }
            } else {
                // No coach linked, reset to default
                setBranding(null);
            }
            // Note: If logged in as a Coach, we might want to preview our own branding? 
            // For now, let's focus on Client view.

        } catch (error) {
            console.error('Error fetching branding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBranding();
    }, [client]);

    return (
        <ThemeContext.Provider value={{ branding, isLoading, refreshBranding: fetchBranding }}>
            {/* We can use a style tag to inject dynamic styles */}
            {branding?.primaryColor && (
                <style>{`
          :root {
            /* We need to know exact Tailwind behavior. 
               If colors are hardcoded in tailwind.config.js, this won't work easily without changing config.
               I will assume for now we will modify tailwind config to use 'var(--primary-color)' 
            */
            --primary-color-hex: ${branding.primaryColor};
            /* Generate some shades if possible or just use one for now */
          }
        `}</style>
            )}
            {children}
        </ThemeContext.Provider>
    );
}
