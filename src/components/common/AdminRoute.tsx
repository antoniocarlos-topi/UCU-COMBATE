import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from './Loader';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setTimedOut(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return <Loader fullPage text="Validando privilégios administrativos..." />;
  }

  // Se não estiver logado, encaminha para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver logado mas não for admin, exibe tela de acesso restrito (sem falsificar segurança)
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-red-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-red-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          Acesso Restrito ao Administrador
        </h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', marginBottom: 'var(--space-6)' }}>
          Sua conta está autenticada, porém não possui privilégios de Administrador Principal na tabela oficial de permissões.
        </p>
        <Button variant="secondary" onClick={() => window.location.href = '/'}>
          Retornar à Página Principal
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
