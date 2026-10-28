# 🥊 U.C.U ARENA — Plataforma Oficial de Eventos e Campeonatos de Combate

Plataforma web progressiva e responsiva (*mobile-first*) concebida para gerenciamento completo de eventos esportivos de luta: convites interativos com carta 3D, inscrições online com pesagem rigorosa e compressão WebP, autenticação por apelido único (sem vazamento de e-mails), chaveamento mata-mata, moderação administrativa com pesagem oficial e controle de combates ao vivo.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | React 18, TypeScript (Strict Mode), Vite 6 |
| **Roteamento** | React Router DOM v6 (SPA com suporte a rotas públicas, restritas e admin) |
| **Estilização** | Vanilla CSS com Design System de tokens (`variables.css`, `animations.css`, `global.css`) |
| **Ícones** | Lucide React |
| **Backend / DB** | Supabase (PostgreSQL 15+, Row Level Security, Auth, Storage) |
| **Hospedagem** | Cloudflare Pages (distribuição global edge, CDN, custo zero) |
| **Testes** | Vitest (46/46 testes automatizados cobrindo segurança, regras de negócio e limites de pesagem) |

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
* Node.js v18 ou superior instalado
* npm v9 ou superior

### 1. Clonar e Instalar Dependências
```bash
git clone <URL_DO_REPOSITORIO>
cd "Projeto 100futuro"
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Preencha com as suas credenciais públicas do Supabase:
```env
VITE_SUPABASE_URL=https://sua-instancia.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```
> ⚠️ **Atenção:** Nunca insira a chave `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env` do frontend. Esta chave tem privilégios totais e só deve ser usada em ambientes protegidos de servidor/Edge Functions.

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
O Vite iniciará o servidor local em: `http://localhost:5173`.

---

## 🧪 Comandos de Testes e Qualidade

| Comando | Descrição |
| :--- | :--- |
| `npm run typecheck` | Executa a verificação estrita de tipos TypeScript (`tsc --noEmit`) |
| `npm test` | Executa toda a bateria de testes automatizados com o Vitest |
| `npm run build` | Compila o bundle otimizado para produção na pasta `/dist` |
| `npm run preview` | Executa localmente o bundle compilado de produção |

---

## 🔒 Princípios de Segurança e Privacidade

1. **Zero Trust Client:** Toda regra de negócio (faixa de peso 50–90 kg, autorização de menores, moderação de inscrição) é validada e garantida tanto no frontend quanto nas políticas RLS do PostgreSQL.
2. **Login por Apelido:** Atletas autenticam-se com seu Apelido e Senha. O e-mail de recuperação é estritamente confidencial e nunca é exposto nas listagens públicas.
3. **Proteção a Menores (ECA / LGPD):** Inscrições de menores de 18 anos exigem consentimento formal e dados do responsável legal (nome, telefone e documento).
4. **Armazenamento Seguro:** As fotos enviadas são compactadas e convertidas no cliente para WebP (< 150KB) e armazenadas no bucket `avatars` com validação de tipo MIME e tamanho.

---

## 📂 Estrutura de Diretórios

```plaintext
├── docs/                   # Documentação arquitetural, segurança e deploy
│   ├── architecture/       # PRD, Modelagem de dados e arquitetura
│   ├── deployment/         # Guias de deploy (Supabase, Cloudflare Pages, Backup)
│   ├── implementation/     # Relatórios de fases e FINAL-AUDIT.md
│   └── security/           # Políticas de privacidade e provisionamento admin
├── public/                 # Assets públicos estáticos e arquivo _redirects
├── src/
│   ├── components/         # Componentes React (admin, atleta, convite, layout, common)
│   ├── contexts/           # Provedores de contexto (AuthContext, ToastContext)
│   ├── lib/                # Configuração do cliente Supabase
│   ├── pages/              # Páginas públicas, atleta, admin e feedback
│   ├── services/           # Motores de regra de negócio (adminService, bracketEngine, etc.)
│   ├── styles/             # Design System (tokens, animações, reset global)
│   ├── types/              # Definições centrais TypeScript (app.types.ts)
│   └── utils/              # Funções utilitárias (validações e compressão de imagens)
├── supabase/               # Migrações SQL e Edge Functions
└── tests/                  # Bateria de testes automatizados Vitest
```

---

## 📄 Licença
U.C.U Arena © 2026. Todos os direitos reservados.
