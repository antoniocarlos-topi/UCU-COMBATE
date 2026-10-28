# U.C.U ARENA — Arquitetura do Sistema e Especificação Técnica

**Versão:** 1.0.0  
**Status:** Arquitetura Base Consolidada  
**Público-Alvo:** Engenharia de Software, DevOps e Desenvolvedores

---

## 1. Visão Arquitetural

A arquitetura da **U.C.U Arena** adota o padrão **Serverless Jamstack com Edge BaaS (Backend-as-a-Service)**, maximizando o desempenho, a segurança e a economia de custos. A plataforma foi desenhada para operar 100% dentro dos níveis gratuitos (*Free Tiers*) da Cloudflare e do Supabase, sem abrir mão de alta disponibilidade, segurança bancária em dados e uma experiência de usuário *mobile-first* com transições instantâneas a 60fps.

### Diagrama Geral da Solução
```mermaid
graph TB
    subgraph ClientLayer ["Camada de Apresentação (Mobile-First / PWA)"]
        MobileUser["Atleta / Convidado (Smartphone)"]
        AdminUser["Administrador Principal (Smartphone / Desktop)"]
    end

    subgraph EdgeCDN ["Edge CDN & Hosting (Cloudflare Pages)"]
        CF_Pages["Cloudflare Pages (Global Edge Network)<br/>SPA Estática Otimizada + Assets"]
    end

    subgraph BackendLayer ["Backend as a Service (Supabase Cloud)"]
        S_Auth["Supabase GoTrue Auth<br/>(JWT, Sessões, Password Hashing)"]
        S_Functions["Supabase Edge Functions (Deno Runtime)<br/>- auth-login (Apelido -> Sessão)<br/>- admin-actions"]
        S_DB[("PostgreSQL 15+<br/>- Row Level Security (RLS)<br/>- Stored Procedures (RPC)<br/>- Constraints & Triggers")]
        S_Storage["Supabase Storage<br/>Bucket: 'avatars' (Avatares Públicos)"]
    end

    subgraph Observability ["Observabilidade & Resiliência"]
        Sentry["Sentry Web SDK (Tratamento de Exceções & Performance)"]
    end

    MobileUser -->|HTTPS / PWA| CF_Pages
    AdminUser -->|HTTPS / PWA| CF_Pages

    CF_Pages -->|Direct SDK Calls (Anon Key)| S_DB
    CF_Pages -->|Public CDN Delivery| S_Storage
    CF_Pages -->|Login por Apelido| S_Functions
    CF_Pages -->|Auth Flow| S_Auth

    S_Functions -->|Service Role (Privilegiado)| S_DB
    S_Functions -->|Service Role| S_Auth

    CF_Pages -.->|Telemetria de Erros| Sentry
```

---

## 2. Escolha da Stack Tecnológica e Justificativa

| Camada | Tecnologia Escolhida | Justificativa Técnica e Benefícios |
| :--- | :--- | :--- |
| **Frontend Core** | **React 18+ com TypeScript & Vite** | Ecossistema maduro, tipagem estrita para modelos complexos de dados (chaveamentos, lutas), renderização reativa em dispositivos móveis e suporte nativo ao Vite para builds em menos de 10 segundos. |
| **Estilização (CSS)** | **Vanilla CSS Moderno com Design Tokens (CSS Variables)** | Cumpre a diretriz de flexibilidade máxima e estética rica, sem dependência do TailwindCSS. Permite criar efeitos de vidro (*glassmorphism*), gradientes metálicos dourados, micro-animações customizadas e zero custo de *runtime overhead*. |
| **Roteamento** | **React Router v6** | Roteamento declarativo no cliente, proteção de rotas privadas (`ProtectedRoute`), redirecionamento inteligente e suporte a *lazy loading* de módulos. |
| **Backend & Banco de Dados** | **Supabase (PostgreSQL 15+)** | Banco relacional robusto com integridade referencial, `CHECK constraints`, `Row Level Security (RLS)` em nível de linha no próprio banco e disparadores automáticos (`triggers`). |
| **Autenticação** | **Supabase Auth + Stored Procedure/Edge Function** | Padrão da indústria com emissão de tokens JWT, senhas com algoritmo *bcrypt/argon2* e resolução customizada de login por apelido no servidor. |
| **Armazenamento de Mídia** | **Supabase Storage (S3-compatible)** | Armazenamento de fotos de perfil com compressão prévia no navegador (WebP) e entrega por CDN com cache HTTP. |
| **Hospedagem & CI/CD** | **Cloudflare Pages** | Hospedagem estática com distribuição global ultrarrápida, SSL automático, deploy contínuo integrado ao GitHub e tráfego ilimitado no plano gratuito. |
| **Monitoramento** | **Sentry** | Rastreamento proativo de erros no cliente em tempo real, evitando bugs silenciosos em navegadores móveis diversos (Safari iOS, Chrome Android). |

---

## 3. Estrutura Modular de Pastas do Projeto

A organização segue convenções limpas de separação de responsabilidades (Clean Architecture no Frontend):

