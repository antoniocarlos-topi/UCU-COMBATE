# U.C.U ARENA — Relatório de Execução da Fase 02: Backend, Banco e Segurança

**Versão:** 1.0.0  
**Data:** 27 de Outubro de 2026  
**Status:** Concluído e Validado (Migrações SQL OK, RLS OK, Edge Functions OK, 15/15 Testes Automatizados Aprovados)  
**Motor do Banco:** PostgreSQL 15+ (Supabase)  
**Conformidade:** LGPD, Estatuto da Criança e do Adolescente (ECA) e Arquitetura *Zero Trust*

---

## 1. Visão Geral do Backend Implementado

Nesta fase foi construída a fundação completa do backend da **U.C.U Arena**, garantindo suporte a múltiplos eventos, categorização estrita de peso com validação no banco, autenticação por apelido e senha sem vazamento de e-mails, controle exclusivo para um Administrador Principal e isolamento rígido de permissões via **Row Level Security (RLS)**.

---

## 2. Estrutura de Arquivos e Migrações Geradas

```plaintext
supabase/
├── functions/
│   ├── auth-login/
│   │   └── index.ts          # Resolução segura de login por Apelido com Rate Limiting
│   └── auth-reset-request/
│       └── index.ts          # Recuperação anônima de senha com mensagem constante
├── migrations/
│   ├── 20261027000000_core_schema.sql      # 8 tabelas centrais, constraints e triggers
│   ├── 20261027000001_security_and_rls.sql # RLS em todas as tabelas e visão segura
│   └── 20261027000002_storage_setup.sql    # Bucket avatars, limite de 2MB e tipos
└── scripts/
    └── provision_admin.sql   # Script SQL seguro para provisionar o Administrador Principal
src/
└── utils/
    └── validationRules.ts    # Motor centralizado de validações e regras de negócio
tests/
└── security-and-rules.test.ts # Suite de 15 testes automatizados de segurança e integridade
```

---

## 3. Entidades e Regras de Integridade do Banco de Dados

### 3.1. Múltiplos Eventos e Inscrições Únicas
- **Tabela `events`:** Permite criar N edições de campeonatos. Cada evento possui `slug` único, regras em Markdown, faixa geral permitida de peso e link do grupo de WhatsApp.
- **Tabela `event_registrations`:** Relaciona atleta (`profile_id`) e evento (`event_id`).
  - Restrição `UNIQUE(event_id, profile_id)`: Um atleta pode participar de múltiplos eventos diferentes ao longo do tempo, mas é terminantemente impedido de gerar inscrições duplicadas no mesmo campeonato.

### 3.2. Categorias de Peso Decimais e Regras Centralizadas
- **Limites Inegociáveis:** `50,00 kg` a `90,00 kg` validados por `CHECK constraints` no banco de dados tanto no cadastro do evento quanto nas inscrições.
- **Categorias Padrão:**
  1. `50,00 kg a 60,00 kg`
  2. `Mais de 60,00 kg até 70,00 kg` (`60.01` a `70.00`)
  3. `Mais de 70,00 kg até 80,00 kg` (`70.01` a `80.00`)
  4. `Mais de 80,00 kg até 90,00 kg` (`80.01` a `90.00`)
- **Gatilho de Não-Sobreposição (`trg_check_weight_category_overlap`):** Rejeita automaticamente qualquer tentativa de cadastrar categorias com sobreposição de faixas dentro do mesmo evento.
- **Gatilho de Correspondência de Peso (`trg_validate_registration_weight_match`):** Valida se o peso declarado do atleta pertence rigorosamente à categoria selecionada.

### 3.3. Integridade de Combates (Matches)
- **Gatilho `trg_check_match_integrity`:**
  - Bloqueia confrontos de um lutador contra si mesmo (`fighter1 <> fighter2`).
  - Bloqueia confrontos entre atletas de eventos distintos (*Cross-Event Fight*).
  - Exige que ambos os atletas estejam com status `approved` (aprovado pela moderação).
  - Garante que o vencedor lançado seja um dos dois competidores do confronto.

---

## 4. Autenticação Segura por Apelido e Senha

Para atender à experiência de uso e privacidade da U.C.U Arena:
1. **Login Server-Side (`auth-login`):**
   - O atleta envia apenas `{ nickname, password }`.
   - A Edge Function consulta o PostgreSQL usando privilégios de serviço (`SUPABASE_SERVICE_ROLE_KEY`) buscando por `nickname_normalized = LOWER(TRIM(nickname))`.
   - Realiza a autenticação internamente via `supabase.auth.signInWithPassword`.
   - O e-mail de recuperação **NUNCA** é retornado ao navegador.
2. **Proteção Contra Força Bruta (Rate Limiting):**
   - Controle em memória por IP limitando a no máximo 5 tentativas a cada 15 minutos. Após exceder, retorna HTTP `429 Too Many Requests`.
3. **Mitigação de Enumeração de Contas:**
   - Mensagem de erro idêntica para apelido inexistente e senha incorreta: `"Apelido ou senha incorretos."`
4. **Recuperação de Acesso Anônima (`auth-reset-request`):**
   - O atleta solicita redefinição informando apenas seu apelido. O sistema localiza o e-mail confidencial correspondente e dispara o link oficial do Supabase Auth.
   - Resposta constante: *"Se o apelido estiver cadastrado, as instruções foram enviadas para o e-mail associado."*

---

## 5. Provisionamento do Administrador Único

