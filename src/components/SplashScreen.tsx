import React from 'react';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] animate-fade-in">
            <div className="relative flex flex-col items-center">
                <img
                    src="/app-logo.jpg"
                    alt="Coachency"
                    className="w-32 h-32 md:w-48 md:h-48 rounded-2xl shadow-2xl mb-8 animate-pulse-slow"
                />
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        </div>
    );
};

export default SplashScreen;
