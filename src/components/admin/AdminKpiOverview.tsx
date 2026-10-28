import React from 'react';
import { AdminKpiSummary } from '../../types/app.types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  Users,
  CheckCircle2,
  Clock,
  Swords,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  ShieldAlert,
} from 'lucide-react';

export interface AdminKpiOverviewProps {
  kpi: AdminKpiSummary;
  onNavigateTab: (tab: string) => void;
  onExportCsv: () => void;
}

export const AdminKpiOverview: React.FC<AdminKpiOverviewProps> = ({
  kpi,
  onNavigateTab,
  onExportCsv,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Grade de KPIs Esportivos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {/* Inscritos Pendentes */}
        <Card
          style={{
            padding: 'var(--space-3)',
            textAlign: 'center',
            cursor: 'pointer',
            border: kpi.pendingRegistrations > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined,
          }}
          onClick={() => onNavigateTab('atletas')}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <Clock size={20} color="var(--color-status-pending)" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', display: 'block' }}>
            {kpi.pendingRegistrations}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-status-pending)', textTransform: 'uppercase', fontWeight: 700 }}>
            Inscrições Pendentes
          </span>
        </Card>

        {/* Atletas Confirmados / Aprovados */}
        <Card
          style={{ padding: 'var(--space-3)', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => onNavigateTab('atletas')}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <CheckCircle2 size={20} color="var(--color-status-approved)" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', display: 'block' }}>
            {kpi.approvedAthletes}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Lutadores Aprovados
          </span>
        </Card>

        {/* Total de Confrontos */}
        <Card
          style={{ padding: 'var(--space-3)', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => onNavigateTab('lutas')}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <Swords size={20} color="var(--color-gold-primary)" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', display: 'block' }}>
            {kpi.totalMatches}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Lutas no Card
          </span>
        </Card>

        {/* Lutas Sem Horário */}
        <Card
          style={{ padding: 'var(--space-3)', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => onNavigateTab('lutas')}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <AlertTriangle size={20} color={kpi.unscheduledMatches > 0 ? 'var(--color-red-primary)' : 'var(--color-text-muted)'} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', display: 'block' }}>
            {kpi.unscheduledMatches}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Sem Horário
          </span>
        </Card>

        {/* Pendências de Menor / Responsável */}
        <Card
          style={{ padding: 'var(--space-3)', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => onNavigateTab('atletas')}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <ShieldAlert size={20} color={kpi.minorPendingConsent > 0 ? 'var(--color-red-primary)' : 'var(--color-text-muted)'} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', display: 'block' }}>
            {kpi.minorPendingConsent}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Menores s/ Anuência
          </span>
        </Card>
      </div>

      {/* Barra de Ações Rápidas Administrativas */}
      <Card title="Acesso Rápido às Operações">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-2)',
          }}
        >
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Swords size={14} />}
            onClick={() => onNavigateTab('lutas')}
          >
            Casar Luta
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Users size={14} />}
            onClick={() => onNavigateTab('atletas')}
          >
            Moderar Inscritos
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => onNavigateTab('comunicados')}
          >
            Novo Comunicado
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet size={14} />}
            onClick={onExportCsv}
          >
            Exportar CSV
          </Button>
        </div>
      </Card>
    </div>
  );
};
