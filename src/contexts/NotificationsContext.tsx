import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';

// Suppress TS errors for Cordova plugin
const OneSignalNative = OneSignal as any;

interface NotificationsContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
    subscribe: () => Promise<void>;
    login: (externalId: string) => Promise<void>;
    logout: () => Promise<void>;
    addTag: (key: string, value: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Platform-specific initialization
        if (Capacitor.isNativePlatform()) {
            initNativeOneSignal();
        } else {
            // Web handling
            if ('Notification' in window) {
                setPermission(Notification.permission);
            }
        }
    }, []);

    const initNativeOneSignal = async () => {
        try {
            console.log('Attempting to initialize Native OneSignal (v5 API)...');

            // v5 Authorization & Initialization
            // 1. Initialize with App ID
            // "initialize" is the new method relative to root
            OneSignalNative.initialize("4554f523-0919-4c97-9df2-acdd2f459914");

            // 2. Setup Notification Handler
            // v5 uses OneSignal.Notifications namespace
            OneSignalNative.Notifications.addEventListener('click', (event: any) => {
                console.log('notificationOpenedCallback: ', event);
            });

            // 3. Request Permission
            console.log('OneSignal Initialized. Requesting permission...');
            await requestPermission();
        } catch (error) {
            console.error('Error initializing Native OneSignal:', error);
        }
    };

    const requestPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            // v5 Native Prompt
            // OneSignal.Notifications.requestPermission(true)
            OneSignalNative.Notifications.requestPermission(true).then((accepted: boolean) => {
                console.log("User accepted notifications: " + accepted);
                setPermission(accepted ? 'granted' : 'denied');
            });
        } else {
            // Web Prompt
            if ('Notification' in window) {
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result === 'granted') {
                    console.log('Notification permission granted.');
                    await subscribe();
                }
            }
        }
    };

    const subscribe = async () => {
        // For OneSignal, the subscription is handled by the SDK
        console.log('Subscribe called - handled by OneSignal app_id');
    };

    const login = async (externalId: string) => {
        if (Capacitor.isNativePlatform()) {
            // v5 Login
            OneSignalNative.login(externalId);
        } else {
            // @ts-ignore
            if (window.OneSignalDeferred) {
                // @ts-ignore
                window.OneSignalDeferred.push(function (OneSignal) {
                    OneSignal.login(externalId);
                });
            }
        }
    };

    const logout = async () => {
        if (Capacitor.isNativePlatform()) {
            OneSignalNative.logout();
        } else {
            // @ts-ignore
            if (window.OneSignalDeferred) {
                // @ts-ignore
                window.OneSignalDeferred.push(function (OneSignal) {
                    OneSignal.logout();
                });
            }
        }
    };

    const addTag = async (key: string, value: string) => {
        if (Capacitor.isNativePlatform()) {
            // v5 Tagging via User namespace
            OneSignalNative.User.addTag(key, value);
        } else {
            // @ts-ignore
            if (window.OneSignalDeferred) {
                // @ts-ignore
                window.OneSignalDeferred.push(function (OneSignal) {
                    OneSignal.User.addTag(key, value);
                });
            }
        }
    };

    return (
        <NotificationsContext.Provider value={{ permission, requestPermission, subscribe, login, logout, addTag }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
