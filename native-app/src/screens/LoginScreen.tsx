import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { User, Mail, Lock, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        try {
            setError('');
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message === 'Invalid login credentials') {
                    setError('Email ou mot de passe incorrect.');
                } else {
                    setError('Erreur de connexion. Réessayez.');
                }
            }
        } catch (err) {
            setError('Erreur de connexion. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#020617]">
            <StatusBar style="light" />

            {/* Background Glow Effects */}
            <View className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-40"
                style={{ backgroundColor: 'rgba(5, 150, 105, 0.12)' }}
            />
            <View className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-30"
                style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }}
            />

            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="flex-1 justify-center px-6 py-12">

                            {/* Glass Card */}
                            <View
                                className="rounded-[32px] overflow-hidden"
                                style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 30 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 60,
                                    elevation: 20,
                                }}
                            >
                                {/* Top gradient glow */}
                                <View
                                    className="absolute top-0 left-0 right-0 h-40 rounded-t-[32px]"
                                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
                                />

                                <View className="px-8 py-10">

                                    {/* Icon + Title */}
                                    <View className="items-center mb-8">
                                        <View
                                            className="w-16 h-16 rounded-2xl items-center justify-center mb-6"
                                            style={{
                                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(255, 255, 255, 0.05)',
                                            }}
                                        >
                                            <User color="#34d399" size={32} />
                                        </View>
                                        <Text className="text-3xl font-bold text-white tracking-tight mb-2">
                                            Bonjour !
                                        </Text>
                                        <Text className="text-sm text-slate-400 font-light text-center">
                                            Accédez à votre programme et suivez vos progrès
                                        </Text>
                                    </View>

                                    {/* Error Message */}
                                    {error ? (
                                        <View
                                            className="flex-row items-start p-4 rounded-xl mb-6"
                                            style={{
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(239, 68, 68, 0.2)',
                                            }}
                                        >
                                            <AlertCircle color="#f87171" size={20} />
                                            <Text className="text-red-400 text-sm ml-3 flex-1">{error}</Text>
                                        </View>
                                    ) : null}

                                    {/* Email Field */}
                                    <View className="mb-4">
                                        <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">
                                            EMAIL
                                        </Text>
                                        <View
                                            className="flex-row items-center rounded-2xl px-4"
                                            style={{
                                                backgroundColor: 'rgba(2, 6, 23, 0.6)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(255, 255, 255, 0.05)',
                                                height: 56,
                                            }}
                                        >
                                            <Mail color="#64748b" size={20} />
                                            <TextInput
                                                className="flex-1 text-white font-medium ml-3"
                                                placeholder="client@exemple.com"
                                                placeholderTextColor="#475569"
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                autoComplete="email"
                                            />
                                        </View>
                                    </View>

                                    {/* Password Field */}
                                    <View className="mb-4">
                                        <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5">
                                            MOT DE PASSE
                                        </Text>
                                        <View
                                            className="flex-row items-center rounded-2xl px-4"
                                            style={{
                                                backgroundColor: 'rgba(2, 6, 23, 0.6)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(255, 255, 255, 0.05)',
                                                height: 56,
                                            }}
                                        >
                                            <Lock color="#64748b" size={20} />
                                            <TextInput
                                                className="flex-1 text-white font-medium ml-3"
                                                placeholder="••••••••"
                                                placeholderTextColor="#475569"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                autoComplete="password"
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowPassword(!showPassword)}
                                                className="p-2"
                                            >
                                                {showPassword ? (
                                                    <Eye color="#64748b" size={18} />
                                                ) : (
                                                    <EyeOff color="#64748b" size={18} />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Forgot Password */}
                                    <View className="flex-row justify-end mb-6">
                                        <TouchableOpacity>
                                            <Text className="text-sm font-medium text-emerald-400">
                                                Mot de passe oublié ?
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Login Button */}
                                    <TouchableOpacity
                                        onPress={handleLogin}
                                        disabled={loading}
                                        className="rounded-2xl overflow-hidden"
                                        style={{
                                            opacity: loading ? 0.5 : 1,
                                            shadowColor: 'rgba(16, 185, 129, 0.3)',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 1,
                                            shadowRadius: 30,
                                            elevation: 10,
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <View
                                            className="py-4 px-6 rounded-2xl flex-row items-center justify-center"
                                            style={{
                                                backgroundColor: '#059669',
                                            }}
                                        >
                                            {loading ? (
                                                <View className="flex-row items-center">
                                                    <ActivityIndicator color="#fff" size="small" />
                                                    <Text className="text-white font-bold text-base ml-2">Connexion...</Text>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center">
                                                    <Text className="text-white font-bold text-base">Se connecter</Text>
                                                    <ChevronRight color="#fff" size={20} />
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Register Link */}
                                    <View className="mt-8 pt-6 items-center"
                                        style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <Text className="text-sm text-slate-400 font-light">
                                            Pas encore de compte ?{' '}
                                            <Text className="font-medium text-emerald-400">
                                                Activez votre accès
                                            </Text>
                                        </Text>
                                    </View>

                                </View>
                            </View>

                            {/* Version */}
                            <Text className="text-center text-slate-600 text-xs mt-6 font-light">
                                Coachency · v2.0
                            </Text>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
