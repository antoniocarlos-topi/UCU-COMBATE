import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MessageCircle, HeartHandshake, ArrowLeft } from 'lucide-react';

export interface RefusalModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl?: string | null;
}

export const RefusalModal: React.FC<RefusalModalProps> = ({
  isOpen,
  onClose,
  whatsappUrl,
}) => {
  const hasValidWhatsApp = !!whatsappUrl && whatsappUrl.startsWith('https://');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agradecemos sua Atenção">
      <div style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <HeartHandshake size={32} />
        </div>

        <h3
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 'var(--space-2)',
          }}
        >
          Compreendemos sua Decisão!
        </h3>

        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-6)',
          }}
        >
          Agradecemos imensamente por responder ao nosso comunicado oficial. Mesmo não subindo ao ringue desta vez, convidamos você a fazer parte da nossa torcida e acompanhar os bastidores do evento.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {hasValidWhatsApp ? (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<MessageCircle size={20} color="#25D366" />}
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              Acompanhar no Grupo do WhatsApp
            </Button>
          ) : (
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              Fique atento aos próximos comunicados e avisos oficiais da U.C.U Arena.
            </div>
          )}

          <Button variant="ghost" size="md" fullWidth leftIcon={<ArrowLeft size={16} />} onClick={onClose}>
            Voltar ao Convite
          </Button>
        </div>
      </div>
    </Modal>
  );
};
