import React, { createContext, useContext, useEffect, useState } from 'react';

interface NotificationsContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
    subscribe: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        // Register Service Worker
        // Note: OneSignal handles SW registration now
        // if ('serviceWorker' in navigator) {
        //     navigator.serviceWorker.register('/sw.js')
        //         .then(registration => {
        //             console.log('Service Worker registered with scope:', registration.scope);
        //         })
        //         .catch(error => {
        //             console.error('Service Worker registration failed:', error);
        //         });
        // }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                console.log('Notification permission granted.');
                // Here we would typically trigger the subscription logic
                await subscribe();
            }
        }
    };

    const subscribe = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;

            // Note: In a real implementation with VAPID, we would pass the public key here
            // const subscription = await registration.pushManager.subscribe({
            //   userVisibleOnly: true,
            //   applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
            // });

            console.log('User is ready to be subscribed to push notifications.');
            // Then send subscription to backend
        }
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
