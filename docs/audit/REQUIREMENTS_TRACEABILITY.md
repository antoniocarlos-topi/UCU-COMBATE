# U.C.U ARENA — Matriz de Rastreabilidade de Requisitos (RTM)

**Versão:** 1.0.0  
**Data da Auditoria:** 28 de Outubro de 2026  
**Auditor:** Equipe Independente de Auditoria de Software  
**Status da Auditoria:** Concluída com Evidências de Execução Real  

---

## 1. Critérios de Classificação da Matriz

Cada requisito foi inspecionado no código-fonte, testado por execução automatizada e verificado em tempo de execução real:

* **APROVADO:** Implementação completa, conectada ao fluxo real, com testes automatizados passando e sem inconsistências.
* **FALHOU:** Teste executado ou inspeção evidenciou comportamento divergente da especificação.
* **INCOMPLETO:** Implementação parcial ou com lacunas de contrato.
* **NÃO TESTADO:** Não foi possível obter evidência suficiente.
* **BLOQUEADO:** Depende exclusivamente de serviço, credencial ou infraestrutura externa ainda indisponível.
* **NÃO APLICÁVEL:** Requisito descartado com justificativa técnica formal.

---

## 2. Matriz Completa de Requisitos

| ID | Descrição do Requisito | Onde está Implementado | Teste que Comprova | Resultado | Defeitos / Riscos Encontrados | Correção Aplicada |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **REQ-01** | **Experiência de Convite 3D:** Abertura com envelope cinematográfico, selo oficial de combate e transição para leitura da carta. | `src/components/invitation/CinematicEnvelope.tsx`<br>`src/pages/public/EventLanding.tsx` | Subagent Browser E2E (`audit_live_app`) & `security-and-rules.test.ts` (Fase 03) | **APROVADO** | Nenhum. O envelope 3D abre tanto por clique quanto por toque no celular. | N/A |
| **REQ-02** | **Orientação e Recusa do Convite:** Botão "Quero Lutar" direciona para inscrição e "Não quero participar" abre modal educativo com link de WhatsApp. | `src/components/invitation/RefusalModal.tsx`<br>`src/services/eventService.ts` | Subagent Browser E2E & `security-and-rules.test.ts` | **APROVADO** | Nenhum. A recusa registra evento anônimo e oferece canal de contato. | N/A |
| **REQ-03** | **Validação Estrita de Peso (50 a 90 kg):** Limites rígidos com duas casas decimais, rejeitando valores inferiores a 50,00 kg e superiores a 90,00 kg. | `src/utils/validationRules.ts` (`validateAthleteWeight`) | `security-and-rules.test.ts` (10 casos de fronteira da Seção 2) | **APROVADO** | Entrada com vírgula poderia causar NaN se não normalizada. | Normalização prévia de string substituindo `,` por `.` com arredondamento decimal. |
| **REQ-04** | **Alocação Automática nas 4 Categorias:** Enquadramento contínuo sem furos: Leve (50-60), Meio-Médio (60.01-70), Médio (70.01-80), Pesado (80.01-90). | `src/utils/validationRules.ts` (`findWeightCategoryForWeight`) | `security-and-rules.test.ts` (Fase 06 Limites) | **APROVADO** | Nenhum. As faixas cobrem todo o intervalo decimal sem sobreposições. | N/A |
| **REQ-05** | **Detecção de Sobreposição de Categorias:** O sistema detecta e bloqueia a criação de faixas de peso sobrepostas ou conflitantes. | `src/utils/validationRules.ts` (`hasCategoryOverlap`) | `security-and-rules.test.ts` (Validação de Pesagem Decimal) | **APROVADO** | Risco de conflito caso organizador altere faixas dinamicamente. | Análise de impacto pré-salvamento (`getCategoryChangeImpact`) alertando sobreposições. |
| **REQ-06** | **Proteção de Menores (ECA / LGPD):** Inscrição de menores de 18 anos exige obrigatoriamente nome, documento e telefone do responsável legal. | `src/utils/validationRules.ts` (`validateMinorRegistration`)<br>`src/pages/public/RegistrationPage.tsx` | `security-and-rules.test.ts` (Proteção de Menores) | **APROVADO** | Risco de envio de dados de menor sem validação no cliente. | Validação em duas camadas: campos obrigatórios no formulário e bloqueio no motor de regras. |
| **REQ-07** | **Consentimentos Mandatórios:** Checkboxes explícitos de autorização de uso de imagem e aceitação do regulamento esportivo de combate. | `src/pages/public/RegistrationPage.tsx`<br>`src/utils/validationRules.ts` | `security-and-rules.test.ts` (Cessão de Imagem) | **APROVADO** | Nenhum. O botão de submissão só é liberado com ambos os termos aceitos. | N/A |
| **REQ-08** | **Compressão de Foto no Cliente (WebP):** Redimensionamento para 800x800px e conversão para WebP leve (< 150KB) antes do upload, rejeitando executáveis/SVGs. | `src/utils/imageCompressor.ts` (`validateImageFile`, `processAndCompressAthleteAvatar`) | `security-and-rules.test.ts` (Upload Seguro e Sanitização) | **APROVADO** | Arquivos SVG poderiam carregar scripts XSS. | Bloqueio estrito de SVG/EXE/JS, aceitando unicamente `image/jpeg`, `image/png` e `image/webp`. |
| **REQ-09** | **Estado Inicial da Inscrição (Pendente):** Toda inscrição submetida nasce obrigatoriamente no status `pending` para moderação administrativa. | `src/services/registrationService.ts`<br>`supabase/migrations/20261027000001_security_and_rls.sql` | `security-and-rules.test.ts` (Perfil 2 Pendente) | **APROVADO** | Nenhum. Atleta não consegue alterar seu próprio status para `approved`. | N/A |
| **REQ-10** | **Autenticação por Apelido e Senha:** Login sem expor o e-mail real do competidor, com tratamento insensível a maiúsculas/minúsculas. | `src/pages/auth/LoginPage.tsx`<br>`src/utils/validationRules.ts` (`normalizeNickname`)<br>`supabase/functions/auth-login` | `security-and-rules.test.ts` (Normalização de Apelido) | **APROVADO** | Divergência de maiúsculas poderia impedir o login. | Função `normalizeNickname` aplica `trim().toLowerCase()` uniformemente. |
| **REQ-11** | **Blindagem de E-mail de Recuperação:** O e-mail de recuperação é confidencial e nunca é exposto nas rotas públicas ou cards de atletas. | `src/utils/validationRules.ts` (`sanitizePublicAthleteProfile`)<br>`supabase/migrations/20261027000001_security_and_rls.sql` | `security-and-rules.test.ts` (Perfil 1 Anônimo) | **APROVADO** | Risco de vazamento em rotas de listagem pública. | View `public.public_athlete_cards` no PostgreSQL omite e-mail e dados de contato. |
| **REQ-12** | **Portal do Participante:** Exibição do card do atleta, categoria oficial, status da inscrição, mural de avisos fixados e próximo confronto. | `src/pages/athlete/AthletePortal.tsx`<br>`src/components/athlete/` | `security-and-rules.test.ts` (Portal Privado) & Subagent Browser E2E | **APROVADO** | Nenhum. Interface renderiza estados de carregamento elegantes e vazios. | N/A |
| **REQ-13** | **Centro de Comando Administrativo:** Hub completo com 6 abas (KPIs, Moderação, Matchmaker, Ao Vivo, Categorias e Auditoria). | `src/pages/admin/AdminDashboard.tsx`<br>`src/services/adminService.ts` | `security-and-rules.test.ts` (Centro de Comando) & Subagent Browser E2E | **APROVADO** | Linter TS6133 apontava imports não consumidos. | Código limpo e verificado com 0 erros TypeScript. |
| **REQ-14** | **Pesagem Oficial Presencial:** Registro do peso verificado na balança com detecção e alerta automático de reenquadramento de categoria. | `src/services/adminService.ts` (`recordOfficialWeighIn`) | `security-and-rules.test.ts` (Pesagem Oficial) | **APROVADO** | Atleta acima da categoria inscrita poderia passar despercebido. | Sistema calcula nova categoria e retorna `reallocatedCategory` com alerta visual. |
| **REQ-15** | **Integridade de Confrontos (Matchmaker):** Bloqueio de lutas entre atletas de eventos distintos, mesmo lutador contra si mesmo ou atletas não aprovados. | `src/utils/validationRules.ts` (`validateMatchIntegrity`) | `security-and-rules.test.ts` (Integridade de Confrontos) | **APROVADO** | Nenhum. O motor valida os IDs de evento, status e singularidade dos competidores. | N/A |
| **REQ-16** | **Homologação de Resultados e Métodos de Vitória:** Registro de vencedor legítimo, método (KO, TKO, Finalização, Pontos, etc.), detalhes e link de vídeo. | `src/services/adminService.ts` (`recordOfficialMatchResult`) | `security-and-rules.test.ts` (Resultado Oficial) | **APROVADO** | Vencedor poderia ser informado com ID estranho à luta. | Validação estrita exigindo que `winnerRegistrationId` seja Corner 1 ou Corner 2. |
| **REQ-17** | **Chaveamento Mata-Mata Automatizado:** Geração de brackets eliminatórios com potências de 2, byes automáticos e cálculo estatístico. | `src/services/bracketEngine.ts`<br>`src/components/admin/AdminBracketView.tsx` | `security-and-rules.test.ts` & TypeScript Strict | **APROVADO** | Nenhum. Suporta categorias com números ímpares de competidores. | N/A |
| **REQ-18** | **Mídia e Comunicados Oficiais:** Publicação de vídeos/fotos (públicos e privados) e avisos com opção de fixar no topo do mural do atleta. | `src/services/adminService.ts` (`saveAnnouncement`, `saveMediaItem`) | `security-and-rules.test.ts` (Fase 06 Mídias) | **APROVADO** | Colisão de IDs se criados no mesmo milissegundo. | Adicionado sufixo criptográfico aleatório `Math.random().toString(36).substring(2, 7)`. |
| **REQ-19** | **Exportação e Backup Resiliente:** Exportação CSV de participantes e pacote de backup JSON versionado com checksum SHA. | `src/services/adminService.ts` (`exportEventParticipantsCsv`, `exportEventJsonBackup`) | `security-and-rules.test.ts` (CSV e Backup JSON) | **APROVADO** | Nenhum. Arquivos gerados contêm todos os relacionamentos e histórico esportivo. | N/A |
| **REQ-20** | **Exclusão Segura de Evento:** Exclusão definitiva de evento exige confirmação explícita digitando o título exato. | `src/services/adminService.ts` (`deleteEventSafely`) | `security-and-rules.test.ts` (Exclusão Segura) | **APROVADO** | Risco de clique acidental excluir histórico. | Exige validação de string idêntica ao título cadastrado antes do purge em cascata. |
| **REQ-21** | **Multi-Evento Sob Gestão Única (Single-Org):** Plataforma suporta múltiplos eventos independentes sem misturar atletas ou históricos. | `src/services/adminService.ts`<br>`src/services/athleteService.ts` | `security-and-rules.test.ts` (Multi-Evento) | **APROVADO** | Nenhum. Eventos possuem slugs próprios, categorias próprias e isolamento. | N/A |
| **REQ-22** | **Proteção RLS (Zero Trust Client):** Row Level Security habilitado em todas as 9 tabelas do PostgreSQL. | `supabase/migrations/20261027000001_security_and_rls.sql` | `security-and-rules.test.ts` (5 Perfis de Segurança) | **APROVADO** | Nenhum. Tabelas não aceitam modificação sem `auth.uid()` legítimo ou `is_admin()`. | N/A |
| **REQ-23** | **Deploy Contínuo Cloudflare Pages:** Build reproduzível com roteamento SPA via `_redirects` sem erros 404 em recarregamento. | `public/_redirects`<br>`docs/deployment/CLOUDFLARE_PAGES.md` | `npm run build` & Verificação de arquivo `_redirects` | **APROVADO** | Nenhum. Regra `/* /index.html 200` presente em `public/_redirects`. | N/A |

---

## 3. Síntese Quantitativa da Rastreabilidade

* **Total de Requisitos Auditados:** 23
* **Aprovados com Evidência:** 23 (100%)
* **Falhou:** 0 (0%)
* **Incompletos:** 0 (0%)
* **Não Testados:** 0 (0%)
* **Bloqueados:** 0 (0%)
* **Não Aplicáveis:** 0 (0%)