```plaintext
projeto-100futuro/
├── .agents/                      # Regras e comportamentos dos assistentes
│   └── rules/
│       └── ucu-project.md        # Diretrizes inegociáveis do projeto
├── docs/                         # Documentação técnica e de produto
│   ├── product/
│   │   └── PRD.md
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── DATA_MODEL.md
│   ├── security/
│   │   └── SECURITY_AND_PRIVACY.md
│   ├── deployment/
│   │   └── FREE_HOSTING.md
│   └── implementation/
│       └── ROADMAP.md
├── public/                       # Assets estáticos (favicon, manifest PWA, ícones)
│   ├── favicon.svg
│   ├── manifest.json
│   └── og-banner.jpg
├── src/
│   ├── assets/                   # Ícones vetoriais, texturas metálicas, brasões
│   ├── components/               # Componentes reutilizáveis do Design System
│   │   ├── common/               # Botões dourados, inputs, modal, badges, skeletons
│   │   ├── layout/               # Header mobile, bottom navigation, container
│   │   └── feedback/             # Toasts animados, alertas, telas de erro/vazio
│   ├── contexts/                 # Contextos globais (AuthContext, EventContext)
│   ├── hooks/                    # Custom Hooks (useAuth, useEvent, useRegistration)
│   ├── lib/                      # Configurações externas (supabaseClient, sentry)
│   ├── pages/                    # Telas da aplicação organizadas por domínio
│   │   ├── public/               # Convite público (/e/:slug), Inscrição, Regras
│   │   ├── auth/                 # Login com Apelido, Recuperação de Acesso
│   │   ├── athlete/              # Portal do Atleta (/atleta)
│   │   └── admin/                # Painel de Administração (/admin/...)
│   │       ├── Dashboard.tsx
│   │       ├── EventManagement.tsx
│   │       ├── RegistrationReview.tsx
│   │       └── MatchManager.tsx
│   ├── styles/                   # Sistema de Design Tokens em Vanilla CSS
│   │   ├── variables.css         # Paleta Preto Profundo, Ouro Metálico, Tipografia
│   │   ├── animations.css        # Animações de transição, pulso, brilho dourado
│   │   ├── components.css        # Estilos atômicos compartilhados
│   │   └── global.css            # Reset, tipografia fluida mobile-first
│   ├── types/                    # Definições TypeScript geradas do Supabase
│   │   ├── database.types.ts
│   │   └── app.types.ts
│   ├── utils/                    # Funções utilitárias (formatação de peso, validações)
│   ├── App.tsx                   # Roteamento e Provedores globais
│   └── main.tsx                  # Ponto de entrada React com montagem do DOM
├── supabase/                     # Infraestrutura como código (IaC) do Supabase
│   ├── functions/                # Edge Functions (Deno)
│   │   └── auth-login/           # Resolução de login por Apelido
│   └── migrations/               # Scripts SQL versionados (Tabelas, RLS, Triggers)
│       └── 20261027000000_initial_schema.sql
├── index.html                    # HTML5 semântico com meta tags PWA
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Estratégia de Gerenciamento de Estado e Dados

Para manter o código compreensível, manutenível por desenvolvedores em qualquer nível de experiência e sem *boilerplate* desnecessário:
1. **Estado de Autenticação (`AuthContext`):**
   - Centraliza o estado do usuário logado, seu perfil (`profile`), privilégios administrativos e método de *logout*.
   - Escuta o evento `supabase.auth.onAuthStateChange` para persistência automática de sessão.
2. **Estado de Formulários e Fluxos Complexos:**
   - Formulário de Inscrição tratado em estado local com validações instantâneas (máscaras de peso decimal `00.00`, validação de unicidade de apelido via *debounced fetch*).
3. **Comunicação com o Banco (Data Fetching):**
   - Camada de serviços (`src/services/`) desacopla o React dos comandos diretos do Supabase.
   - Chamadas encapsuladas em blocos `try/catch` robustos, reportando erros anômalos diretamente ao Sentry e exibindo mensagens tratadas ao usuário.

---

## 5. Performance e Otimizações Mobile-First

1. **Compressão Prévia de Imagens no Cliente:**
   - No upload da foto do atleta, o navegador redimensiona a imagem para no máximo 800x800px e converte para `.webp` antes do envio. Isso reduz o tamanho de ~5MB para ~150KB, economizando 97% da largura de banda do plano gratuito do Supabase.
2. **Bundle Split e Code Splitting:**
   - Rotas administrativas pesadas (`/admin/*`) são carregadas sob demanda via `React.lazy()` e `Suspense`. O visitante comum no celular baixa apenas os scripts necessários para o convite e inscrição (~65KB comprimido).
3. **Design Fluido para Dispositivos Móveis:**
   - Uso de unidades relativas modernas (`dvh`, `rem`, `clamp()`) para garantir que o layout ocupe a altura visível real no iOS Safari e Android Chrome, desconsiderando a barra de navegação dinâmica do navegador.
4. **Resiliência Offline e PWA:**
   - Configuração de `manifest.json` com ícones oficiais e meta tags que permitem aos atletas instalar a U.C.U Arena como um aplicativo na tela inicial do smartphone.