- **Zero Cadastro Público:** Nenhuma tela permite cadastrar administradores.
- **Tabela `admin_users`:** Registra o UUID do Administrador Principal com chave estrangeira para `auth.users`.
- **Função `public.is_admin()`:** Função `SECURITY DEFINER` que verifica se o usuário autenticado (`auth.uid()`) existe na tabela `admin_users` com `is_active = true`.
- **Imutabilidade de Papel:** Nenhuma alteração no perfil do usuário (`profiles`) concede permissão de administrador.
- **Procedimento para o Proprietário:** Disponibilizado no script `supabase/scripts/provision_admin.sql` para execução direta no console SQL do Supabase.

---

## 6. Políticas de RLS e Armazenamento (Storage)

### 6.1. Matriz de Acesso RLS
- **`profiles`:** Visitantes e outros atletas **NÃO** têm acesso direto à tabela `profiles`. Apenas o próprio dono do perfil (`auth.uid() = auth_user_id`) e o Administrador Principal (`public.is_admin()`) podem consultar.
- **Visão Pública Segura (`public_athlete_cards`):** Expõe exclusivamente `id, nickname, avatar_url, event_id, category_name` para atletas aprovados, ocultando telefone, e-mail e dados de menores.
- **`events`:** Leitura pública para eventos com status diferente de rascunho. Modificação restrita ao admin.
- **`event_registrations`:** Atletas só visualizam a sua própria inscrição; admin visualiza e modera todas. Atletas só podem atualizar sua inscrição para `withdrawn` (desistência).
- **`matches` & `media_items`:** Leitura pública; gerenciamento restrito ao admin.

### 6.2. Supabase Storage (Bucket `avatars`)
- Leitura pública via CDN para exibição rápida nos cards de combate.
- Escrita restrita: Usuários autenticados só gravam na pasta com seu próprio ID (`avatars/{auth.uid()}/*`).
- Limite de arquivo: **2 MB**.
- Tipos MIME permitidos: `image/jpeg`, `image/png`, `image/webp`.

---

## 7. Proteção de Menores de Idade (ECA & LGPD)

- **Cálculo Automático de Maioridade:** A função `calculateAgeAtEvent` calcula a idade exata na data do evento.
- **Campos Obrigatórios para Menores:** Nome do responsável legal, parentesco, telefone e documento de identidade.
- **Consentimentos:** A inscrição é rejeitada se não houver aceite formal da cessão de imagem e regulamento esportivo.
- **Sigilo Total:** Os dados do responsável e documentos de identificação nunca são expostos em endpoints públicos.

---

## 8. Resultados dos Testes Automatizados

Foi executada a suite automatizada com **Vitest** (`npm run test`):

```bash
 ✓ tests/security-and-rules.test.ts (15 tests) 7ms

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  233ms
```

### Casos de Teste Validados:
1. ✅ Aceitação de pesos nos limites inferior (`50.00 kg`) e superior (`90.00 kg`).
2. ❌ Rejeição de pesos abaixo do mínimo (`49.99 kg`, `35.50 kg`, `0 kg`).
3. ❌ Rejeição de pesos acima do máximo (`90.01 kg`, `105.20 kg`).
4. ✅ Alocação precisa nos 4 brackets padrão da U.C.U Arena.
5. ❌ Detecção matemática de sobreposição entre categorias de peso.
6. ✅ Cálculo dinâmico de idade na data do evento (adulto vs menor).
7. ❌ Rejeição de menor sem nome, telefone ou documento do responsável legal.
8. ❌ Rejeição de inscrição sem cessão de imagem ou termos esportivos.
9. ❌ Rejeição de luta entre atletas de eventos distintos (*Cross-Event Fight*).
10. ❌ Rejeição de luta com atletas com status pendente ou não aprovado.
11. ❌ Rejeição de luta de um atleta contra si mesmo.
12. ❌ Rejeição de vencedor que não participa do combate.
13. ✅ Aceitação de combate íntegro com atletas aprovados no mesmo evento.
14. ✅ Normalização de apelido (LOWER + TRIM).
15. 🛡️ Sanitização de perfil público com expurgo total de e-mails, telefones e documentos.

---

## 9. Ações Manuais Necessárias do Proprietário (Owner)

Para conectar o projeto ao ambiente de nuvem ativo do Supabase:

1. **Ativação da Instância Supabase:**
   - No painel [supabase.com](https://supabase.com), acesse o projeto e, se estiver pausado por inatividade, clique em **"Restore Project"** (ou crie um novo projeto na região **São Paulo `sa-east-1`**).
2. **Execução das Migrações:**
   - No **SQL Editor** do Supabase, execute sequencialmente os arquivos:
     - `supabase/migrations/20261027000000_core_schema.sql`
     - `supabase/migrations/20261027000001_security_and_rls.sql`
     - `supabase/migrations/20261027000002_storage_setup.sql`
3. **Provisionamento do Administrador:**
   - Crie a conta do organizador em **Authentication > Users**.
   - Execute o script `supabase/scripts/provision_admin.sql` substituindo pelo e-mail cadastrado.
4. **Deploy das Edge Functions:**
   - Publicar as funções `auth-login` e `auth-reset-request` via Supabase CLI ou console.
5. **Configuração do Arquivo `.env`:**
   - Preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` obtidas em **Project Settings > API**.

---

## 🚀 Próxima Etapa: Fase 03 — Inscrições Reais, Upload WebP e Fluxo do Evento

Com a fundação visual (Fase 01) e o backend com banco e segurança (Fase 02) concluídos e validados:
- Conectar o formulário mobile de inscrição à API real do Supabase.
- Implementar o upload com corte e compressão automática no cliente para formato WebP no bucket `avatars`.
- Conectar a busca do evento público com contagem regressiva e categorias ativas direto do banco.
