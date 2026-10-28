# U.C.U ARENA — Guia de Deploy no Cloudflare Pages

**Versão:** 1.0.0  
**Data:** 28 de Outubro de 2026  
**Finalidade:** Guia passo a passo para publicação contínua (CI/CD) gratuita da aplicação frontend no Cloudflare Pages conectado ao repositório GitHub.

---

## 1. Visão Geral da Hospedagem

O frontend da **U.C.U Arena** é uma aplicação de página única (*Single Page Application* — SPA) compilada estaticamente via Vite. 
O Cloudflare Pages oferece:
* Hospedagem 100% gratuita com largura de banda ilimitada e CDN global em mais de 300 data centers.
* Certificado SSL/TLS automático com renovação transparente.
* Integração nativa com Git (deploys automáticos a cada commit na branch `main`).
* Suporte nativo a Single Page Apps através do arquivo de regras `public/_redirects`.

---

## 2. Preparação do Repositório Git

1. Garanta que todas as alterações locais estão commitadas no branch principal (`main`):
   ```bash
   git add .
   git commit -m "feat(phase-06): certifacacao, seguranca e configuracao de deploy"
   git push origin main
   ```
2. Certifique-se de que os seguintes arquivos críticos estão presentes:
   * `public/_redirects` contendo a regra de SPA:
     ```
     /*    /index.html   200
     ```
   * `.gitignore` ignorando `.env`, `node_modules` e `/dist`.

---

## 3. Conexão no Cloudflare Dashboard

1. Acesse [https://dash.cloudflare.com](https://dash.cloudflare.com) e crie ou acesse sua conta gratuita.
2. No menu lateral, navegue até **Workers & Pages** -> **Overview**.
3. Clique em **Create application** e selecione a aba **Pages**.
4. Clique em **Connect to Git**.
5. Autorize o Cloudflare a acessar sua conta GitHub e selecione o repositório da **U.C.U Arena**.

---

## 4. Configuração de Build no Cloudflare Pages

Na tela de configuração do projeto, defina os seguintes parâmetros exatos:

| Campo | Valor Obrigatório | Descrição |
| :--- | :--- | :--- |
| **Project name** | `ucu-arena` | Nome do projeto (gerará `ucu-arena.pages.dev`) |
| **Production branch** | `main` | Branch que aciona o deploy de produção |
| **Framework preset** | `Vite` | Pré-configuração padrão de build |
| **Build command** | `npm run build` | Executa a compilação do TypeScript e Vite |
| **Build output directory** | `dist` | Pasta onde o Vite gera o bundle final |
| **Root directory** | *(deixar em branco)* | Raiz do repositório |

---

## 5. Configuração de Variáveis de Ambiente

Na mesma tela (ou em **Settings** -> **Environment variables** após criar o projeto), configure as variáveis de produção:

| Variável | Valor | Finalidade |
| :--- | :--- | :--- |
| **`NODE_VERSION`** | `18` (ou `20`) | Garante que o ambiente de build use Node LTS |
| **`VITE_SUPABASE_URL`** | `https://sua-instancia.supabase.co` | URL pública da API do Supabase |
| **`VITE_SUPABASE_ANON_KEY`** | `eyJhbGciOi...` | Chave pública `anon` do Supabase |

> 🔒 **Lembrete de Segurança:** NUNCA configure `SUPABASE_SERVICE_ROLE_KEY` no Cloudflare Pages. O frontend utiliza apenas chamadas autenticadas com a chave pública e tokens de sessão de usuários gerenciados pelo Supabase Auth.

---

## 6. Salvar e Realizar o Primeiro Deploy

1. Clique no botão **Save and Deploy**.
2. O Cloudflare Pages iniciará o container de build, instalando dependências com `npm install`, executando `npm run build` e publicando os artefatos estáticos.
3. Ao concluir com sucesso (em cerca de 45 a 60 segundos), você receberá a URL oficial de produção:
   ```
   https://ucu-arena.pages.dev
   ```

---

## 7. Configuração de Domínio Personalizado (Opcional)

Se desejar apontar um domínio próprio (ex.: `arena.ucu.com.br`):
1. No painel do seu projeto no Pages, acesse a aba **Custom domains**.
2. Clique em **Set up a custom domain**.
3. Digite o domínio ou subdomínio desejado.
4. Siga as instruções de apontamento CNAME fornecidas pela Cloudflare. O certificado SSL será emitido automaticamente em minutos.

---

## 8. Verificação Pós-Deploy (Smoke Tests)

Após a publicação, execute o seguinte checklist de validação na URL pública:
* [ ] A página inicial abre com o envelope 3D interativo sem erros no console.
* [ ] A rota pública `/convite/arena-inaugural` carrega as informações do evento.
* [ ] Recarregamento forçado de página em rotas internas (`/login`, `/atleta`) não resulta em erro 404 (confirmação da regra `/* /index.html 200`).
* [ ] Formulário de inscrição abre sem quebras de layout em smartphone (iPhone/Android).
* [ ] Upload de imagem compacta corretamente a foto em WebP e exibe o preview.
