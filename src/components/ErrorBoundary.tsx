import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Auto-reload on chunk load errors (deployments)
        if (
            error.message.includes('Loading chunk') ||
            error.message.includes('MIME type') ||
            error.message.includes('Unexpected token')
        ) {
            // Prevent infinite reload loops if the error persists
            const lastReload = localStorage.getItem('last_chunk_reload');
            const now = Date.now();

            if (!lastReload || now - parseInt(lastReload) > 10000) {
                localStorage.setItem('last_chunk_reload', String(now));
                window.location.reload();
            }
        }
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            Une petite erreur est survenue
                        </h2>

                        <p className="text-gray-400 mb-8">
                            Une mise à jour a peut-être eu lieu pendant votre navigation.
                            Essayez de rafraîchir la page.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Rafraîchir la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
