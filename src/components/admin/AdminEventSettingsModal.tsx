import React, { useState } from 'react';
import { ArenaEvent, EventStatus, EventFormat } from '../../types/app.types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useToast } from '../../contexts/ToastContext';
import {
  updateEventDetails,
  archiveEvent,
  deleteEventSafely,
} from '../../services/adminService';
import {
  Archive,
  Trash2,
  MapPin,
  MessageCircle,
} from 'lucide-react';

export interface AdminEventSettingsModalProps {
  isOpen: boolean;
  event: ArenaEvent;
  onClose: () => void;
  onSuccess: (updatedSlug?: string) => void;
}

export const AdminEventSettingsModal: React.FC<AdminEventSettingsModalProps> = ({
  isOpen,
  event,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [locationName, setLocationName] = useState(event.location_name);
  const [locationAddress, setLocationAddress] = useState(event.location_address);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(event.whatsapp_group_url || '');
  const [formatType, setFormatType] = useState<EventFormat>(event.format_type);
  const [status, setStatus] = useState<EventStatus>(event.status);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) {
      showToast('Título e local do evento são obrigatórios.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await updateEventDetails(
      event.id,
      {
        title: title.trim(),
        description: description.trim(),
        location_name: locationName.trim(),
        location_address: locationAddress.trim(),
        whatsapp_group_url: whatsappGroupUrl.trim() || null,
        format_type: formatType,
        status,
      },
      'Admin Principal'
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast('Configurações do evento atualizadas com sucesso!', 'success');
      onSuccess(event.slug);
      onClose();
    } else {
      showToast(res.error || 'Erro ao atualizar configurações.', 'error');
    }
  };

  const handleArchive = async () => {
    const res = await archiveEvent(event.id, 'Admin Principal');
    if (res.success) {
      showToast(`Evento "${event.title}" arquivado com segurança.`, 'info');
      onSuccess(event.slug);
      onClose();
    } else {
      showToast(res.error || 'Erro ao arquivar evento.', 'error');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmationInput !== event.title) {
      showToast('O título digitado não confere com o título exato do evento.', 'warning');
      return;
    }

    const res = await deleteEventSafely(event.id, deleteConfirmationInput, 'Admin Principal');
    if (res.success) {
      showToast(`Evento excluído definitivamente.`, 'error');
      onSuccess();
      onClose();
    } else {
      showToast(res.error || 'Erro ao excluir evento.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurações: ${event.title}`}
      subtitle={`Identificador: ${event.slug}`}
    >
      {!isDeleting ? (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <InputField
            label="Título Oficial do Evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <InputField
            label="Local do Evento"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            leftIcon={<MapPin size={16} />}
            required
          />

          <InputField
            label="Endereço Completo"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            required
          />

          <InputField
            label="Link do Grupo do WhatsApp"
            placeholder="https://chat.whatsapp.com/..."
            value={whatsappGroupUrl}
            onChange={(e) => setWhatsappGroupUrl(e.target.value)}
            leftIcon={<MessageCircle size={16} />}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Formato do Torneio:
              </label>
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value as EventFormat)}
                style={{
                  width: '100%',
                  backgroundColor: '#111116',
                  color: '#ffffff',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              >
                <option value="mixed">Misto (Lutas Casadas + Amistosos)</option>
                <option value="single_elimination">Mata-Mata (Eliminatório)</option>
                <option value="round_robin">Liga (Pontos Corridos)</option>
                <option value="friendly">Amistoso</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Status de Inscrições:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                style={{
                  width: '100%',
                  backgroundColor: '#111116',
                  color: '#ffffff',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              >
                <option value="open_for_registration">Inscrições Abertas</option>
                <option value="registration_closed">Inscrições Encerradas</option>
                <option value="in_progress">Em Andamento (Ao Vivo)</option>
                <option value="finished">Finalizado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Texto do Regulamento ou Descrição
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#111116',
                color: '#ffffff',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Ações Especiais: Arquivamento e Exclusão */}
          <div
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              paddingTop: 'var(--space-3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="outline"
                size="sm"
                type="button"
                leftIcon={<Archive size={14} />}
                onClick={handleArchive}
              >
                Arquivar Evento
              </Button>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                leftIcon={<Trash2 size={14} />}
                onClick={() => setIsDeleting(true)}
              >
                Excluir...
              </Button>
            </div>

            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      ) : (
        /* Confirmação de Exclusão Definitiva */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-red-muted)',
              border: '1px solid var(--color-red-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              color: '#fff',
            }}
          >
            <strong>Atenção: Ação Irreversível!</strong>
            <p style={{ marginTop: '4px' }}>
              A exclusão definitiva removerá todas as inscrições, pesagens, confrontos e súmulas associadas a este evento. Se deseja apenas encerrar, utilize a opção <strong>Arquivar</strong>.
            </p>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Para confirmar, digite exatamente o título do evento: <strong style={{ color: '#fff' }}>{event.title}</strong>
          </p>

          <InputField
            label="Confirmação de Exclusão"
            placeholder="Digite o título exato para confirmar"
            value={deleteConfirmationInput}
            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            required
          />

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" fullWidth type="button" onClick={() => setIsDeleting(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              type="button"
              disabled={deleteConfirmationInput !== event.title}
              onClick={handleDelete}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
