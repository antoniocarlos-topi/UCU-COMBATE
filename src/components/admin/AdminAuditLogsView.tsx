import React from 'react';
import { AuditLog } from '../../types/app.types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../../contexts/ToastContext';
import { exportEventJsonBackup } from '../../services/adminService';
import { Download, AlertCircle } from 'lucide-react';

export interface AdminAuditLogsViewProps {
  eventId: string;
  auditLogs: AuditLog[];
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({
  eventId,
  auditLogs,
}) => {
  const { showToast } = useToast();

  const handleDownloadBackup = () => {
    const jsonContent = exportEventJsonBackup(eventId);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_evento_${eventId}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup completo do evento (JSON) exportado com sucesso!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Bloco de Exportação de Backup e Procedimento de Restauração */}
      <Card
        title="Auditoria & Backup do Evento"
        subtitle="Registro imutável de operações administrativas e exportação de segurança"
        headerAccent="gold"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Todas as alterações críticas de pesagem, moderação de atletas, cancelamento de lutas e lançamento de resultados são registradas em trilha de auditoria. Você pode gerar uma cópia snapshot completa de segurança em formato JSON para custódia externa.
          </p>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'rgba(212, 175, 55, 0.05)',
              borderLeft: '3px solid var(--color-gold-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold-light)', fontWeight: 700, marginBottom: '2px' }}>
              <AlertCircle size={14} /> Procedimento de Restauração:
            </div>
            O arquivo JSON contém schema versionado, checksum e tabelas associadas. Para restaurar em caso de contingência, execute a importação na interface administrativa ou acione a migration correspondente no banco Supabase.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleDownloadBackup}
            >
              Exportar Backup JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* Trilha de Auditoria Recente */}
      <Card title="Trilha de Atividades Recentes" subtitle="Últimas ações administrativas registradas">
        {auditLogs.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <Badge variant="neutral" size="sm">{log.action}</Badge>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#fff' }}>
                      {log.admin_nickname || 'Admin'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {log.details}
                  </p>
                </div>

                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
