import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', durationMs = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    if (durationMs > 0) {
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    }
  }, [removeToast]);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} color="var(--color-status-approved)" />,
    error: <AlertCircle size={18} color="var(--color-status-rejected)" />,
    warning: <AlertTriangle size={18} color="var(--color-status-pending)" />,
    info: <Info size={18} color="var(--color-gold-primary)" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: 'var(--color-status-approved)',
    error: 'var(--color-status-rejected)',
    warning: 'var(--color-status-pending)',
    info: 'var(--color-gold-primary)',
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Container de Toasts no topo/centro para visualização no celular */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 'calc(var(--safe-area-top) + 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '440px',
          zIndex: 'var(--z-toast)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-slide-down interactive-tap"
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'var(--color-bg-surface-elevated)',
              backdropFilter: 'var(--glass-backdrop)',
              borderLeft: `4px solid ${borderColors[toast.type]}`,
              borderTop: '1px solid var(--color-border-subtle)',
              borderRight: '1px solid var(--color-border-subtle)',
              borderBottom: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {icons[toast.type]}
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
