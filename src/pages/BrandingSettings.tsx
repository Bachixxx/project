import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, Save, Palette, Layout, Smartphone } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface BrandingSettings {
    primaryColor?: string;
    logoUrl?: string;
    welcomeMessage?: string;
    appName?: string;
    dashboardHeroImage?: string; // NEW
}

function BrandingSettings() {
    const { user } = useAuth();
    // NEW: Use subscription hook
    const { subscriptionInfo, loading: subLoading, subscribeToBranding } = useSubscription();

    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<BrandingSettings>({
        primaryColor: '#0ea5e9', // Default Sky-500
        logoUrl: '',
        welcomeMessage: 'Bienvenue',
        appName: 'Coachency Client',
        dashboardHeroImage: '', // Default empty
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false); // NEW

    // Helper to convert Hex to Space-separated RGB for Tailwind
    const getRgbString = (hex: string | undefined) => {
        if (!hex) return '14 165 233'; // Default sky-500

        // Remove hash if present
        hex = hex.replace('#', '');

        let r, g, b;

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            return '14 165 233';
        }

        return `${r} ${g} ${b}`;
    };

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('coaches')
                .select('branding_settings')
                .eq('id', user?.id)
                .single();

            if (error) throw error;

            if (data?.branding_settings) {
                // Merge with defaults to avoid nulls
                setSettings({
                    primaryColor: data.branding_settings.primaryColor || '#0ea5e9',
                    logoUrl: data.branding_settings.logoUrl || '',
                    welcomeMessage: data.branding_settings.welcomeMessage || 'Bienvenue',
                    appName: data.branding_settings.appName || 'Coachency Client',
                    dashboardHeroImage: data.branding_settings.dashboardHeroImage || '',
                });
            }
        } catch (error) {
            console.error('Error fetching branding settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(event, 'logoUrl', setUploadingLogo);
    };

    const handleHeroUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(event, 'dashboardHeroImage', setUploadingHero);
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        settingKey: keyof BrandingSettings,
        setLoadingState: (loading: boolean) => void
    ) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            setLoadingState(true);
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${settingKey}_${Math.random()}.${fileExt}`;
            const filePath = `branding/${user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath);

            console.log('Upload successful. Public URL:', publicUrl);

            // Force cache busting for the image
            const publicUrlWithAuth = `${publicUrl}?t=${new Date().getTime()}`;

            setSettings(prev => {
                return { ...prev, [settingKey]: publicUrlWithAuth };
            });

        } catch (error) {
            console.error(`Error uploading ${settingKey}:`, error);
            alert('Erreur lors du téléchargement. Vérifiez la console.');
        } finally {
            setLoadingState(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('coaches')
                .update({
                    branding_settings: settings
                })
                .eq('id', user?.id);

            if (error) throw error;
            alert('Paramètres sauvegardés avec succès !');

        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    // NEW: Handle Branding Subscription
    const handleSubscribe = async () => {
        try {
            await subscribeToBranding();
        } catch (err) {
            alert("Erreur lors de la redirection vers le paiement.");
        }
    }

    if (subLoading) {
        return <div className="p-8 text-center text-gray-400">Chargement...</div>;
    }

    // NEW: Lock Screen Check
    if (!subscriptionInfo?.hasBranding) {
        return (
            <div className="container mx-auto px-4 py-8 relative min-h-[80vh] flex flex-col items-center justify-center">
                {/* Blurred Background Content */}
                <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none filter blur-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-6 h-64"></div>
                        <div className="border-[8px] rounded-[2.5rem] h-[600px] w-[320px] bg-gray-900 mx-auto"></div>
                    </div>
                </div>

                <div className="glass-card max-w-lg w-full p-8 relative z-10 text-center border-primary-500/30 shadow-2xl shadow-primary-500/10">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
                        <Palette className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Image de Marque Premium</h2>
                    <p className="text-gray-400 mb-8">
                        Personnalisez l'application client à vos couleurs, ajoutez votre logo et offrez une expérience 100% professionnelle à vos athlètes.
                    </p>

                    <ul className="text-left space-y-3 mb-8 bg-white/5 p-6 rounded-xl border border-white/10">
                        <li className="flex items-center gap-3 text-sm text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"><Layout className="w-3 h-3" /></div>
                            Logo personnalisé sur l'app client
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"><Palette className="w-3 h-3" /></div>
                            Couleurs de votre marque
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-200">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"><Smartphone className="w-3 h-3" /></div>
                            Message d'accueil personnalisé
                        </li>
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        Activer l'option (5 CHF / mois)
                    </button>
                    <p className="text-xs text-gray-500 mt-4">Annulable à tout moment</p>
                </div>
            </div>
        );
    }

    const colorPresets = [
        '#0ea5e9', // Sky (Default)
        '#ef4444', // Red
        '#f97316', // Orange
        '#eab308', // Yellow
        '#22c55e', // Green
        '#14b8a6', // Teal
        '#06b6d4', // Cyan
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#d946ef', // Fuchsia
        '#f43f5e', // Rose
    ];

    // Calculate dynamic style for preview
    const rgb = getRgbString(settings.primaryColor);
    const previewStyle = {
        '--color-primary-50': rgb,
        '--color-primary-100': rgb,
        '--color-primary-200': rgb,
        '--color-primary-300': rgb,
        '--color-primary-400': rgb,
        '--color-primary-500': rgb,
        '--color-primary-600': rgb,
        '--color-primary-700': rgb,
        '--color-primary-800': rgb,
        '--color-primary-900': rgb,
        '--color-primary-950': rgb,
        '--color-accent-400': rgb,
        '--color-accent-500': rgb,
    } as React.CSSProperties;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Image de Marque</h1>
                    <p className="text-gray-400">Personnalisez l'apparence de l'application pour vos clients.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 md:mt-0 px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <div className="loading loading-sm border-white" /> : <Save className="w-5 h-5" />}
                    Sauvegarder
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Settings */}
                <div className="space-y-8">

                    {/* Logo */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary-400" />
                            Logo
                        </h3>
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group">
                                {settings.logoUrl ? (
                                    <img
                                        src={settings.logoUrl}
                                        alt="Logo"
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <Layout className="w-10 h-10 text-gray-500" />
                                )}
                                {uploadingLogo && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="loading loading-sm border-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    Importer un logo
                                </label>
                                <p className="text-xs text-gray-500 mt-2">Format suggéré: PNG transparent, Carré.</p>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Hero Image */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-primary-400" />
                            Image d'accueil (Dashboard)
                        </h3>
                        <div className="flex items-center gap-6">
                            <div className="relative w-32 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group">
                                {settings.dashboardHeroImage ? (
                                    <img
                                        src={settings.dashboardHeroImage}
                                        alt="Hero"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-900 to-black opacity-50 flex items-center justify-center">
                                        <span className="text-xs text-gray-500">Défaut</span>
                                    </div>
                                )}
                                {uploadingHero && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="loading loading-sm border-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleHeroUpload}
                                    className="hidden"
                                    id="hero-upload"
                                />
                                <label
                                    htmlFor="hero-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    Changer l'image
                                </label>
                                <p className="text-xs text-gray-500 mt-2">Affiche en haut du tableau de bord client.</p>
                            </div>
                        </div>
                    </div>

                    {/* Messaging */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Personnalisation</h3>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Nom de l'application</label>
                            <input
                                type="text"
                                value={settings.appName}
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                className="input-field"
                                placeholder="Ex: Spartan App"
                                maxLength={20}
                            />
                            <p className="text-right text-xs text-gray-500 mt-1">{settings.appName?.length || 0}/20</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Message d'accueil</label>
                            <input
                                type="text"
                                value={settings.welcomeMessage}
                                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                                className="input-field"
                                placeholder="Ex: Bienvenue dans la Team Spartan"
                                maxLength={30}
                            />
                            <p className="text-right text-xs text-gray-500 mt-1">{settings.welcomeMessage?.length || 0}/30</p>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary-400" />
                            Couleurs
                        </h3>
                        <div className="grid grid-cols-6 gap-3">
                            {colorPresets.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSettings({ ...settings, primaryColor: color })}
                                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${settings.primaryColor === color ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Preview */}
                <div className="sticky top-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            Aperçu Client
                        </h3>
                        <div className="text-xs text-gray-500 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            Live Preview
                        </div>
                    </div>

                    {/* Mockup Phone */}
                    <div className="relative mx-auto border-gray-800 bg-gray-900 border-[8px] rounded-[2.5rem] h-[600px] w-[320px] shadow-2xl overflow-hidden flex flex-col">
                        {/* Status Bar */}
                        <div className="h-8 bg-black w-full absolute top-0 left-0 z-20 flex justify-between items-center px-6">
                            <span className="text-[10px] text-white font-medium">9:41</span>
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 bg-white rounded-full opacity-20" />
                                <div className="w-3 h-3 bg-white rounded-full opacity-20" />
                            </div>
                        </div>

                        {/* App Content */}
                        <div
                            className="flex-1 bg-[#0f172a] text-white overflow-hidden flex flex-col relative"
                        >
                            <div
                                id="preview-container"
                                className="h-full flex flex-col"
                                style={previewStyle}
                            >
                                {/* NEW: Immersive Hero Preview */}
                                <div className="relative w-full h-48 flex flex-col justify-end p-4 z-10">
                                    <div className="absolute inset-0 z-0">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/60 to-[#0f172a]" />
                                        <img
                                            src={settings.dashboardHeroImage || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"}
                                            alt="Hero"
                                            className="w-full h-full object-cover opacity-60"
                                        />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-lg font-bold">Bonjour, Thomas</h4>
                                        <p className="text-xs text-gray-300">Prêt à transpirer ? 🔥</p>
                                    </div>

                                    {/* Logo Overlay */}
                                    {settings.logoUrl && (
                                        <div className="absolute top-12 right-4 w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center p-1 z-20">
                                            <img src={settings.logoUrl} className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>


                                {/* Stats Rail Preview */}
                                <div className="px-4 -mt-2 relative z-10 flex gap-2 overflow-hidden mb-6 opacity-80">
                                    <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-2">
                                        <div className="text-xs text-gray-400">Niveau</div>
                                        <div className="font-bold">12</div>
                                    </div>
                                    <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-2">
                                        <div className="text-xs text-gray-400">Série</div>
                                        <div className="font-bold">5 J</div>
                                    </div>
                                    <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 p-2">
                                        <div className="text-xs text-gray-400">Poids</div>
                                        <div className="font-bold">75 kg</div>
                                    </div>
                                </div>

                                {/* Next Session Preview */}
                                <div className="px-4 mb-6">
                                    <div className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3">
                                            <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgb(var(--color-primary-500)/0.5)]"></div>
                                        </div>
                                        <span className="inline-block px-2 py-0.5 bg-primary-500 text-[10px] font-bold rounded-md mb-2">NEXT</span>
                                        <h3 className="font-bold text-sm mb-2">{settings.welcomeMessage}</h3>
                                        <button className="w-full py-2 rounded-xl bg-white text-blue-900 text-xs font-bold">
                                            COMMENCER
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Nav */}
                                <div className="mt-auto h-16 bg-white/5 backdrop-blur-md border-t border-white/10 flex justify-around items-center px-2">
                                    <div className="p-2 text-primary-500"><div className="w-6 h-6 bg-current rounded-md opacity-80" /></div>
                                    <div className="p-2 text-gray-600"><div className="w-6 h-6 bg-current rounded-md opacity-30" /></div>
                                    <div className="p-2 text-gray-600"><div className="w-6 h-6 bg-current rounded-md opacity-30" /></div>
                                    <div className="p-2 text-gray-600"><div className="w-6 h-6 bg-current rounded-md opacity-30" /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default BrandingSettings;
