# U.C.U ARENA — Procedimento de Provisionamento do Administrador Principal

**Versão:** 1.0.0  
**Classificação:** Segurança Crítica / Procedimento Operacional Restrito  
**Princípio Arquitetural:** Exatamente uma conta de Administrador Principal com controle total (*Single-Org, Multi-Event*).

---

## 1. Visão Geral do Controle de Acesso Administrativo

Na plataforma **U.C.U Arena**, o acesso às rotas restritas (`/admin/*`) e às mutações de dados esportivos (aprovação de atletas, registro de pesagem, chaveamento, lançamento de resultados e exclusão de eventos) é protegido em múltiplos níveis:

1. **Frontend:** O componente [`AdminRoute.tsx`](../../src/components/common/AdminRoute.tsx) verifica o estado de autenticação e a claim/papel de administrador antes de renderizar qualquer elemento.
2. **Backend (PostgreSQL RLS):** A função de segurança `public.is_admin()` verifica se o identificador do usuário autenticado (`auth.uid()`) existe na tabela protegida `public.admin_users`.
3. **Imutabilidade de Papéis (Anti-Spoofing):** Nenhum atleta comum tem permissão de `INSERT`, `UPDATE` ou `SELECT` na tabela `public.admin_users`. Apenas uma conexão com credenciais de banco (SQL Editor do Supabase ou service role em migrações) pode provisionar novos administradores.

---

## 2. Procedimento de Provisionamento Passo a Passo

### Etapa 2.1 — Criação da Credencial no Supabase Auth
O Administrador Principal deve possuir uma conta no Supabase Auth. Existem duas formas seguras de criá-la:

#### Opção A: Pelo Painel do Supabase (Recomendado)
1. Acesse o Supabase Dashboard -> **Authentication** -> **Users**.
2. Clique em **Add User** -> **Create user**.
3. Informe o e-mail oficial da organização (ex.: `admin@ucuarena.com.br`) e defina uma senha forte (mínimo de 16 caracteres alfanuméricos com símbolos).
4. Marque a opção **Auto Confirm User?** como ativada para permitir o login imediato.
5. Copie o **User UID** gerado (ex.: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`).

#### Opção B: Pelo Próprio App (Fluxo de Cadastro Inicial)
1. Acesse a tela de inscrição ou crie o perfil do administrador informando o apelido canônico (ex.: `AdminPrincipal`).
2. Obtenha o `auth_user_id` correspondente criado no banco de dados.

---

### Etapa 2.2 — Atribuição do Papel de Superadministrador no PostgreSQL
No **SQL Editor** do Supabase Dashboard, execute o comando DDL de concessão:

```sql
-- Provisionamento Oficial do Administrador Principal
INSERT INTO public.admin_users (
    auth_user_id,
    role,
    full_name,
    nickname
) VALUES (
    'SUBSTITUA_PELO_UUID_DO_USUARIO_AUTH',
    'superadmin',
    'Organizador Oficial U.C.U Arena',
    'Admin Principal'
)
ON CONFLICT (auth_user_id) DO UPDATE SET
    role = 'superadmin',
    updated_at = NOW();
```

---

## 3. Validação do Acesso Administrativo

Após a execução do script:
1. Acesse a rota `/login` no navegador.
2. Digite o apelido (`Admin Principal`) e a senha configurada.
3. O sistema autenticará o usuário, detectará a existência na tabela `admin_users` e redirecionará automaticamente para o Centro de Comando em `/admin`.
4. Confirme que todas as 6 abas administrativas são acessíveis:
   * **Visão Geral (KPIs)**
   * **Inscrições & Pesagem**
   * **Matchmaker (Lutas)**
   * **Controle Ao Vivo**
   * **Categorias de Peso**
   * **Mídia & Auditoria**

---

## 4. Procedimento de Rotação de Credenciais e Revogação

Caso seja necessário substituir o Administrador Principal ou rotacionar a senha por razões de segurança:

### Rotação de Senha
* No Supabase Dashboard, acesse **Authentication** -> **Users**, localize o administrador e selecione **Send password reset** ou **Change password**.

### Revogação Imediata de Acesso Admin
Para revogar imediatamente os privilégios de um usuário sem apagar o histórico de auditoria:
```sql
DELETE FROM public.admin_users
WHERE auth_user_id = 'UUID_DO_ADMIN_A_REVOGAR';
```
> O efeito é instantâneo: as políticas RLS passarão a rejeitar qualquer requisição subsequente com erro `403 Forbidden`.

---

## 5. Trilha de Auditoria Obrigatória

Todas as ações sensíveis realizadas pelo Administrador Principal são registradas na tabela imutável `public.audit_logs`:
* Criação, edição e exclusão de eventos;
* Aprovação e recusa de inscrições com motivo;
* Lançamento de pesagem oficial na balança;
* Criação e agendamento de lutas;
* Homologação de resultados oficiais e métodos de vitória;
* Publicação e retirada de comunicados e mídias.
