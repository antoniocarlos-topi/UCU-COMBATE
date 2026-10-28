import React, { useState } from 'react';
import { EventAnnouncement, MediaItem } from '../../types/app.types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { InputField } from '../common/InputField';
import { useToast } from '../../contexts/ToastContext';
import {
  saveAnnouncement,
  deleteAnnouncement,
  saveMediaItem,
  deleteMediaItem,
} from '../../services/adminService';
import {
  Bell,
  Video,
  Plus,
  Trash2,
  Pin,
  Globe,
} from 'lucide-react';

export interface AdminMediaAnnouncementsProps {
  eventId: string;
  announcements: EventAnnouncement[];
  mediaItems: MediaItem[];
  onRefreshData: () => void;
}

export const AdminMediaAnnouncements: React.FC<AdminMediaAnnouncementsProps> = ({
  eventId,
  announcements,
  mediaItems,
  onRefreshData,
}) => {
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'comunicados' | 'midia'>('comunicados');

  // Modal de Comunicado
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annIsPinned, setAnnIsPinned] = useState(false);

  // Modal de Mídia
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('Preencha o título e o conteúdo do comunicado.', 'warning');
      return;
    }

    const res = await saveAnnouncement(
      {
        eventId,
        title: annTitle,
        content: annContent,
        isPinned: annIsPinned,
      },
      'Admin Principal'
    );

    if (res.success) {
      showToast('Comunicado publicado com sucesso!', 'success');
      setIsAnnouncementModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
      setAnnIsPinned(false);
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao salvar comunicado.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const res = await deleteAnnouncement(id, 'Admin Principal');
    if (res.success) {
      showToast('Comunicado removido com sucesso.', 'info');
      onRefreshData();
    }
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim() || !mediaUrl.trim()) {
      showToast('Preencha o título e o link do vídeo.', 'warning');
      return;
    }

    const res = await saveMediaItem(
      {
        eventId,
        title: mediaTitle,
        url: mediaUrl,
        description: mediaDescription,
        mediaType: 'video',
        isPublic: true,
      },
      'Admin Principal'
    );

    if (res.success) {
      showToast('Vídeo oficial publicado com sucesso!', 'success');
      setIsMediaModalOpen(false);
      setMediaTitle('');
      setMediaUrl('');
      setMediaDescription('');
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao salvar mídia.', 'error');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    const res = await deleteMediaItem(id, 'Admin Principal');
    if (res.success) {
      showToast('Vídeo removido.', 'info');
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Sub-navegação */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button
          variant={activeSubTab === 'comunicados' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Bell size={14} />}
          onClick={() => setActiveSubTab('comunicados')}
        >
          Comunicados Oficiais ({announcements.length})
        </Button>

        <Button
          variant={activeSubTab === 'midia' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Video size={14} />}
          onClick={() => setActiveSubTab('midia')}
        >
          Vídeos e Conteúdo ({mediaItems.length})
        </Button>
      </div>

      {/* ABA: COMUNICADOS */}
      {activeSubTab === 'comunicados' && (
        <Card title="Comunicados Oficiais do Evento">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsAnnouncementModalOpen(true)}
            >
              Publicar Comunicado
            </Button>
          </div>

          {announcements.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              Nenhum comunicado publicado ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: '#fff' }}>
                        {ann.title}
                      </h4>
                      {ann.is_pinned && <Badge variant="gold" size="sm">Fixado</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {ann.content}
                    </p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                      {new Date(ann.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    aria-label="Excluir comunicado"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ABA: MÍDIA E VÍDEOS */}
      {activeSubTab === 'midia' && (
        <Card title="Vídeos e Conteúdo Esportivo">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsMediaModalOpen(true)}
            >
              Adicionar Vídeo
            </Button>
          </div>

          {mediaItems.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              Nenhum vídeo publicado ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Video size={20} color="var(--color-gold-primary)" />
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: '#fff' }}>
                        {item.title}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {item.url}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMedia(item.id)}
                    aria-label="Excluir vídeo"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal: Publicar Comunicado */}
      {isAnnouncementModalOpen && (
        <Modal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          title="Novo Comunicado Oficial"
          subtitle="Será exibido a todos os participantes aprovados do evento"
        >
          <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <InputField
              label="Título do Comunicado"
              placeholder="Ex: Horário da Pesagem Oficial Presencial"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              required
            />

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Conteúdo do Comunicado
              </label>
              <textarea
                rows={4}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Insira as orientações oficiais para os participantes..."
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
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isPinnedCheck"
                checked={annIsPinned}
                onChange={(e) => setAnnIsPinned(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--color-gold-primary)' }}
              />
              <label htmlFor="isPinnedCheck" style={{ fontSize: 'var(--font-size-xs)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Pin size={13} /> Fixar no topo dos comunicados
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" fullWidth type="button" onClick={() => setIsAnnouncementModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gold" fullWidth type="submit">
                Publicar Comunicado
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Adicionar Mídia */}
      {isMediaModalOpen && (
        <Modal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          title="Adicionar Vídeo Oficial"
          subtitle="Links do YouTube, Vimeo ou highlights autorizados"
        >
          <form onSubmit={handleSaveMedia} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <InputField
              label="Título do Vídeo"
              placeholder="Ex: Melhores Momentos: Nocaute no Card Principal"
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              required
            />

            <InputField
              label="URL do Vídeo (YouTube embed ou link)"
              placeholder="Ex: https://www.youtube.com/embed/..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              leftIcon={<Globe size={16} />}
              required
            />

            <InputField
              label="Descrição (Opcional)"
              placeholder="Breve resumo da luta ou dos atletas em destaque"
              value={mediaDescription}
              onChange={(e) => setMediaDescription(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" fullWidth type="button" onClick={() => setIsMediaModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gold" fullWidth type="submit">
                Salvar Vídeo
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
