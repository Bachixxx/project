import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';

// Suppress TS errors for Cordova plugin
const OneSignalNative = OneSignal as any;

interface NotificationsContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
    subscribe: () => Promise<void>;
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
            // Remove the 'window.plugins' check as we import directly
            // However, OneSignal cordova plugin might need to be accessed via window.plugins for safety if direct import fails in some setups
            // But 'onesignal-cordova-plugin' npm package exports a default object usually.

            // NOTE: Using the App ID found in index.html
            OneSignalNative.setAppId("4554f523-0919-4c97-9df2-acdd2f459914");

            OneSignalNative.setNotificationOpenedHandler(function (jsonData: any) {
                console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
            });

            // Trigger permission prompt immediately on init for Native
            console.log('OneSignal Initialized. Requesting permission...');
            await requestPermission();
        } catch (error) {
            console.error('Error initializing Native OneSignal:', error);
        }
    };

    const requestPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            // Native Prompt
            OneSignalNative.promptForPushNotificationsWithUserResponse(function (accepted: boolean) {
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
        // Logic for backend sync if needed
        // For OneSignal, the subscription is handled by the SDK
        console.log('Subscribe called - handled by OneSignal app_id');
    };

    return (
        <NotificationsContext.Provider value={{ permission, requestPermission, subscribe }}>
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
