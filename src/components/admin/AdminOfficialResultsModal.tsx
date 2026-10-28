import React, { useState } from 'react';
import { MatchFight, VictoryMethod } from '../../types/app.types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useToast } from '../../contexts/ToastContext';
import { recordOfficialMatchResult } from '../../services/adminService';
import { Trophy, Award } from 'lucide-react';

export interface AdminOfficialResultsModalProps {
  isOpen: boolean;
  match: MatchFight | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminOfficialResultsModal: React.FC<AdminOfficialResultsModalProps> = ({
  isOpen,
  match,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [winnerRegistrationId, setWinnerRegistrationId] = useState<string>('');
  const [victoryMethod, setVictoryMethod] = useState<VictoryMethod>('KO');
  const [scoreDetails, setScoreDetails] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!match) return null;

  const f1 = match.fighter1;
  const f2 = match.fighter2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (victoryMethod !== 'DRAW' && victoryMethod !== 'NO_CONTEST' && !winnerRegistrationId) {
      showToast('Por favor, selecione o vencedor da luta.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await recordOfficialMatchResult(
      match.id,
      {
        winnerRegistrationId: victoryMethod === 'DRAW' || victoryMethod === 'NO_CONTEST' ? null : winnerRegistrationId,
        victoryMethod,
        scoreDetails: scoreDetails.trim(),
        videoUrl: videoUrl.trim() || undefined,
      },
      'Admin Principal'
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Resultado oficial da luta #${match.match_order} registrado com sucesso!`, 'success');
      onSuccess();
      onClose();
    } else {
      showToast(res.error || 'Erro ao registrar resultado.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Súmula Oficial: Luta #${match.match_order}`}
      subtitle={`${f1?.profile?.nickname} vs ${f2?.profile?.nickname}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Escolha do Vencedor */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            Vencedor do Combate:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <Button
              type="button"
              variant={winnerRegistrationId === f1?.id ? 'gold' : 'secondary'}
              size="sm"
              leftIcon={<Trophy size={14} />}
              onClick={() => setWinnerRegistrationId(f1?.id || '')}
            >
              {f1?.profile?.nickname} (Vermelho)
            </Button>

            <Button
              type="button"
              variant={winnerRegistrationId === f2?.id ? 'gold' : 'secondary'}
              size="sm"
              leftIcon={<Trophy size={14} />}
              onClick={() => setWinnerRegistrationId(f2?.id || '')}
            >
              {f2?.profile?.nickname} (Dourado)
            </Button>
          </div>
        </div>

        {/* Método da Vitória */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            Método de Encerramento:
          </label>
          <select
            value={victoryMethod}
            onChange={(e) => setVictoryMethod(e.target.value as VictoryMethod)}
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
            <option value="KO">Nocaute (KO)</option>
            <option value="TKO">Nocaute Técnico (TKO)</option>
            <option value="POINTS">Decisão por Pontos (Decisão dos Juízes)</option>
            <option value="SUBMISSION">Desistência / Interrupção Médica</option>
            <option value="DRAW">Empate Oficial (DRAW)</option>
            <option value="DQ">Desqualificação (DQ)</option>
            <option value="NO_CONTEST">Sem Resultado (No Contest)</option>
          </select>
        </div>

        {/* Detalhes do Nocaute ou Pontuação */}
        <InputField
          label="Detalhes da Súmula (Round, tempo, pontuação)"
          placeholder="Ex: Nocaute técnico aos 1:45 do 2º round"
          value={scoreDetails}
          onChange={(e) => setScoreDetails(e.target.value)}
          leftIcon={<Award size={16} />}
        />

        {/* Link do Vídeo da Luta */}
        <InputField
          label="Link do Vídeo Oficial (YouTube/Embed)"
          placeholder="Ex: https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Button variant="ghost" fullWidth type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gold" fullWidth type="submit" isLoading={isSubmitting}>
            Salvar Resultado Oficial
          </Button>
        </div>
      </form>
    </Modal>
  );
};
