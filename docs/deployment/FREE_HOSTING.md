# U.C.U ARENA — Estratégia de Hospedagem Gratuita e Deploy

**Versão:** 1.0.0  
**Status:** Guia de Infraestrutura e Custos Zero  
**Provedores:** Cloudflare Pages (Frontend SPA) + Supabase Cloud (BaaS)

---

## 1. Análise Comparativa dos Planos Gratuitos (Free Tiers)

O sistema foi rigorosamente dimensionado para operar com **custo financeiro R$ 0,00 (Zero Reais)** utilizando provedores de infraestrutura modernos e generosos.

| Recurso / Métrica | Limite do Plano Gratuito | Demanda Estimada da U.C.U Arena | Status / Margem de Segurança |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages: Largura de Banda** | **Ilimitada** | ~15 a 50 GB / mês | ✅ **100% Coberto** (Sem risco de surpresas financeiras) |
| **Cloudflare Pages: Builds CI/CD** | 500 compilações / mês | ~20 a 40 builds / mês | ✅ **Ampla folga** (Uso < 10% da cota) |
| **Cloudflare Pages: Domínio e SSL** | Subdomínio `.pages.dev` + SSL Grátis (e suporte a domínio próprio) | 1 subdomínio gratuito + SSL Let's Encrypt automático | ✅ **Custo Zero** |
| **Supabase: Banco de Dados Postgres** | **500 MB** de dados relacionais | ~5 MB por 1.000 inscrições e dezenas de eventos | ✅ **Ampla folga** (Capacidade para anos de eventos) |
| **Supabase: Armazenamento (Storage)** | **1.000 MB (1 GB)** | ~150 KB por foto de perfil (WebP otimizado) = ~6.500 fotos | ✅ **Seguro** com compressão no cliente |
| **Supabase: Egress (Transferência)** | **10 GB / mês** | ~2 a 5 GB em dias de pico | ✅ **Dentro da cota** |
| **Supabase: Usuários Ativos (MAU)** | **50.000 usuários / mês** | ~200 a 1.000 atletas / mês | ✅ **Uso < 2% da cota** |
| **Supabase: Edge Functions** | **500.000 execuções / mês** | ~5.000 a 15.000 logins e ações / mês | ✅ **Uso < 3% da cota** |

---

## 2. Ponto de Atenção Crítico: Pausa por Inatividade do Supabase

### A Regra do Free Tier
No plano gratuito do Supabase, qualquer projeto que passe **7 dias consecutivos sem nenhuma requisição ao banco de dados** entra automaticamente em estado de pausa (*paused*). Os dados **não são perdidos**, mas a aplicação web passa a exibir erro de conexão até que o proprietário entre no painel e clique em *"Restore Project"* (leva cerca de 1 a 2 minutos para religar).

### Estratégias de Mitigação:
1. **Atividade Natural:** Durante a fase de inscrições e semanas pré-evento, os acessos diários dos atletas e administradores impedem qualquer inatividade.
2. **Ping Automatizado (Heartbeat Opcional via GitHub Actions):**
   - Configurar um fluxo simples no GitHub Actions (`.github/workflows/keep-alive.yml`) que execute a cada 3 dias realizando um `SELECT 1` simples na API anônima do Supabase, mantendo a instância sempre ativa e aquecida sem custos.

---

## 3. Passo a Passo de Configuração e Deploy

### 3.1. Configuração do Backend no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um novo projeto com o nome `ucu-arena`.
3. **Região do Servidor:** Escolha obrigatoriamente **`São Paulo (sa-east-1)`** para garantir a menor latência possível (< 25ms para usuários no Brasil).
4. Guarde com segurança a senha do banco gerada.
5. No menu **SQL Editor**, execute o script consolidado de migração (`docs/architecture/DATA_MODEL.md` e `docs/security/SECURITY_AND_PRIVACY.md`).
6. No menu **Storage**:
   - Crie um bucket chamado `avatars`.
   - Marque a opção **Public Bucket**.
   - Defina o limite de arquivo para `2MB` e tipos permitidos para `image/jpeg, image/png, image/webp`.
7. No menu **Project Settings > API**, anote:
   - `Project URL` (ex.: `https://xyz.supabase.co`)
   - `Project API anon key` (Chave pública para o frontend)
   - `Project API service_role key` (Chave privada para Edge Functions — **NUNCA** commitar).

### 3.2. Configuração do Frontend no Cloudflare Pages
1. Crie uma conta gratuita em [dash.cloudflare.com](https://dash.cloudflare.com).
2. Acesse **Workers & Pages > Create application > Pages > Connect to Git**.
3. Selecione o repositório GitHub do projeto (`projeto-100futuro` ou `ucu-arena`).
4. Configure os parâmetros de compilação:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (ou a raiz do repositório)
5. Em **Environment variables (Variáveis de Ambiente)**, adicione:
   - `VITE_SUPABASE_URL`: `https://sua-url-do-supabase.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sua-chave-anon-publica`
6. Clique em **Save and Deploy**.
7. O Cloudflare Pages fornecerá imediatamente uma URL global rápida (ex.: `https://ucu-arena.pages.dev`).

### 3.3. Configuração de Roteamento SPA no Cloudflare (`_redirects`)
Para evitar que atletas recebam erro `404 Not Found` ao recarregar rotas diretas (como `/e/arena-1` ou `/atleta`), o arquivo `public/_redirects` deve conter a instrução canônica de SPA:
```plaintext
/*    /index.html   200
```
Isso instrui a CDN da Cloudflare a sempre servir o aplicativo React, permitindo que o React Router processe as rotas no cliente com perfeição.

---

## 4. Gatilhos de Crescimento e Quando Considerar Planos Pagos

A plataforma U.C.U Arena pode operar confortavelmente de forma gratuita por múltiplos anos no formato atual. Apenas os seguintes cenários justificariam um upgrade futuro:
- **Mais de 50.000 atletas ativos por mês:** Upgrade para o Supabase Pro ($25/mês).
- **Armazenamento de Vídeos Brutos no Supabase:** Recomendamos **não** hospedar arquivos de vídeo no Supabase. O melhor padrão técnico é armazenar apenas links externos (YouTube não listado, Vimeo ou Cloudflare Stream), mantendo o consumo de storage do Supabase restrito a fotos leves.
