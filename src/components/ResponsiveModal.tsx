import React, { Fragment } from 'react';
import { X } from 'lucide-react';

interface ResponsiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    noPadding?: boolean;
}

export function ResponsiveModal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'max-w-2xl',
    noPadding = false
}: ResponsiveModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={`
          relative w-full h-[95vh] sm:h-auto sm:max-h-[85vh] 
          bg-gray-900 sm:bg-gray-900/95 sm:backdrop-blur-xl 
          border-t sm:border border-white/10 
          rounded-t-2xl sm:rounded-2xl 
          shadow-2xl flex flex-col
          transform transition-all animate-slide-in-bottom sm:animate-fade-in
          ${maxWidth}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-xl font-bold text-white truncate pr-4">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors touch-target"
                        aria-label="Fermer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar overscroll-contain ${noPadding ? '' : 'p-4 sm:p-6'}`}>
                    {children}
                </div>

                {/* Footer (Optional) */}
                {footer && (
                    <div className="p-4 border-t border-white/10 shrink-0 bg-gray-900/50 sm:bg-transparent pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
