import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Loader } from '../../components/common/Loader';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { useToast } from '../../contexts/ToastContext';
import { Sparkles, Trophy, Shield, Swords, AlertTriangle, Send } from 'lucide-react';

export const DesignSystemDemo: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [demoInput, setDemoInput] = useState('');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Banner de Demonstração */}
      <div
        style={{
          borderLeft: '4px solid var(--color-gold-primary)',
          backgroundColor: 'var(--color-bg-surface-elevated)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Sparkles size={20} color="var(--color-gold-primary)" />
          <h2 style={{ fontSize: 'var(--font-size-lg)', textTransform: 'uppercase' }}>
            Vitrine do Design System
          </h2>
          <Badge variant="gold">[DEMO / FICTÍCIO]</Badge>
        </div>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Esta página reúne todos os componentes reutilizáveis, tokens visuais e estados da Fase 01 da U.C.U Arena. Nenhum dado aqui é real.
        </p>
      </div>

      {/* 1. Botões */}
      <Card title="1. Botões e Ações" subtitle="Variantes metálicas, sombras e estados táteis">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button variant="gold" leftIcon={<Trophy size={16} />}>
            Ouro Metálico
          </Button>
          <Button variant="secondary" leftIcon={<Shield size={16} />}>
            Secundário
          </Button>
          <Button variant="danger" leftIcon={<Swords size={16} />}>
            Perigo / Combate
          </Button>
          <Button variant="outline">
            Borda Dourada
          </Button>
          <Button variant="ghost">
            Fantasma
          </Button>
          <Button variant="gold" isLoading>
            Carregando
          </Button>
        </div>
      </Card>

      {/* 2. Badges de Status */}
      <Card title="2. Badges de Status Semânticos" subtitle="Identificação imediata nas listas mobile">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <Badge variant="pending">Pendente</Badge>
          <Badge variant="approved">Aprovado</Badge>
          <Badge variant="rejected">Recusado</Badge>
          <Badge variant="withdrawn">Desistente</Badge>
          <Badge variant="live" pulse>AO VIVO NO RINGUE</Badge>
          <Badge variant="gold">Campeão</Badge>
        </div>
      </Card>

      {/* 3. Avatares e Iniciais */}
      <Card title="3. Avatares de Atletas" subtitle="Fotos circulares com anéis de corner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Avatar alt="Lutador Alpha" size="xl" borderRing="gold" />
          <Avatar alt="Guerreiro Vermelho" size="lg" borderRing="red" />
          <Avatar alt="Pantera" size="md" borderRing="gold" />
          <Avatar alt="Sombra" size="sm" borderRing="none" />
        </div>
      </Card>

      {/* 4. Notificações Toasts e Diálogos */}
      <Card title="4. Notificações e Modais" subtitle="Disparo de toasts e diálogo de confirmação">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Inscrição aprovada com sucesso!', 'success')}
          >
            Toast Sucesso
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Peso fora da faixa permitida (50 a 90kg).', 'error')}
          >
            Toast Erro
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Pesagem oficial começa às 16h.', 'info')}
          >
            Toast Info
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Atenção aos documentos de menores.', 'warning')}
          >
            Toast Alerta
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)}>
            Abrir Modal de Teste
          </Button>
          <Button variant="danger" size="sm" onClick={() => setIsConfirmOpen(true)}>
            Diálogo de Confirmação
          </Button>
        </div>
      </Card>

      {/* 5. Inputs */}
      <Card title="5. Campos de Formulário">
        <InputField
          label="Campo de Demonstração"
          placeholder="Digite algo para testar..."
          value={demoInput}
          onChange={(e) => setDemoInput(e.target.value)}
          helperText="Texto auxiliar exibido abaixo do input."
          rightIcon={<Send size={16} />}
        />
        <InputField
          label="Campo com Erro Simulado"
          placeholder="Valor inválido..."
          defaultValue="35.00"
          error="Peso abaixo do limite mínimo permitido de 50,00 kg."
        />
      </Card>

      {/* 6. Carregamento e Skeletons */}
      <Card title="6. Skeletons e Loader">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="90%" />
          <Skeleton height={42} width="100%" borderRadius="var(--radius-md)" />
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Loader size="sm" text="Carregando chaves de luta..." />
          </div>
        </div>
      </Card>

      {/* 7. Mensagem de Erro e Estado Vazio */}
      <Card title="7. Telas de Erro e Vazio">
        <ErrorMessage
          title="Falha na conexão"
          message="Não foi possível sincronizar o card de lutas. Verifique sua conexão com a internet."
          onRetry={() => showToast('Reconectando...', 'info')}
        />

        <EmptyState
          icon={<AlertTriangle size={28} />}
          title="Nenhum Confronto Cadastrado"
          description="Os confrontos desta categoria ainda estão sendo casados pela organização do evento."
          actionText="Ver Outras Categorias"
          onAction={() => showToast('Navegando entre categorias fictícias.', 'info')}
        />
      </Card>

      {/* Modais de Teste */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal Demonstrativo Mobile"
        subtitle="Exibido como bottom sheet fluido no smartphone"
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Este modal desliza suavemente a partir da base no mobile e centraliza em telas maiores, com suporte total à tecla ESC e fechamento ao clicar no fundo escurecido.
        </p>
        <Button variant="gold" fullWidth onClick={() => setIsModalOpen(false)}>
          Entendido
        </Button>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          showToast('Ação fictícia confirmada com sucesso.', 'success');
        }}
        title="Confirmar Ação Crítica"
        message="Tem certeza de que deseja executar esta ação? Ela afetará os registros do sistema de combate."
        variant="danger"
      />
    </div>
  );
};
