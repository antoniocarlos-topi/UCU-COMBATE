import React, { useState } from 'react';
import { MatchFight, EventRegistration } from '../../types/app.types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { InputField } from '../common/InputField';
import { useToast } from '../../contexts/ToastContext';
import {
  createOrUpdateMatch,
  deleteMatch,
  updateMatchVideo,
} from '../../services/adminService';
import { AdminOfficialResultsModal } from './AdminOfficialResultsModal';
import {
  Swords,
  Plus,
  Clock,
  Trophy,
  Award,
  Video,
  Edit2,
  Trash2,
  AlertTriangle,
  Play,
} from 'lucide-react';

export interface AdminMatchmakerProps {
  eventId: string;
  matches: MatchFight[];
  registrations: EventRegistration[];
  onRefreshData: () => void;
}

export const AdminMatchmaker: React.FC<AdminMatchmakerProps> = ({
  eventId,
  matches,
  registrations,
  onRefreshData,
}) => {
  const { showToast } = useToast();

  // Estados de Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchFight | null>(null);
  const [videoMatch, setVideoMatch] = useState<MatchFight | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<MatchFight | null>(null);
  const [selectedResultMatch, setSelectedResultMatch] = useState<MatchFight | null>(null);

  // Form de criação / edição
  const [fighter1Id, setFighter1Id] = useState('');
  const [fighter2Id, setFighter2Id] = useState('');
  const [roundName, setRoundName] = useState('Card Principal');
  const [matchOrder, setMatchOrder] = useState<number>(matches.length + 1);
  const [scheduledTime, setScheduledTime] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [matchStatus, setMatchStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apenas atletas aprovados no mesmo evento podem ser casados
  const approvedFighters = registrations.filter((r) => r.status === 'approved');

  const handleOpenCreate = () => {
    setMatchOrder(matches.length + 1);
    setFighter1Id(approvedFighters[0]?.id || '');
    setFighter2Id(approvedFighters[1]?.id || '');
    setRoundName('Card Principal');
    setScheduledTime('');
    setVideoUrl('');
    setMatchStatus('scheduled');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (match: MatchFight) => {
    setEditingMatch(match);
    setFighter1Id(match.fighter1_registration_id);
    setFighter2Id(match.fighter2_registration_id);
    setRoundName(match.round_name);
    setMatchOrder(match.match_order);
    setScheduledTime(match.scheduled_time || '');
    setVideoUrl(match.video_url || '');
    setMatchStatus(match.status);
  };

  const handleOpenVideo = (match: MatchFight) => {
    setVideoMatch(match);
    setVideoUrl(match.video_url || '');
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fighter1Id || !fighter2Id) {
      showToast('Selecione ambos os lutadores para o confronto.', 'warning');
      return;
    }

    if (fighter1Id === fighter2Id) {
      showToast('Um lutador não pode lutar contra si mesmo!', 'warning');
      return;
    }

    const f1 = approvedFighters.find((f) => f.id === fighter1Id);
    const weightCategoryId = f1?.weight_category_id || 'cat-default';

    setIsSubmitting(true);
    const res = await createOrUpdateMatch(
      {
        id: editingMatch?.id,
        eventId,
        fighter1RegistrationId: fighter1Id,
        fighter2RegistrationId: fighter2Id,
        weightCategoryId,
        matchOrder: Number(matchOrder),
        roundName: roundName.trim(),
        scheduledTime: scheduledTime.trim() || undefined,
        status: matchStatus,
        videoUrl: videoUrl.trim() || undefined,
      },
      'Admin Principal'
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast(
        editingMatch ? 'Confronto atualizado com sucesso!' : 'Novo confronto adicionado ao card oficial!',
        'success'
      );
      setIsCreateModalOpen(false);
      setEditingMatch(null);
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao salvar confronto.', 'error');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoMatch) return;

    setIsSubmitting(true);
    const res = await updateMatchVideo(videoMatch.id, videoUrl, eventId, 'Admin Principal');
    setIsSubmitting(false);

    if (res.success) {
      showToast(videoUrl.trim() ? 'Vídeo da luta vinculado com sucesso!' : 'Vídeo removido da luta.', 'success');
      setVideoMatch(null);
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao atualizar vídeo.', 'error');
    }
  };

  const handleDeleteMatch = async () => {
    if (!deletingMatch) return;

    setIsSubmitting(true);
    const res = await deleteMatch(deletingMatch.id, eventId, 'Admin Principal');
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Confronto #${deletingMatch.match_order} excluído permanentemente.`, 'success');
      setDeletingMatch(null);
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao excluir confronto.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Topo do Gerenciador */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800 }}>
            Card de Confrontos do Evento
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Casamento oficial de lutas, edição, transmissão/vídeo e gestão de resultados
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={handleOpenCreate}
          disabled={approvedFighters.length < 2}
        >
          Casar Nova Luta
        </Button>
      </div>

      {approvedFighters.length < 2 && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gold-light)',
          }}
        >
          Atenção: É necessário aprovar pelo menos 2 participantes no evento antes de montar confrontos.
        </div>
      )}

      {/* Lista de Lutas */}
      {matches.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
            <Swords size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Nenhum confronto montado para este evento até o momento.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {matches.map((m) => {
            const isWinner1 = m.winner_registration_id === m.fighter1_registration_id;
            const isWinner2 = m.winner_registration_id === m.fighter2_registration_id;
            const isCompleted = m.status === 'completed';

            return (
              <Card key={m.id}>
                {/* Header do Confronto */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-gold-light)' }}>
                      Luta #{m.match_order} • {m.round_name}
                    </span>
                    {m.scheduled_time && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                        Horário: {m.scheduled_time}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.video_url && (
                      <Badge variant="gold" size="sm">
                        <Play size={10} style={{ marginRight: '4px' }} /> VÍDEO
                      </Badge>
                    )}
                    <Badge variant={m.status === 'completed' ? 'approved' : m.status === 'in_progress' ? 'live' : 'neutral'}>
                      {m.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Duelo Face-to-Face */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) 0',
                    borderTop: '1px solid var(--color-border-subtle)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {/* Fighter 1 (Corner Vermelho) */}
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      src={m.fighter1?.profile?.avatar_url}
                      alt={m.fighter1?.profile?.nickname || 'Lutador 1'}
                      size="md"
                      borderRing="red"
                    />
                    <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginTop: '4px' }}>
                      {m.fighter1?.profile?.nickname}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-red-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Corner Vermelho
                    </span>
                    {isWinner1 && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold-primary)', fontSize: '0.65rem', fontWeight: 800 }}>
                        <Trophy size={11} /> VENCEDOR
                      </div>
                    )}
                  </div>

                  {/* VS */}
                  <div style={{ color: 'var(--color-text-muted)', fontWeight: 900, fontSize: 'var(--font-size-xs)' }}>
                    VS
                  </div>

                  {/* Fighter 2 (Corner Dourado) */}
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      src={m.fighter2?.profile?.avatar_url}
                      alt={m.fighter2?.profile?.nickname || 'Lutador 2'}
                      size="md"
                      borderRing="gold"
                    />
                    <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginTop: '4px' }}>
                      {m.fighter2?.profile?.nickname}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gold-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Corner Dourado
                    </span>
                    {isWinner2 && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold-primary)', fontSize: '0.65rem', fontWeight: 800 }}>
                        <Trophy size={11} /> VENCEDOR
                      </div>
                    )}
                  </div>
                </div>

                {/* Súmula Oficial Se Concluído */}
                {isCompleted && (
                  <div
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-gold-light)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    Resultado: <strong>{m.victory_method}</strong> ({m.score_details || 'Sem detalhes'})
                  </div>
                )}

                {/* Preview de Vídeo (se configurado) */}
                {m.video_url && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <iframe
                      src={m.video_url}
                      title={`Vídeo Luta #${m.match_order}`}
                      style={{
                        width: '100%',
                        height: '180px',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Ações do Confronto */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {/* Botão Configurar Vídeo */}
                  <Button
                    variant={m.video_url ? 'gold' : 'secondary'}
                    size="sm"
                    leftIcon={<Video size={14} />}
                    onClick={() => handleOpenVideo(m)}
                  >
                    {m.video_url ? 'Alterar Vídeo' : 'Adicionar Vídeo'}
                  </Button>

                  {/* Botão Editar Confronto */}
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 size={14} />}
                    onClick={() => handleOpenEdit(m)}
                  >
                    Editar
                  </Button>

                  {/* Botão Lançar Resultado */}
                  {!isCompleted && m.status !== 'cancelled' && (
                    <Button
                      variant="gold"
                      size="sm"
                      leftIcon={<Award size={14} />}
                      onClick={() => setSelectedResultMatch(m)}
                    >
                      Resultado
                    </Button>
                  )}

                  {/* Botão Excluir Luta por Completo */}
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => setDeletingMatch(m)}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Casar ou Editar Luta */}
      {(isCreateModalOpen || editingMatch) && (
        <Modal
          isOpen={isCreateModalOpen || !!editingMatch}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingMatch(null);
          }}
          title={editingMatch ? `Editar Luta #${editingMatch.match_order}` : 'Casar Novo Confronto'}
          subtitle={editingMatch ? 'Altere atletas, fase, ordem ou status do confronto' : 'Selecione dois participantes elegíveis do mesmo evento'}
        >
          <form onSubmit={handleSaveMatch} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-red-primary)', marginBottom: '4px' }}>
                Lutador 1 (Corner Vermelho):
              </label>
              <select
                value={fighter1Id}
                onChange={(e) => setFighter1Id(e.target.value)}
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
                required
              >
                {approvedFighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.profile?.nickname} ({f.weight_category?.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gold-primary)', marginBottom: '4px' }}>
                Lutador 2 (Corner Dourado):
              </label>
              <select
                value={fighter2Id}
                onChange={(e) => setFighter2Id(e.target.value)}
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
                required
              >
                {approvedFighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.profile?.nickname} ({f.weight_category?.name})
                  </option>
                ))}
              </select>
            </div>

            <InputField
              label="Nome da Rodada / Fase"
              placeholder="Ex: Card Principal — Disputa de Cinturão"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <InputField
                label="Ordem no Card"
                type="number"
                value={String(matchOrder)}
                onChange={(e) => setMatchOrder(Number(e.target.value))}
                required
              />

              <InputField
                label="Horário Previsto"
                placeholder="Ex: 19:30"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                leftIcon={<Clock size={16} />}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Status do Confronto
              </label>
              <select
                value={matchStatus}
                onChange={(e) => setMatchStatus(e.target.value as any)}
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
                <option value="scheduled">Agendada (Scheduled)</option>
                <option value="in_progress">Ao Vivo no Octógono (In Progress)</option>
                <option value="completed">Concluída (Completed)</option>
                <option value="cancelled">Cancelada (Cancelled)</option>
              </select>
            </div>

            <InputField
              label="URL do Vídeo (YouTube / Transmissão)"
              placeholder="Ex: https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              leftIcon={<Video size={16} />}
            />

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <Button
                variant="ghost"
                fullWidth
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingMatch(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="gold" fullWidth type="submit" isLoading={isSubmitting}>
                {editingMatch ? 'Salvar Alterações' : 'Confirmar Confronto'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Configurar Vídeo da Luta */}
      {videoMatch && (
        <Modal
          isOpen={!!videoMatch}
          onClose={() => setVideoMatch(null)}
          title={`Vídeo da Luta #${videoMatch.match_order}`}
          subtitle={`${videoMatch.fighter1?.profile?.nickname} vs ${videoMatch.fighter2?.profile?.nickname}`}
        >
          <form onSubmit={handleSaveVideo} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Insira o link oficial do YouTube para que os atletas e o público possam assistir ao combate:
            </p>

            <InputField
              label="URL do YouTube"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              leftIcon={<Video size={16} />}
              required={false}
            />

            {videoUrl.trim() && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-gold-light)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Pré-visualização:
                </span>
                <iframe
                  src={videoUrl.includes('embed') ? videoUrl : `https://www.youtube.com/embed/${videoUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || ''}`}
                  title="Preview"
                  style={{ width: '100%', height: '180px', border: 'none', borderRadius: 'var(--radius-md)' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <Button variant="ghost" fullWidth type="button" onClick={() => setVideoMatch(null)}>
                Cancelar
              </Button>
              <Button variant="gold" fullWidth type="submit" isLoading={isSubmitting}>
                Salvar Vídeo
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Confirmar Exclusão de Luta */}
      {deletingMatch && (
        <Modal
          isOpen={!!deletingMatch}
          onClose={() => setDeletingMatch(null)}
          title="Excluir Luta Permanentemente"
          subtitle={`Confronto #${deletingMatch.match_order}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(229, 25, 40, 0.12)',
                border: '1px solid var(--color-red-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <AlertTriangle size={24} color="var(--color-red-primary)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#ffffff' }}>
                Tem certeza de que deseja <strong>excluir por completo</strong> a luta entre <strong>{deletingMatch.fighter1?.profile?.nickname}</strong> e <strong>{deletingMatch.fighter2?.profile?.nickname}</strong>? Esta ação removerá o confronto da escala oficial e do mural do evento.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" fullWidth onClick={() => setDeletingMatch(null)}>
                Não, Cancelar
              </Button>
              <Button variant="danger" fullWidth onClick={handleDeleteMatch} isLoading={isSubmitting}>
                Sim, Excluir Luta
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Resultado Oficial */}
      {selectedResultMatch && (
        <AdminOfficialResultsModal
          isOpen={!!selectedResultMatch}
          match={selectedResultMatch}
          onClose={() => setSelectedResultMatch(null)}
          onSuccess={onRefreshData}
        />
      )}
    </div>
  );
};
