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
    const [loading, setLoading] = useState(true);
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
                                className="h-full flex flex-col relative w-full bg-slate-950 text-slate-100 font-sans overflow-x-hidden"
                                style={previewStyle}
                            >
                                {/* Dynamic Background Gradients */}
                                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                                    <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-emerald-600/10 rounded-full blur-2xl mix-blend-screen opacity-40"></div>
                                    <div className="absolute bottom-[10%] right-[-20%] w-[70%] h-[70%] bg-teal-600/10 rounded-full blur-2xl mix-blend-screen opacity-30"></div>
                                </div>

                                <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-16">
                                    {/* Immersive Hero Preview */}
                                    <div className="relative w-full shrink-0 min-h-[320px] flex flex-col justify-end pb-4">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity grayscale-[30%] pointer-events-none"
                                            style={{ backgroundImage: `url('${settings.dashboardHeroImage || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop"}')` }}
                                        ></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20 pointer-events-none"></div>
                                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none"></div>

                                        <div className="relative z-20 w-full px-4 mt-8 flex flex-col justify-between h-full">
                                            {/* Top Nav */}
                                            <div className="flex justify-between items-start mb-4 w-full">
                                                <div className="flex flex-col">
                                                    {/* Brand Header */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {settings.logoUrl ? (
                                                            <img src={settings.logoUrl} alt={settings.appName || 'Logo'} className="w-6 h-6 rounded-full border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] object-cover" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full border border-white/10 bg-slate-800/80 flex items-center justify-center shadow-lg">
                                                                <span className="text-white text-[10px] font-bold font-serif italic">C</span>
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate max-w-[120px]">{settings.appName || 'COACHENCY PRO'}</span>
                                                    </div>

                                                    {/* Welcome */}
                                                    <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                                        Bonjour Thomas.
                                                    </h1>

                                                    {/* Custom Welcome Message */}
                                                    {settings.welcomeMessage && (
                                                        <p className="text-slate-300 text-xs mt-1 max-w-[200px] leading-snug">
                                                            {settings.welcomeMessage}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-slate-300 shadow-lg relative">
                                                    <div className="w-3.5 h-3.5 border-2 border-current rounded-t-full relative flex flex-col justify-end items-center"><div className="w-1 h-1 bg-current rounded-full translate-y-2"></div></div>
                                                </div>
                                            </div>

                                            {/* Next Session Card */}
                                            <div className="w-full relative z-20">
                                                <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-4 rounded-[1.5rem] flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                                                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/20 rounded-full blur-[30px] transition-colors duration-700 pointer-events-none"></div>

                                                    <div className="flex flex-col gap-1 relative z-10 mb-3 pb-3 border-b border-white/5">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                                            <span className="text-[8px] font-bold uppercase tracking-widest text-cyan-400">
                                                                Programme en cours
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-extrabold text-white tracking-tight leading-tight">
                                                            Pecs & Triceps
                                                        </h3>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className="text-slate-300 text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                                                                <div className="w-2.5 h-2.5 border border-current rounded-[2px] opacity-70"></div>
                                                                Jeu. 15 Mars
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button className="relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center">
                                                        <span className="relative z-10">Démarrer Entraînement</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col relative z-10 w-full px-4 gap-4 mt-2">
                                        {/* Stats Rail Preview */}
                                        <div className="flex gap-2 overflow-hidden">
                                            <div className="w-24 shrink-0 rounded-[1.2rem] bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 shadow-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Niveau</span>
                                                    <span className="text-sm">🏆</span>
                                                </div>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-xl font-black text-white tracking-tighter">12</span>
                                                </div>
                                            </div>
                                            <div className="w-24 shrink-0 rounded-[1.2rem] bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 shadow-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Série</span>
                                                    <span className="text-sm">🔥</span>
                                                </div>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-xl font-black text-white tracking-tighter">5</span>
                                                    <span className="text-[10px] text-slate-400 font-bold mb-1">J</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weekly chart preview */}
                                        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/10 w-full relative overflow-hidden mb-4">
                                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>
                                            <h4 className="text-[13px] font-extrabold text-white tracking-tight leading-none mb-1">Cette Semaine</h4>
                                            <p className="text-[10px] text-emerald-400 font-medium mb-3">3 séances terminées <span className="opacity-70">/ 7</span></p>

                                            <div className="flex items-end justify-between h-16 gap-1 relative z-10">
                                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => {
                                                    const isCompleted = i === 1 || i === 3;
                                                    const isToday = i === 4;
                                                    const heightPercentage = isCompleted ? '85%' : isToday ? '15%' : '20%';

                                                    return (
                                                        <div key={i} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                                                            <div className={`w-full max-w-[20px] rounded-lg relative overflow-hidden ${isCompleted ? 'bg-gradient-to-t from-emerald-600 to-teal-400' : isToday ? 'bg-slate-700/80 border border-slate-600' : 'bg-slate-800/50'}`} style={{ height: heightPercentage }}></div>
                                                            <span className={`text-[8px] font-bold ${isToday ? 'text-emerald-400' : isCompleted ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Nav */}
                                <div className="absolute bottom-0 w-full h-[52px] bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-4 z-50">
                                    <div className="p-2 text-emerald-400 flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 border-2 border-current rounded-[4px] opacity-90" />
                                    </div>
                                    <div className="p-2 text-slate-500 flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 border-2 border-current rounded-[4px] opacity-50" />
                                    </div>
                                    <div className="p-2 text-slate-500 flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 border-2 border-current rounded-[4px] opacity-50" />
                                    </div>
                                    <div className="p-2 text-slate-500 flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 border-2 border-current rounded-[4px] opacity-50" />
                                    </div>
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
