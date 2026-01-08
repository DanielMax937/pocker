'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={hideToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast display component
function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    if (toasts.length === 0) return null;

    const getTypeStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-green-600 border-green-700';
            case 'error':
                return 'bg-red-600 border-red-700';
            case 'warning':
                return 'bg-yellow-600 border-yellow-700';
            case 'info':
            default:
                return 'bg-blue-600 border-blue-700';
        }
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`${getTypeStyles(toast.type)} text-white px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-slide-in`}
                    role="alert"
                >
                    <span className="text-lg">{getIcon(toast.type)}</span>
                    <p className="flex-1 text-sm">{toast.message}</p>
                    <button
                        onClick={() => onClose(toast.id)}
                        className="text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

// Add animation styles to global CSS or use inline styles
// For now, using Tailwind's animate utilities
