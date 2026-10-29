import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EventRegistration } from '../../types/app.types';
import { EventInvitationData } from '../../services/eventService';
import { Clock, MessageCircle, AlertCircle, Scale, RefreshCw, ShieldAlert } from 'lucide-react';

export interface PendingStatusViewProps {
  registration: EventRegistration;
  event: EventInvitationData;
  onLogout: () => void;
  onRefresh?: () => void;
}

export const PendingStatusView: React.FC<PendingStatusViewProps> = ({
  registration,
  event,
  onLogout,
  onRefresh,
}) => {
  const isRejected = registration.status === 'rejected';
  const isSuspended = registration.status === 'suspended';
  const hasValidWhatsApp = !!event.whatsapp_group_url && event.whatsapp_group_url.startsWith('https://');

  const [isChecking, setIsChecking] = useState(false);

  // Verificação periódica automática controlada enquanto aguarda aprovação
  useEffect(() => {
    if (!onRefresh || isRejected || isSuspended) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [isRejected, isSuspended]);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsChecking(true);
    await onRefresh();
    setTimeout(() => setIsChecking(false), 800);
  };

  const getHeaderAccent = () => {
    if (isRejected || isSuspended) return 'red';
    return 'gold';
  };

  const getStatusTitle = () => {
    if (isRejected) return 'Inscrição Recusada';
    if (isSuspended) return 'Inscrição Suspensa';
    return 'Aguardando Moderação';
  };

  const getBadgeVariant = () => {
    if (isRejected) return 'rejected';
    if (isSuspended) return 'suspended';
    return 'pending';
  };

  const getBadgeText = () => {
    if (isRejected) return 'Status: Recusado';
    if (isSuspended) return 'Status: Suspenso pela Organização';
    return 'Status: Em Análise pela Organização';
  };

  const getMessageText = () => {
    if (isRejected) {
      return `Motivo informado pela organização: ${
        registration.rejection_reason || 'Dados inconsistentes ou foto inadequada. Entre em contato para regularizar.'
      }`;
    }
    if (isSuspended) {
      return `Motivo da suspensão: ${
        registration.rejection_reason || 'Acesso suspenso temporariamente pela comissão organizadora.'
      }`;
    }
    return `Sua inscrição para o evento "${event.title}" foi recebida com sucesso. Por motivos de segurança e integridade, os cards de confrontos e o chaveamento oficial são desbloqueados assim que a organização aprovar seus dados.`;
  };

  return (
    <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4) 0' }}>
      <Card headerAccent={getHeaderAccent()}>
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isRejected || isSuspended ? 'var(--color-red-muted)' : 'var(--color-status-pending-bg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isRejected || isSuspended ? 'var(--color-red-primary)' : 'var(--color-status-pending)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {isRejected ? <AlertCircle size={34} /> : isSuspended ? <ShieldAlert size={34} /> : <Clock size={34} />}
          </div>

          <h2 style={{ fontSize: 'var(--font-size-xl)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            {getStatusTitle()}
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <Badge variant={getBadgeVariant()}>
              {getBadgeText()}
            </Badge>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: '420px', margin: '0 auto var(--space-6)', lineHeight: 1.5 }}>
            {getMessageText()}
          </p>

          {/* Dados Declarados */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              textAlign: 'left',
              marginBottom: 'var(--space-6)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Scale size={16} color="var(--color-gold-primary)" />
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                Dados da Inscrição Enviada
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Peso Declarado: <strong style={{ color: '#fff' }}>{Number(registration.declared_weight).toFixed(2)} kg</strong>
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Categoria: <strong style={{ color: '#fff' }}>{registration.weight_category?.name || 'Aguardando alocação'}</strong>
            </p>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {onRefresh && (
              <Button
                variant="gold"
                size="md"
                fullWidth
                isLoading={isChecking}
                leftIcon={<RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />}
                onClick={handleManualRefresh}
              >
                Verificar Aprovação Agora
              </Button>
            )}

            {hasValidWhatsApp && (
              <Button
                variant="gold"
                size="md"
                fullWidth
                leftIcon={<MessageCircle size={20} />}
                onClick={() => window.open(event.whatsapp_group_url!, '_blank')}
              >
                Falar com a Organização no WhatsApp
              </Button>
            )}

            <Button variant="ghost" size="md" fullWidth onClick={onLogout}>
              Sair da Conta
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
