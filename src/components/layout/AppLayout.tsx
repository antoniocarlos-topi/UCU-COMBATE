import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { LogIn, Shield } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isConvite =
    location.pathname.startsWith('/convite') ||
    location.pathname.startsWith('/e/') ||
    location.pathname.startsWith('/inscrever');
  const isAtleta = location.pathname.startsWith('/atleta');

  // Se for página de convite ou inscrição isolada, renderizar layout autônomo sem barras gerais
  if (isConvite) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          padding: 'var(--space-4) 0',
        }}
      >
        <div className="app-container">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
      }}
    >
      <MobileHeader
        rightAction={
          user ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Shield size={14} />}
              onClick={() => navigate('/atleta')}
            >
              Meu Card
            </Button>
          ) : (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<LogIn size={14} />}
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
          )
        }
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: isAtleta ? 0 : 'var(--space-6)',
          paddingTop: 'var(--space-4)',
        }}
      >
        <div className="app-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
