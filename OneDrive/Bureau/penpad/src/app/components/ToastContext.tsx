'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    duration?: number,
    options?: { actionLabel?: string; onAction?: () => void }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration: number = 3000,
    options?: { actionLabel?: string; onAction?: () => void }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, message, type, duration, ...options };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-row gap-2">
        {toasts.map((toast) => (
          <div key={toast.id}>
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
              actionLabel={toast.actionLabel}
              onAction={toast.onAction}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 