import React, { createContext, useContext, useState, useEffect } from 'react';

interface LiveSessionState {
    isActive: boolean;
    clientId: string | null;
    sessionId: string | null;
    startTime: Date | null;
    programSessionId?: string | null;
    scheduledSessionId?: string | null;
}

interface LiveSessionContextType {
    sessionState: LiveSessionState;
    startSession: (data: Omit<LiveSessionState, 'isActive' | 'startTime'>) => void;
    endSession: () => void;
}

const LiveSessionContext = createContext<LiveSessionContextType | undefined>(undefined);

export function LiveSessionProvider({ children }: { children: React.ReactNode }) {
    const [sessionState, setSessionState] = useState<LiveSessionState>(() => {
        const saved = localStorage.getItem('coachency_live_session');
        return saved ? JSON.parse(saved) : {
            isActive: false,
            clientId: null,
            sessionId: null,
            startTime: null,
        };
    });

    useEffect(() => {
        localStorage.setItem('coachency_live_session', JSON.stringify(sessionState));
    }, [sessionState]);

    const startSession = (data: Omit<LiveSessionState, 'isActive' | 'startTime'>) => {
        setSessionState({
            ...data,
            isActive: true,
            startTime: new Date(),
        });
    };

    const endSession = () => {
        setSessionState({
            isActive: false,
            clientId: null,
            sessionId: null,
            startTime: null,
        });
        localStorage.removeItem('coachency_live_session');
    };

    return (
        <LiveSessionContext.Provider value={{ sessionState, startSession, endSession }}>
            {children}
        </LiveSessionContext.Provider>
    );
}

export function useLiveSession() {
    const context = useContext(LiveSessionContext);
    if (context === undefined) {
        throw new Error('useLiveSession must be used within a LiveSessionProvider');
    }
    return context;
}
