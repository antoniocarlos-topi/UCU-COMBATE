import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../../contexts/ToastContext';
import { WeightCategoryRule, DEFAULT_WEIGHT_CATEGORIES } from '../../utils/validationRules';
import { getCategoryChangeImpact } from '../../services/adminService';
import { Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface AdminCategoriesEditorProps {
  eventId: string;
  onRefreshData: () => void;
}

export const AdminCategoriesEditor: React.FC<AdminCategoriesEditorProps> = ({
  eventId,
}) => {
  const { showToast } = useToast();

  const [categories] = useState<WeightCategoryRule[]>([...DEFAULT_WEIGHT_CATEGORIES]);
  const [impactAnalysis, setImpactAnalysis] = useState<{
    hasOverlap: boolean;
    affectedAthletesCount: number;
    warnings: string[];
  } | null>(null);

  const handleRunImpactAnalysis = () => {
    const analysis = getCategoryChangeImpact(eventId, categories);
    setImpactAnalysis(analysis);

    if (analysis.hasOverlap) {
      showToast('Atenção: Existe sobreposição entre as faixas de peso configuradas.', 'error');
    } else if (analysis.affectedAthletesCount > 0) {
      showToast(
        `Alerta: ${analysis.affectedAthletesCount} atletas ativos ficarão fora das novas categorias!`,
        'warning'
      );
    } else {
      showToast('Análise de impacto realizada: Nenhuma inconsistência detectada.', 'success');
    }
  };

  const handleSaveCategories = () => {
    const analysis = getCategoryChangeImpact(eventId, categories);
    if (analysis.hasOverlap) {
      showToast('Não é permitido salvar categorias com sobreposição!', 'error');
      return;
    }

    showToast('Configuração de categorias de peso atualizada com sucesso!', 'success');
    setImpactAnalysis(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Card
        title="Categorias de Peso do Evento"
        subtitle="Regras centralizadas e validadas sem sobreposições"
        headerAccent="gold"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {categories.map((cat, index) => (
            <div
              key={cat.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: '#fff' }}>
                  #{index + 1} {cat.name}
                </span>
                <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-gold-light)' }}>
                  Faixa Oficial: {cat.minWeight.toFixed(2)} kg até {cat.maxWeight.toFixed(2)} kg
                </span>
              </div>

              <Badge variant="gold" size="sm">
                {(cat.maxWeight - cat.minWeight).toFixed(2)} kg amplitude
              </Badge>
            </div>
          ))}

          {/* Análise de Impacto Pré-Salvamento */}
          {impactAnalysis && (
            <div
              style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                backgroundColor: impactAnalysis.hasOverlap
                  ? 'var(--color-red-muted)'
                  : impactAnalysis.affectedAthletesCount > 0
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${
                  impactAnalysis.hasOverlap
                    ? 'var(--color-red-primary)'
                    : impactAnalysis.affectedAthletesCount > 0
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'var(--color-status-approved)'
                }`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {impactAnalysis.hasOverlap || impactAnalysis.affectedAthletesCount > 0 ? (
                  <AlertTriangle size={18} color="var(--color-red-primary)" />
                ) : (
                  <CheckCircle2 size={18} color="var(--color-status-approved)" />
                )}
                <strong style={{ fontSize: 'var(--font-size-sm)', color: '#fff' }}>
                  Relatório de Impacto Pré-Salvar
                </strong>
              </div>

              {impactAnalysis.warnings.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-status-approved)' }}>
                  Todos os atletas atualmente inscritos e lutas agendadas são 100% compatíveis com as faixas configuradas.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--font-size-xs)', color: '#fff' }}>
                  {impactAnalysis.warnings.map((w, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Scale size={14} />}
              onClick={handleRunImpactAnalysis}
            >
              Calcular Impacto em Inscritos
            </Button>

            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveCategories}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
