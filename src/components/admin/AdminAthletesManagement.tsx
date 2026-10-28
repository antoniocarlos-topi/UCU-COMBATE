import React, { useState } from 'react';
import { EventRegistration } from '../../types/app.types';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { Modal } from '../common/Modal';
import { useToast } from '../../contexts/ToastContext';
import {
  approveAthleteRegistration,
  rejectAthleteRegistration,
  suspendAthleteRegistration,
  recordOfficialWeighIn,
  exportEventParticipantsCsv,
} from '../../services/adminService';
import {
  Search,
  Check,
  X,
  Scale,
  ShieldAlert,
  FileSpreadsheet,
  AlertCircle,
  Ban,
  User,
} from 'lucide-react';

export interface AdminAthletesManagementProps {
  eventId: string;
  registrations: EventRegistration[];
  onRefreshData: () => void;
}

export const AdminAthletesManagement: React.FC<AdminAthletesManagementProps> = ({
  eventId,
  registrations,
  onRefreshData,
}) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');

  // Modais de ação
  const [weighInTarget, setWeighInTarget] = useState<EventRegistration | null>(null);
  const [officialWeightInput, setOfficialWeightInput] = useState('');
  const [isWeighing, setIsWeighing] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<EventRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [inspectTarget, setInspectTarget] = useState<EventRegistration | null>(null);

  // Filtro
  const filteredAthletes = registrations.filter((reg) => {
    if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nick = reg.profile?.nickname?.toLowerCase() || '';
      const name = reg.profile?.full_name?.toLowerCase() || '';
      return nick.includes(q) || name.includes(q);
    }
    return true;
  });

  // Ações
  const handleApprove = async (reg: EventRegistration) => {
    const res = await approveAthleteRegistration(reg.id, 'Admin Principal');
    if (res.success) {
      showToast(`Atleta "${reg.profile?.nickname}" aprovado com sucesso!`, 'success');
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao aprovar atleta.', 'error');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      showToast('Por favor, informe o motivo da recusa.', 'warning');
      return;
    }

    setIsRejecting(true);
    const res = await rejectAthleteRegistration(rejectTarget.id, rejectionReason, 'Admin Principal');
    setIsRejecting(false);

    if (res.success) {
      showToast(`Inscrição de "${rejectTarget.profile?.nickname}" recusada.`, 'info');
      setRejectTarget(null);
      setRejectionReason('');
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao recusar inscrição.', 'error');
    }
  };

  const handleSuspend = async (reg: EventRegistration) => {
    const res = await suspendAthleteRegistration(reg.id, 'Suspenso pela organização administrativa.', 'Admin Principal');
    if (res.success) {
      showToast(`Atleta "${reg.profile?.nickname}" suspenso.`, 'warning');
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao suspender atleta.', 'error');
    }
  };

  const handleConfirmWeighIn = async () => {
    if (!weighInTarget) return;
    const parsed = parseFloat(officialWeightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 50 || parsed > 90) {
      showToast('Informe um peso válido entre 50,00 kg e 90,00 kg.', 'warning');
      return;
    }

    setIsWeighing(true);
    const res = await recordOfficialWeighIn(weighInTarget.id, parsed, 'Admin Principal');
    setIsWeighing(false);

    if (res.success) {
      if (res.reallocatedCategory) {
        showToast(
          `Pesagem de ${parsed.toFixed(2)} kg registrada! Atenção: Peso fora da categoria original. Sugestão: ${res.reallocatedCategory}`,
          'warning',
          5000
        );
      } else {
        showToast(`Pesagem oficial de ${parsed.toFixed(2)} kg registrada com sucesso!`, 'success');
      }
      setWeighInTarget(null);
      setOfficialWeightInput('');
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao registrar pesagem.', 'error');
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = exportEventParticipantsCsv(eventId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `participantes_evento_${eventId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download da listagem de participantes (CSV) concluído!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Barra de Busca e Exportação */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <InputField
            label="Buscar Participante"
            placeholder="Buscar por apelido ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<FileSpreadsheet size={16} />}
          onClick={handleDownloadCsv}
        >
          Exportar CSV ({filteredAthletes.length})
        </Button>
      </div>

      {/* Filtros por Status */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Button
          variant={statusFilter === 'all' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Todos ({registrations.length})
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pendentes ({registrations.filter((r) => r.status === 'pending').length})
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('approved')}
        >
          Aprovados ({registrations.filter((r) => r.status === 'approved').length})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'danger' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('rejected')}
        >
          Recusados ({registrations.filter((r) => r.status === 'rejected').length})
        </Button>
        <Button
          variant={statusFilter === 'suspended' ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('suspended')}
        >
          Suspensos ({registrations.filter((r) => r.status === 'suspended').length})
        </Button>
      </div>

      {/* Lista de Atletas */}
      {filteredAthletes.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Nenhum participante encontrado para os filtros selecionados.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filteredAthletes.map((reg) => {
            const isApproved = reg.status === 'approved';
            const isPending = reg.status === 'pending';

            return (
              <Card key={reg.id}>
                {/* Header do Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar
                      src={reg.profile?.avatar_url}
                      alt={reg.profile?.nickname || 'Atleta'}
                      size="md"
                      borderRing={isApproved ? 'gold' : 'none'}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#fff' }}>
                          {reg.profile?.nickname}
                        </h4>
                        {reg.profile?.is_minor && (
                          <Badge variant="live" size="sm">Menor</Badge>
                        )}
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {reg.profile?.full_name}
                      </p>
                    </div>
                  </div>

                  <Badge variant={reg.status}>{reg.status.toUpperCase()}</Badge>
                </div>

                {/* Dados de Categoria e Pesagem */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--font-size-xs)',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Categoria:</span>
                    <strong style={{ display: 'block', color: '#fff', marginTop: '1px' }}>
                      {reg.weight_category?.name || 'Aguardando alocação'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Pesagem Oficial:</span>
                    <strong style={{ display: 'block', color: reg.verified_weight ? 'var(--color-gold-primary)' : 'var(--color-text-muted)', marginTop: '1px' }}>
                      {reg.verified_weight ? `${Number(reg.verified_weight).toFixed(2)} kg` : `Declarado: ${Number(reg.declared_weight).toFixed(2)} kg`}
                    </strong>
                  </div>
                </div>

                {/* Alerta de Menor de Idade se houver */}
                {reg.profile?.is_minor && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.7rem',
                      color: 'var(--color-gold-light)',
                      backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <ShieldAlert size={14} color="var(--color-gold-primary)" />
                    <span>
                      Responsável: <strong>{reg.profile.guardian_name}</strong> ({reg.profile.guardian_relationship}) • Doc: {reg.profile.guardian_document}
                    </span>
                  </div>
                )}

                {/* Motivo de Recusa / Suspensão */}
                {reg.rejection_reason && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-red-light)', marginBottom: 'var(--space-3)' }}>
                    Motivo: {reg.rejection_reason}
                  </p>
                )}

                {/* Botões de Ação */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    justifyContent: 'flex-end',
                    borderTop: '1px solid var(--color-border-subtle)',
                    paddingTop: 'var(--space-3)',
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<User size={14} />}
                    onClick={() => setInspectTarget(reg)}
                  >
                    Detalhes
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Scale size={14} />}
                    onClick={() => {
                      setWeighInTarget(reg);
                      setOfficialWeightInput(reg.verified_weight ? String(reg.verified_weight) : String(reg.declared_weight));
                    }}
                  >
                    Pesar Oficial
                  </Button>

                  {isPending && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<X size={14} />}
                        onClick={() => {
                          setRejectTarget(reg);
                          setRejectionReason('');
                        }}
                      >
                        Recusar
                      </Button>

                      <Button
                        variant="gold"
                        size="sm"
                        leftIcon={<Check size={14} />}
                        onClick={() => handleApprove(reg)}
                      >
                        Aprovar
                      </Button>
                    </>
                  )}

                  {isApproved && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Ban size={14} />}
                      onClick={() => handleSuspend(reg)}
                    >
                      Suspender
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Pesagem Oficial na Balança */}
      {weighInTarget && (
        <Modal
          isOpen={!!weighInTarget}
          onClose={() => setWeighInTarget(null)}
          title={`Pesagem Oficial: ${weighInTarget.profile?.nickname}`}
          subtitle={`Peso declarado no cadastro: ${weighInTarget.declared_weight} kg`}
        >
          <div>
            <InputField
              label="Peso Aferido na Balança (kg)"
              placeholder="Ex: 67.45"
              value={officialWeightInput}
              onChange={(e) => setOfficialWeightInput(e.target.value)}
              leftIcon={<Scale size={18} />}
              helperText="Insira com precisão decimal (50,00 a 90,00 kg)."
              required
            />

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" fullWidth onClick={() => setWeighInTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="gold"
                fullWidth
                isLoading={isWeighing}
                onClick={handleConfirmWeighIn}
              >
                Confirmar Pesagem
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Recusa de Inscrição */}
      {rejectTarget && (
        <Modal
          isOpen={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          title={`Recusar Inscrição: ${rejectTarget.profile?.nickname}`}
          subtitle="Informe o motivo oficial para conhecimento do participante."
        >
          <div>
            <InputField
              label="Motivo da Recusa"
              placeholder="Ex: Foto de rosto ilegível ou dados de responsável inconsistentes."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              leftIcon={<AlertCircle size={18} />}
              required
            />

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" fullWidth onClick={() => setRejectTarget(null)}>
                Voltar
              </Button>
              <Button
                variant="danger"
                fullWidth
                isLoading={isRejecting}
                onClick={handleConfirmReject}
              >
                Confirmar Recusa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Inspeção Completa dos Dados */}
      {inspectTarget && (
        <Modal
          isOpen={!!inspectTarget}
          onClose={() => setInspectTarget(null)}
          title={`Ficha do Lutador: ${inspectTarget.profile?.nickname}`}
          subtitle={`Inscrição ID: ${inspectTarget.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar
                src={inspectTarget.profile?.avatar_url}
                alt={inspectTarget.profile?.nickname || 'Atleta'}
                size="xl"
                borderRing="gold"
              />
              <div>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>
                  {inspectTarget.profile?.full_name}
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gold-light)' }}>
                  Apelido: {inspectTarget.profile?.nickname}
                </p>
                <Badge variant={inspectTarget.status}>{inspectTarget.status}</Badge>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-xs)' }}>
              <div><strong>Telefone:</strong> {inspectTarget.profile?.phone || 'Não informado'}</div>
              <div><strong>Email de Recuperação:</strong> {inspectTarget.profile?.recovery_email || 'Não informado'}</div>
              <div><strong>Data de Nascimento:</strong> {inspectTarget.profile?.birth_date || 'Não informada'}</div>
              <div><strong>Uso de Imagem:</strong> {inspectTarget.profile?.image_consent ? 'Autorizado' : 'Não'}</div>
              <div><strong>Regulamento Esportivo:</strong> {inspectTarget.profile?.terms_consent ? 'Aceito' : 'Não'}</div>

              {inspectTarget.profile?.is_minor && (
                <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                  <h5 style={{ color: 'var(--color-gold-primary)', fontWeight: 700, marginBottom: '4px' }}>Dados do Responsável Legal:</h5>
                  <div>Nome: {inspectTarget.profile?.guardian_name}</div>
                  <div>Parentesco: {inspectTarget.profile?.guardian_relationship}</div>
                  <div>Telefone: {inspectTarget.profile?.guardian_phone}</div>
                  <div>Documento: {inspectTarget.profile?.guardian_document}</div>
                </div>
              )}
            </div>

            <Button variant="secondary" fullWidth onClick={() => setInspectTarget(null)}>
              Fechar Ficha
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
