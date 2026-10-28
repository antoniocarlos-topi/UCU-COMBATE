# U.C.U ARENA — Limitações Conhecidas, Backup e Plano de Contingência

**Versão:** 1.0.0  
**Data da Auditoria:** 28 de Outubro de 2026  
**Finalidade:** Mapeamento honesto e explícito das limitações arquiteturais, dependências de infraestrutura gratuita e procedimentos de contingência operacional.

---

## 1. Limitações Arquiteturais da Versão 1.0.0

### 1.1. Modelo Organizacional Único (*Single-Org, Multi-Event*)
* **Como funciona:** O sistema gerencia perfeitamente dezenas de campeonatos e edições sequenciais ou simultâneos (`U.C.U Arena 1`, `U.C.U Arena 2 — Edição de Inverno`, etc.), mantendo categorias de peso, atletas, lutas e históricos independentes por evento.
* **Limitação:** Não há isolamento multi-tenant para empresas concorrentes na mesma instalação (ou seja, não é um SaaS multi-empresa com múltiplos donos de federações independentes). Toda a plataforma pertence a uma única organização proprietária com uma conta de Administrador Principal.
* **Impacto:** Zero impacto para o modelo de negócios da U.C.U Arena, que foi concebida exclusivamente para os seus próprios eventos de combate.

### 1.2. Limites do Plano Gratuito do Supabase (Free Tier)
* **Pausa por Inatividade:** Projetos gratuitos no Supabase são pausados automaticamente se não receberem nenhuma requisição à API ou ao banco por 7 dias consecutivos.
  * *Contingência Documentada:* O uso rotineiro da organização e dos atletas inscritos previne a pausa. Durante meses de recesso entre edições, recomenda-se configurar um simples GitHub Action (*heartbeat ping*) chamando a rota `/rest/v1/events?select=id&limit=1` a cada 3 dias, conforme documentado em [`docs/deployment/FREE_HOSTING.md`](../deployment/FREE_HOSTING.md).
* **Pool de Conexões:** A cota gratuita oferece cerca de 60 conexões simultâneas via pooler PgBouncer. A arquitetura em SPA desacoplada minimiza requisições ao banco, sendo mais do que suficiente para suportar centenas de atletas simultâneos no dia do evento.

---

## 2. Estratégia de Backup, Recuperação e Integridade de Dados

O Administrador Principal possui dois mecanismos nativos de exportação e proteção contra desastres:

### 2.1. Exportação em Planilha CSV
* **Geração:** Pela aba **Inscrições & Pesagem** no painel `/admin`, com um toque no botão `Exportar Participantes (CSV)`.
* **Conteúdo:** Tabela completa com ID da inscrição, nome civil, apelido de combate, peso declarado, peso verificado na balança, status, data de nascimento, dados do responsável legal e aceite de termos.
* **Uso Prático:** Impressão de prancheta de pesagem física no dia da pesagem oficial ou conferência em planilhas Excel/Google Sheets.

### 2.2. Pacote JSON de Backup Estruturado com Checksum
* **Geração:** Pela aba **Mídia & Auditoria** ou configurações do evento, clicando em `Exportar Backup Completo (JSON)`.
* **Esquema:** JSON versionado (`schemaVersion: 1.0.0`) contendo evento, categorias, inscrições, confrontos com métodos de vitória e trilha imutável de auditoria.
* **Integridade:** Assinado com checksum SHA para garantir que o arquivo não foi corrompido ou adulterado em trânsito.

---

## 3. Riscos Operacionais em Ambientes Reais e Mitigações

### 3.1. Queda de Conexão Móvel (4G/Wi-Fi) no Ginásio de Combate
* **Cenário:** Em locais de luta subterrâneos ou ginásios lotados, a rede celular pode sofrer oscilação temporária.
* **Procedimento de Contingência:**
  1. A organização deve realizar a exportação CSV dos atletas aprovados antes de iniciar a pesagem.
  2. Os pesos aferidos na balança presencial podem ser anotados provisoriamente na planilha ou no navegador (que preserva o estado da sessão local).
  3. Assim que a conexão for restabelecida, o operador lança os pesos no sistema para recalcular as categorias e gerar o chaveamento ao vivo.

### 3.2. Rotação de Administrador e Recuperação de Acesso
* **Cenário:** O organizador perdeu a senha ou o smartphone onde estava autenticado.
* **Procedimento:** Seguir o guia seguro de provisionamento e recuperação em [`docs/security/ADMIN_PROVISIONING.md`](../security/ADMIN_PROVISIONING.md) através do painel administrativo do Supabase, sem nunca expor a chave mestra `service_role` publicamente.
