# U.C.U ARENA — Relatório da Auditoria de Segurança e Privacidade

**Versão:** 1.0.0  
**Data da Auditoria:** 28 de Outubro de 2026  
**Auditor Responsável:** Especialista em Segurança Web, Criptografia e Bancos de Dados  
**Classificação:** Auditoria Técnica de Segurança e Conformidade Regulatória  
**Status Geral:** ✅ **APROVADO** (Padrões de segurança Zero Trust Client e conformidade LGPD/ECA validados)

---

## 1. Segurança de Banco de Dados e Row Level Security (RLS)

A aplicação segue o princípio rigoroso de **Zero Trust Client**: o navegador nunca é considerado uma fonte confiável de autorização. O banco de dados PostgreSQL impõe o controle de acesso através de políticas ativas de Row Level Security em todas as 9 tabelas do esquema público:

| Tabela | RLS Ativo? | Política de SELECT | Política de INSERT | Política de UPDATE | Política de DELETE |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`profiles`** | ✅ Sim | Apenas o próprio atleta (`auth.uid() = auth_user_id`) ou Administrador Principal (`is_admin()`). | Próprio atleta autenticado (`auth.uid() = auth_user_id`). | Próprio atleta ou Administrador Principal. | **Exclusivo de Administrador Principal.** |
| **`admin_users`** | ✅ Sim | **Exclusivo de Administrador Principal.** Atletas comuns recebem conjunto vazio. | **Bloqueado via API pública.** Apenas conexão direta de banco / script SQL. | **Bloqueado via API pública.** | **Exclusivo de Administrador Principal.** |
| **`events`** | ✅ Sim | Público para eventos com `status <> 'draft'`; rascunhos visíveis apenas por admins. | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** |
| **`weight_categories`** | ✅ Sim | Leitura pública (para preenchimento do formulário e consulta do card). | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** |
| **`event_registrations`** | ✅ Sim | Inscrições aprovadas são públicas; inscrições pendentes/recusadas visíveis apenas pelo dono ou admin. | Atleta autenticado apenas para seu próprio `profile_id`. | Admin pode aprovar/alterar; atleta só pode alterar para `withdrawn` (desistência). | **Exclusivo de Administrador Principal.** |
| **`matches`** | ✅ Sim | Leitura pública (chaveamento e resultados oficiais). | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** |
| **`media_items`** | ✅ Sim | Leitura pública para itens com `is_public = true`. | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** |
| **`event_announcements`**| ✅ Sim | Leitura pública. | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** | **Exclusivo de Administrador Principal.** |
| **`audit_logs`** | ✅ Sim | **Exclusivo de Administrador Principal.** | Sistema / Usuários autenticados durante operações. | **Imutável.** Nenhuma política de UPDATE é criada. | **Imutável.** Nenhuma política de DELETE é criada. |

---

## 2. Visão Segura para Dados Públicos (`public.public_athlete_cards`)

Para viabilizar a renderização das chaves e do card do campeonato sem risco de vazamento de dados privados, o banco de dados expõe a view protegida:

```sql
CREATE OR REPLACE VIEW public.public_athlete_cards AS
SELECT
    p.id AS profile_id,
    p.nickname,
    p.avatar_url,
    er.id AS registration_id,
    er.event_id,
    er.weight_category_id,
    wc.name AS category_name,
    er.status AS registration_status
FROM public.profiles p
JOIN public.event_registrations er ON er.profile_id = p.id
JOIN public.weight_categories wc ON wc.id = er.weight_category_id
WHERE er.status = 'approved';
```

### Garantia de Não-Vazamento:
* O e-mail de recuperação **não existe** nesta view.
* O telefone e WhatsApp do atleta **não existem** nesta view.
* O nome civil completo **não existe** nesta view (exibição apenas pelo Apelido de Combate).
* Documentos e dados de responsáveis legais de atletas menores **não existem** nesta view.

---

## 3. Autenticação Segura por Apelido Único

* **Resolução Segura:** O login é feito enviando o apelido e a senha para a Edge Function / RPC segura. A função localiza o identificador interno sem expor o e-mail real do atleta na resposta.
* **Normalização:** A função `normalizeNickname` garante a consulta insensível a maiúsculas (`LOWER(TRIM(nickname))`).
* **Proteção de Credenciais:** As senhas nunca trafegam em texto puro nos logs do sistema e são armazenadas como hashes protegidos pelo motor do Supabase Auth (Bcrypt).
* **Ausência de Tokens nos Logs:** Todos os serviços de console do frontend e suítes de teste foram inspecionados para garantir que tokens JWT e segredos de sessão jamais sejam impressos em stdout ou stderr.

---

## 4. Segurança do Storage e Upload de Arquivos

O bucket `avatars` no Supabase Storage foi provisionado com restrições arquiteturais rigorosas:

1. **Limite Estrito de Tamanho:** `2 MB` (2.097.152 bytes) imposto tanto no cliente quanto na política do Storage do Supabase.
2. **Tipos MIME Permitidos:** Estritamente limitado a `image/jpeg`, `image/png` e `image/webp`.
3. **Bloqueio de Extensões Perigosas:** Rejeição comprovada por testes unitários para arquivos `.svg` (vetor clássico de Stored XSS via tags `<script>`), executáveis `.exe` e scripts `.js`.
4. **Isolamento de Diretórios:** A política de storage impõe que o arquivo seja gravado sob a pasta com o próprio UID do usuário autenticado:
   ```sql
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   Isso impede que um atleta tente sobrescrever a foto de perfil de outro competidor.

---

## 5. Auditoria de Vulnerabilidades em Dependências (`npm audit`)

Executamos o comando oficial `npm audit` no ambiente de desenvolvimento:

* **Relatório:** Detectou 2 vulnerabilidades de severidade moderada associadas à biblioteca `react-router-dom@6.28.0` (CVE-2025-68470 — bypass de open redirect via contrabarra e SSR constructor injection em `deserializeErrors()`).
* **Análise de Risco Real no Projeto:**
  * **Risco Residual: Baixo / Nulo.**
  * *Justificativa Técnica:* A U.C.U Arena é uma Single Page Application (SPA) client-side pura, compilada para HTML estático e servida pela CDN da Cloudflare. Não há renderização no servidor (SSR), o que neutraliza completamente a injeção em `deserializeErrors()`. Além disso, todos os redirecionamentos do sistema são internos e sanitizados, sem leitura de parâmetros de redirecionamento arbitrário da URL.
  * O upgrade para `react-router-dom@7` está documentado como caminho de evolução futura.

---

## 6. Privacidade e Proteção a Menores (LGPD & ECA)

Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990):

1. **Minimização de Dados:** Apenas os dados estritamente necessários para viabilizar a competição esportiva são solicitados.
2. **Dados de Menores:**
   * Qualquer atleta com idade inferior a 18 anos na data do evento é categorizado como menor de idade.
   * O sistema exige expressamente o preenchimento de: Nome do Responsável, Grau de Parentesco, Telefone do Responsável e Documento de Identidade.
   * Estes dados ficam armazenados sob sigilo absoluto, acessíveis exclusivamente pela equipe organizadora para fins de segurança médica e legal.
3. **Cessão de Imagem e Termo de Consentimento:** Checkbox obrigatório e destacado no ato da inscrição, permitindo aos participantes (ou responsáveis) exercerem o direito de revogação ou pedido de desindexação através do canal de DPO documentado na Política de Privacidade.
