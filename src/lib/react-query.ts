import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 5 minutes
            // This means if you navigate back to a page within 5 minutes, 
            // it won't even trigger a background refetch
            staleTime: 5 * 60 * 1000,

            // Keep unused data in memory for 24 hours
            // This ensures that even "stale" data is available instantly
            // while the background refetch happens
            gcTime: 24 * 60 * 60 * 1000,

            // Retry failed queries 1 time only to avoid spamming on offline
            retry: 1,

            // Refetch on window focus is great for web, but for "native" feel
            // sometimes it can be too aggressive. Keeping it true for now ensures up-to-date data.
            refetchOnWindowFocus: true,
        },
    },
});
