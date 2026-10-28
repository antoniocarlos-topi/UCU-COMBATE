import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useToast } from '../../contexts/ToastContext';
import { createEvent } from '../../services/adminService';
import { MapPin, MessageCircle } from 'lucide-react';

export interface AdminCreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSlug: string) => void;
}

export const AdminCreateEventModal: React.FC<AdminCreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [eventDate, setEventDate] = useState('2026-12-15');
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !locationName.trim()) {
      showToast('Título, slug e local são obrigatórios.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await createEvent(
      {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || 'Edição oficial U.C.U Arena.',
        eventDate: new Date(eventDate).toISOString(),
        locationName: locationName.trim(),
        locationAddress: locationAddress.trim() || locationName.trim(),
        whatsappGroupUrl: whatsappGroupUrl.trim() || undefined,
        formatType: 'mixed',
      },
      'Admin Principal'
    );
    setIsSubmitting(false);

    if (res.success && res.event) {
      showToast(`Evento "${res.event.title}" criado com sucesso!`, 'success');
      onSuccess(res.event.slug);
      onClose();
    } else {
      showToast(res.error || 'Erro ao criar evento.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Novo Evento"
      subtitle="Configure uma nova edição ou campeonato no circuito U.C.U Arena"
    >
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <InputField
          label="Título do Evento"
          placeholder="Ex: U.C.U Arena — 3ª Edição de Elite"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />

        <InputField
          label="Slug / Identificador URL"
          placeholder="Ex: arena-3-elite"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Será utilizado no link do convite (/convite/slug)"
          required
        />

        <InputField
          label="Local do Evento"
          placeholder="Ex: Espaço M-thor ou Ginásio Central"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          leftIcon={<MapPin size={16} />}
          required
        />

        <InputField
          label="Endereço Completo"
          placeholder="Ex: Rua dos Atletas, 100 - São Paulo, SP"
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
        />

        <InputField
          label="Data Prevista"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />

        <InputField
          label="Link do WhatsApp (Grupo do Evento)"
          placeholder="https://chat.whatsapp.com/..."
          value={whatsappGroupUrl}
          onChange={(e) => setWhatsappGroupUrl(e.target.value)}
          leftIcon={<MessageCircle size={16} />}
        />

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Texto do Convite Oficial
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mensagem editorial que aparecerá no envelope 3D de convite..."
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

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <Button variant="ghost" fullWidth type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gold" fullWidth type="submit" isLoading={isSubmitting}>
            Criar e Publicar Evento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
