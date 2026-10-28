import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="animate-scale-in"
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
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <BrandLogo size="md" />
      </div>

      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-gold-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gold-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Compass size={36} />
      </div>

      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
        404 — Página Não Encontrada
      </h2>

      <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', marginBottom: 'var(--space-6)' }}>
        O endereço que você tentou acessar não existe ou este confronto ainda não foi registrado na U.C.U Arena.
      </p>

      <Button variant="gold" size="lg" onClick={() => navigate('/')}>
        Voltar à Página Principal
      </Button>
    </div>
  );
};
