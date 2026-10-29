import React from 'react';
import { ArenaEvent } from '../../types/app.types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Calendar, Plus, MapPin } from 'lucide-react';

export interface AdminEventSelectorProps {
  activeEvent: ArenaEvent;
  allEvents: ArenaEvent[];
  onSelectEvent: (slug: string) => void;
  onOpenCreateEventModal: () => void;
  onOpenEditEventModal: () => void;
}

export const AdminEventSelector: React.FC<AdminEventSelectorProps> = ({
  activeEvent,
  allEvents,
  onSelectEvent,
  onOpenCreateEventModal,
  onOpenEditEventModal,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open_for_registration':
        return <Badge variant="approved" size="sm">Inscrições Abertas</Badge>;
      case 'in_progress':
        return <Badge variant="live" size="sm" pulse>Ao Vivo</Badge>;
      case 'finished':
        return <Badge variant="neutral" size="sm">Concluído</Badge>;
      case 'archived':
        return <Badge variant="neutral" size="sm">Arquivado</Badge>;
      default:
        return <Badge variant="pending" size="sm">Rascunho</Badge>;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-surface-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold-primary)',
            }}
          >
            <Calendar size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={activeEvent.slug}
                onChange={(e) => onSelectEvent(e.target.value)}
                style={{
                  backgroundColor: '#111116',
                  color: '#ffffff',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {allEvents.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.title} {ev.status === 'archived' ? '(Arquivado)' : ''}
                  </option>
                ))}
              </select>

              {getStatusBadge(activeEvent.status)}
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={12} /> {activeEvent.location_name} • {new Date(activeEvent.event_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenEditEventModal}
          >
            Configurações
          </Button>

          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onOpenCreateEventModal}
          >
            Novo Evento
          </Button>
        </div>
      </div>
    </div>
  );
};
