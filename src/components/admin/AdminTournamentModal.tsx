import React, { useState } from 'react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { Badge } from '../common/Badge';
import { EventRegistration } from '../../types/app.types';
import {
  TournamentConfig,
  generateAdvancedTournament,
  BracketResult,
} from '../../services/bracketEngine';
import {
  Trophy,
  Swords,
  GitBranch,
  RefreshCw,
  Users,
  X,
  Medal,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export interface AdminTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  registrations: EventRegistration[];
  categories: { id: string; name: string }[];
  onTournamentCreated: (bracket: BracketResult) => void;
}

export const AdminTournamentModal: React.FC<AdminTournamentModalProps> = ({
  isOpen,
  onClose,
  eventId,
  registrations,
  categories,
  onTournamentCreated,
}) => {
  const approvedAthletes = registrations.filter((r) => r.status === 'approved');

  // Estados do formulário
  const [title, setTitle] = useState('Grand Prix Oficial U.C.U Arena');
  const [trophyName, setTrophyName] = useState('Cinturão de Ouro dos Campeões');
  const [format, setFormat] = useState<'single_elimination' | 'double_elimination' | 'round_robin' | 'superfight'>('single_elimination');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'openweight');
  const [bracketSize, setBracketSize] = useState<number | 'auto'>('auto');
  const [seedingMethod, setSeedingMethod] = useState<'weight_snake' | 'ranking' | 'random' | 'manual'>('weight_snake');
  const [hasBronzeMatch, setHasBronzeMatch] = useState(true);
  const [roundDurationMinutes, setRoundDurationMinutes] = useState(3);
  const [roundsCount, setRoundsCount] = useState(3);

  // Seleção granular de atletas
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>(
    approvedAthletes.map((a) => a.id)
  );

  // Ordem manual dos lutadores (quando seedingMethod === 'manual')
  const [manualOrder, setManualOrder] = useState<string[]>(
    approvedAthletes.map((a) => a.id)
  );

  if (!isOpen) return null;

  const currentCategoryAthletes = selectedCategoryId === 'openweight'
    ? approvedAthletes
    : approvedAthletes.filter((a) => a.weight_category_id === selectedCategoryId);

  const toggleAthleteSelection = (id: string) => {
    if (selectedAthleteIds.includes(id)) {
      setSelectedAthleteIds(selectedAthleteIds.filter((item) => item !== id));
    } else {
      setSelectedAthleteIds([...selectedAthleteIds, id]);
      if (!manualOrder.includes(id)) {
        setManualOrder([...manualOrder, id]);
      }
    }
  };

  const selectAllCategoryAthletes = () => {
    setSelectedAthleteIds(currentCategoryAthletes.map((a) => a.id));
  };

  const moveAthleteUp = (index: number) => {
    if (index === 0) return;
    const next = [...manualOrder];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setManualOrder(next);
  };

  const moveAthleteDown = (index: number) => {
    if (index >= manualOrder.length - 1) return;
    const next = [...manualOrder];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    setManualOrder(next);
  };

  const handleCreateTournament = () => {
    let selectedAthletes = currentCategoryAthletes.filter((a) =>
      selectedAthleteIds.includes(a.id)
    );

    if (selectedAthletes.length < 2) {
      alert('Selecione pelo menos 2 atletas aprovados para gerar o chaveamento.');
      return;
    }

    // Se o método for manual, aplica a ordenação manual definida pelo admin
    if (seedingMethod === 'manual') {
      selectedAthletes = [...selectedAthletes].sort((a, b) => {
        const idxA = manualOrder.indexOf(a.id);
        const idxB = manualOrder.indexOf(b.id);
        return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
      });
    }

    const categoryObj = categories.find((c) => c.id === selectedCategoryId);
    const categoryName = selectedCategoryId === 'openweight'
      ? 'Categoria Livre / Absoluto'
      : categoryObj?.name || 'Categoria Oficial';

    const config: TournamentConfig = {
      title,
      trophyName,
      format,
      categoryId: selectedCategoryId,
      categoryName,
      bracketSize,
      seedingMethod,
      hasBronzeMatch: format === 'single_elimination' ? hasBronzeMatch : false,
      roundDurationMinutes,
      roundsCount,
      selectedAthleteIds: selectedAthletes.map((a) => a.id),
    };

    const bracketResult = generateAdvancedTournament(config, selectedAthletes, eventId);
    onTournamentCreated(bracketResult);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#111116',
          border: '2px solid rgba(212, 175, 55, 0.5)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.2)',
          padding: 'var(--space-6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            paddingBottom: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--color-gold-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={24} color="var(--color-gold-primary)" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                }}
              >
                Criar Campeonato & Chaveamento
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Configurador Completo de Torneios, GP e Brackets Oficiais UCU
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário com Seções */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* 1. Informações Básicas do Torneio */}
          <div>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-gold-primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' }}>
              1. Identidade do Campeonato
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <InputField
                label="Nome do Campeonato / Grand Prix"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Grand Prix Peso Médio UCU"
                leftIcon={<Swords size={16} />}
                required
              />
              <InputField
                label="Cinturão / Troféu em Disputa"
                value={trophyName}
                onChange={(e) => setTrophyName(e.target.value)}
                placeholder="Ex: Cinturão dos Campeões 2026"
                leftIcon={<Trophy size={16} />}
              />
            </div>
          </div>

          {/* 2. Formato do Torneio */}
          <div>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-gold-primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' }}>
              2. Formato de Disputa
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
              {[
                { id: 'single_elimination', label: 'Eliminatória Simples', desc: 'Mata-mata tradicional', icon: <GitBranch size={18} /> },
                { id: 'double_elimination', label: 'Dupla Eliminação', desc: 'Vencedores + Repescagem', icon: <RefreshCw size={18} /> },
                { id: 'round_robin', label: 'Round Robin', desc: 'Todos vs Todos (Pontos)', icon: <Users size={18} /> },
                { id: 'superfight', label: 'Super Luta', desc: 'Desafio Único de Título', icon: <Medal size={18} /> },
              ].map((f) => (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: format === f.id ? '2px solid var(--color-gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: format === f.id ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: format === f.id ? 'var(--color-gold-primary)' : 'var(--color-text-primary)' }}>
                    {f.icon}
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800 }}>{f.label}</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Categoria & Dimensão da Chave */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Categoria de Peso
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#ffffff',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              >
                <option value="openweight">Categoria Absoluto / Livre (Openweight)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Tamanho da Chave
              </label>
              <select
                value={bracketSize}
                onChange={(e) => setBracketSize(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#ffffff',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              >
                <option value="auto">Automático (Todos atletas da categoria)</option>
                <option value="4">Chave de 4 (Semifinais direto)</option>
                <option value="8">Chave de 8 (Quartas de Final)</option>
                <option value="16">Chave de 16 (Oitavas de Final)</option>
                <option value="32">Chave de 32 (16 Avos)</option>
              </select>
            </div>
          </div>

          {/* 4. Método de Cabeças de Chave (Seeding) & Regras de Duração */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Cabeças de Chave (Seeding)
              </label>
              <select
                value={seedingMethod}
                onChange={(e) => setSeedingMethod(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#ffffff',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              >
                <option value="weight_snake">⚖️ Por Peso (Distribuição Serpentina)</option>
                <option value="ranking">🏆 Por Cartel / Vitórias Anteriores</option>
                <option value="random">🎲 Sorteio Puro / Aleatório</option>
                <option value="manual">✍️ Ordem de Inscrição / Manual</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Rounds & Tempo
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={roundsCount}
                  onChange={(e) => setRoundsCount(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <option value={1}>1 Round</option>
                  <option value={3}>3 Rounds (Torneio)</option>
                  <option value={5}>5 Rounds (Cinturão)</option>
                </select>

                <select
                  value={roundDurationMinutes}
                  onChange={(e) => setRoundDurationMinutes(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <option value={3}>3 minutos</option>
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opção Extra: Disputa de Bronze */}
          {format === 'single_elimination' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={hasBronzeMatch}
                onChange={(e) => setHasBronzeMatch(e.target.checked)}
                style={{ accentColor: 'var(--color-gold-primary)', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#ffffff' }}>
                Incluir Disputa de 3º Lugar (Medalha de Bronze entre derrotados das Semifinais)
              </span>
            </label>
          )}

          {/* 5. Seleção Granular dos Atletas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-gold-primary)', textTransform: 'uppercase' }}>
                3. Atletas Participantes ({currentCategoryAthletes.filter((a) => selectedAthleteIds.includes(a.id)).length} de {currentCategoryAthletes.length})
              </h4>
              <button
                type="button"
                onClick={selectAllCategoryAthletes}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Selecionar Todos
              </button>
            </div>

            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {currentCategoryAthletes.map((athlete) => {
                const isSelected = selectedAthleteIds.includes(athlete.id);
                return (
                  <div
                    key={athlete.id}
                    onClick={() => toggleAthleteSelection(athlete.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--color-gold-primary)' : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--color-gold-primary)' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#fff' }}>
                        {athlete.profile?.nickname}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        ({athlete.profile?.full_name})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="gold" size="sm">
                        {athlete.declared_weight} kg
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção de Casamento Manual quando seedingMethod === 'manual' */}
          {seedingMethod === 'manual' && (
            <div
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-gold-light)', textTransform: 'uppercase' }}>
                  ✍️ Casamento Manual dos Confrontos (Ordem da Chave)
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                  Use as setas para definir quem enfrenta quem na 1ª rodada
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {manualOrder
                  .filter((id) => selectedAthleteIds.includes(id))
                  .map((id, index, arr) => {
                    const athlete = currentCategoryAthletes.find((a) => a.id === id);
                    const matchNumber = Math.floor(index / 2) + 1;
                    const isFirstInPair = index % 2 === 0;

                    return (
                      <div
                        key={id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isFirstInPair ? 'rgba(229, 25, 40, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                          border: isFirstInPair ? '1px solid rgba(229, 25, 40, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isFirstInPair ? 'var(--color-red-primary)' : 'var(--color-gold-primary)' }}>
                            Luta #{matchNumber} ({isFirstInPair ? 'Corner Vermelho' : 'Corner Dourado'})
                          </span>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#fff' }}>
                            {athlete?.profile?.nickname || 'Atleta'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => moveAthleteUp(index)}
                            disabled={index === 0}
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: index === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                              borderRadius: 'var(--radius-sm)',
                              padding: '3px 6px',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAthleteDown(index)}
                            disabled={index === arr.length - 1}
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: index === arr.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                              borderRadius: 'var(--radius-sm)',
                              padding: '3px 6px',
                              cursor: index === arr.length - 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: 'var(--space-4)',
            }}
          >
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="gold"
              size="md"
              leftIcon={<Trophy size={16} />}
              onClick={handleCreateTournament}
              disabled={currentCategoryAthletes.filter((a) => selectedAthleteIds.includes(a.id)).length < 2}
            >
              Criar Campeonato & Chaveamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
