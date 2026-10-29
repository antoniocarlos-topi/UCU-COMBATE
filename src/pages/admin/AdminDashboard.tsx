import React, { useState, useEffect } from 'react';
import {
  getAdminDashboardSummary,
  exportEventParticipantsCsv,
} from '../../services/adminService';
import { ArenaEvent, EventRegistration, MatchFight, EventAnnouncement, AuditLog, AdminKpiSummary } from '../../types/app.types';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../contexts/ToastContext';
import { AdminEventSelector } from '../../components/admin/AdminEventSelector';
import { AdminKpiOverview } from '../../components/admin/AdminKpiOverview';
import { AdminAthletesManagement } from '../../components/admin/AdminAthletesManagement';
import { AdminMatchmaker } from '../../components/admin/AdminMatchmaker';
import { AdminCategoriesEditor } from '../../components/admin/AdminCategoriesEditor';
import { AdminMediaAnnouncements } from '../../components/admin/AdminMediaAnnouncements';
import { AdminAuditLogsView } from '../../components/admin/AdminAuditLogsView';
import { AdminCreateEventModal } from '../../components/admin/AdminCreateEventModal';
import { AdminEventSettingsModal } from '../../components/admin/AdminEventSettingsModal';
import { AdminBracketView } from '../../components/admin/AdminBracketView';
import { AdminLiveControl } from '../../components/admin/AdminLiveControl';
import { AdminTournamentModal } from '../../components/admin/AdminTournamentModal';
import {
  generateEventBrackets,
  BracketResult,
} from '../../services/bracketEngine';
import { DEFAULT_WEIGHT_CATEGORIES } from '../../utils/validationRules';
import { subscribeToStore } from '../../services/storeSync';
import {
  LayoutDashboard,
  Users,
  Swords,
  Scale,
  Bell,
  History,
  ShieldCheck,
  GitBranch,
  Radio,
  Trophy,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('arena-inaugural');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dados consolidados
  const [activeEvent, setActiveEvent] = useState<ArenaEvent | null>(null);
  const [allEvents, setAllEvents] = useState<ArenaEvent[]>([]);
  const [kpi, setKpi] = useState<AdminKpiSummary | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [matches, setMatches] = useState<MatchFight[]>([]);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Navegação
  const [activeTab, setActiveTab] = useState<'kpi' | 'atletas' | 'lutas' | 'chaveamento' | 'aovivo' | 'categorias' | 'comunicados' | 'auditoria'>('kpi');

  // Dados de Chaveamento (Fase 06)
  const [brackets, setBrackets] = useState<BracketResult[]>([]);

  // Modais de Evento & Torneio
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (slug: string, isSilent: boolean = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const summary = await getAdminDashboardSummary(slug);
      setActiveEvent(summary.activeEvent);
      setAllEvents(summary.allEvents);
      setKpi(summary.kpi);
      setRegistrations(summary.registrations);
      setMatches(summary.matches);
      setAnnouncements(summary.announcements);
      setAuditLogs(summary.auditLogs);
    } catch (err) {
      if (!isSilent) {
        showToast('Erro ao carregar dados administrativos.', 'error');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData(selectedEventSlug, true);
    setIsRefreshing(false);
    showToast('Dados sincronizados com a nuvem com sucesso!', 'success');
  };

  useEffect(() => {
    loadData(selectedEventSlug);

    // Escuta atualizações do store local imediatamente
    const unsubscribe = subscribeToStore(() => {
      loadData(selectedEventSlug, true);
    });

    // Auto-polling em tempo real com a nuvem a cada 8 segundos
    const interval = setInterval(() => {
      loadData(selectedEventSlug, true);
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedEventSlug]);

  const handleSelectEvent = (slug: string) => {
    setSelectedEventSlug(slug);
    showToast(`Alternando para o evento "${slug}"...`, 'info', 1500);
  };

  const handleExportCsv = () => {
    if (!activeEvent) return;
    const csvContent = exportEventParticipantsCsv(activeEvent.id);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `participantes_${activeEvent.slug}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download da listagem de participantes (CSV) concluído!', 'success');
  };

  if (isLoading && !activeEvent) {
    return <Loader fullPage text="Carregando Centro de Comando Administrativo..." />;
  }

  if (!activeEvent || !kpi) {
    return null;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>
      {/* 1. Header do Centro de Comando */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.04em' }}>
              Centro de Comando
            </h1>
            <Badge variant="gold" size="sm">Admin Oficial</Badge>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            U.C.U Arena • Gestão Esportiva, Confrontos e Governança
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Sincronizando...' : 'Atualizar Nuvem'}
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            <ShieldCheck size={16} color="var(--color-gold-primary)" />
            <span>Banco Global Online</span>
          </div>
        </div>
      </div>

      {/* 2. Seletor de Eventos Fixo */}
      <AdminEventSelector
        activeEvent={activeEvent}
        allEvents={allEvents}
        onSelectEvent={handleSelectEvent}
        onOpenCreateEventModal={() => setIsCreateEventOpen(true)}
        onOpenEditEventModal={() => setIsEditEventOpen(true)}
      />

      {/* 3. Barra de Abas de Navegação Administrativa */}
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
          variant={activeTab === 'kpi' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<LayoutDashboard size={14} />}
          onClick={() => setActiveTab('kpi')}
        >
          Visão Geral
        </Button>

        <Button
          variant={activeTab === 'atletas' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Users size={14} />}
          onClick={() => setActiveTab('atletas')}
        >
          Lutadores ({registrations.length})
        </Button>

        <Button
          variant={activeTab === 'lutas' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Swords size={14} />}
          onClick={() => setActiveTab('lutas')}
        >
          Confrontos ({matches.length})
        </Button>

        <Button
          variant={activeTab === 'categorias' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Scale size={14} />}
          onClick={() => setActiveTab('categorias')}
        >
          Categorias
        </Button>

        <Button
          variant={activeTab === 'chaveamento' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<GitBranch size={14} />}
          onClick={() => setActiveTab('chaveamento')}
        >
          Chaveamento
        </Button>

        <Button
          variant={activeTab === 'aovivo' ? 'danger' : 'secondary'}
          size="sm"
          leftIcon={<Radio size={14} />}
          onClick={() => setActiveTab('aovivo')}
        >
          Ao Vivo {matches.filter(m => m.status === 'in_progress').length > 0 ? `(${matches.filter(m => m.status === 'in_progress').length})` : ''}
        </Button>

        <Button
          variant={activeTab === 'comunicados' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Bell size={14} />}
          onClick={() => setActiveTab('comunicados')}
        >
          Mídia & Avisos ({announcements.length})
        </Button>

        <Button
          variant={activeTab === 'auditoria' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<History size={14} />}
          onClick={() => setActiveTab('auditoria')}
        >
          Auditoria & Backup
        </Button>
      </div>

      {/* 4. Conteúdo Dinâmico da Aba Selecionada */}

      {/* ABA: VISÃO GERAL */}
      {activeTab === 'kpi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <AdminKpiOverview
            kpi={kpi}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onExportCsv={handleExportCsv}
          />

          <AdminAuditLogsView
            eventId={activeEvent.id}
            auditLogs={auditLogs.slice(0, 5)}
          />
        </div>
      )}

      {/* ABA: LUTADORES & PESAGEM */}
      {activeTab === 'atletas' && (
        <AdminAthletesManagement
          eventId={activeEvent.id}
          registrations={registrations}
          onRefreshData={() => loadData(selectedEventSlug)}
        />
      )}

      {/* ABA: CONFRONTOS & RESULTADOS */}
      {activeTab === 'lutas' && (
        <AdminMatchmaker
          eventId={activeEvent.id}
          matches={matches}
          registrations={registrations}
          onRefreshData={() => loadData(selectedEventSlug)}
        />
      )}

      {/* ABA: CHAVEAMENTO MATA-MATA E CAMPEONATOS COMPLETOS */}
      {activeTab === 'chaveamento' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Trophy size={14} />}
              onClick={() => setIsTournamentModalOpen(true)}
            >
              Criar Campeonato & Chaveamento Completo
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<GitBranch size={14} />}
              onClick={() => {
                const approved = registrations.filter((r) => r.status === 'approved');
                const categories = DEFAULT_WEIGHT_CATEGORIES.map((c) => ({
                  id: `cat-${c.name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
                  name: c.name,
                }));
                const result = generateEventBrackets(activeEvent.id, approved, categories);
                if (result.success) {
                  setBrackets(result.brackets);
                  showToast(`Chaveamento gerado! ${result.brackets.length} categoria(s) com brackets.`, 'success');
                } else {
                  showToast(result.error, 'warning');
                }
              }}
              disabled={registrations.filter((r) => r.status === 'approved').length < 2}
            >
              Gerar Chaveamento Rápido
            </Button>
          </div>
          <AdminBracketView
            brackets={brackets}
            onUpdateBrackets={setBrackets}
            onOpenTournamentModal={() => setIsTournamentModalOpen(true)}
          />
        </div>
      )}

      {/* ABA: CONTROLE AO VIVO (FASE 06) */}
      {activeTab === 'aovivo' && (
        <AdminLiveControl
          eventId={activeEvent.id}
          matches={matches}
          registrations={registrations}
          onRefreshData={() => loadData(selectedEventSlug)}
        />
      )}

      {/* ABA: CATEGORIAS DE PESO */}
      {activeTab === 'categorias' && (
        <AdminCategoriesEditor
          eventId={activeEvent.id}
          onRefreshData={() => loadData(selectedEventSlug)}
        />
      )}

      {/* ABA: MÍDIA & AVISOS */}
      {activeTab === 'comunicados' && (
        <AdminMediaAnnouncements
          eventId={activeEvent.id}
          announcements={announcements}
          mediaItems={[]}
          onRefreshData={() => loadData(selectedEventSlug)}
        />
      )}

      {/* ABA: AUDITORIA & BACKUP */}
      {activeTab === 'auditoria' && (
        <AdminAuditLogsView
          eventId={activeEvent.id}
          auditLogs={auditLogs}
        />
      )}

      {/* Modal: Criar Novo Evento */}
      {isCreateEventOpen && (
        <AdminCreateEventModal
          isOpen={isCreateEventOpen}
          onClose={() => setIsCreateEventOpen(false)}
          onSuccess={(newSlug) => {
            setSelectedEventSlug(newSlug);
            loadData(newSlug);
          }}
        />
      )}

      {/* Modal: Editar Configurações do Evento */}
      {isEditEventOpen && activeEvent && (
        <AdminEventSettingsModal
          isOpen={isEditEventOpen}
          event={activeEvent}
          onClose={() => setIsEditEventOpen(false)}
          onSuccess={(updatedSlug) => {
            if (updatedSlug) {
              setSelectedEventSlug(updatedSlug);
              loadData(updatedSlug);
            } else {
              // Se foi excluído, volta para o primeiro evento
              setSelectedEventSlug('arena-inaugural');
              loadData('arena-inaugural');
            }
          }}
        />
      )}

      {/* Modal: Criar Campeonato & Chaveamento Completo */}
      {isTournamentModalOpen && activeEvent && (
        <AdminTournamentModal
          isOpen={isTournamentModalOpen}
          onClose={() => setIsTournamentModalOpen(false)}
          eventId={activeEvent.id}
          registrations={registrations}
          categories={DEFAULT_WEIGHT_CATEGORIES.map((c) => ({
            id: `cat-${c.name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
            name: c.name,
          }))}
          onTournamentCreated={(newBracket) => {
            setBrackets((prev) => [
              newBracket,
              ...prev.filter((b) => b.categoryId !== newBracket.categoryId),
            ]);
            showToast(
              `Campeonato "${newBracket.tournamentTitle || newBracket.categoryName}" criado com sucesso!`,
              'success'
            );
          }}
        />
      )}
    </div>
  );
};
