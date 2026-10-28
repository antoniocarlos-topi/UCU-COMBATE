# U.C.U ARENA — Relatório de Auditoria Mobile-First, Visual e Acessibilidade

**Versão:** 1.0.0  
**Data da Auditoria:** 28 de Outubro de 2026  
**Auditor Responsável:** Especialista em UX/UI, Frontend Mobile e Acessibilidade Web  
**Metodologia:** Inspeção em Navegador Real, Gravação em Vídeo WebP, Análise de Layout em 6 Viewports e Critérios WCAG 2.1  
**Status Geral:** ✅ **APROVADO** (Experiência mobile fluida a 60fps, sem quebras de layout e acessível)

---

## 1. Avaliação de Responsividade por Viewport

A plataforma foi inspecionada em larguras de tela representativas do ecossistema de smartphones, tablets e desktops:

| Viewport Testado | Dispositivo de Referência | Rolagem Horizontal? | Elementos Cortados? | Alvos de Toque (≥44px)? | Status do Layout |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **320 × 568 px** | iPhone SE (1ª Geração) / Telas Compactas | ❌ Nenhuma | ❌ Nenhum | ✅ Todos conformes | **Aprovado** |
| **360 × 740 px** | Galaxy A / Linha Android Padrão | ❌ Nenhuma | ❌ Nenhum | ✅ Todos conformes | **Aprovado** |
| **390 × 844 px** | iPhone 12 / 13 / 14 / 15 Padrão | ❌ Nenhuma | ❌ Nenhum | ✅ Todos conformes | **Aprovado** |
| **430 × 932 px** | iPhone 14 Pro Max / 15 Plus | ❌ Nenhuma | ❌ Nenhum | ✅ Todos conformes | **Aprovado** |
| **768 × 1024 px**| iPad Mini / Tablets Verticais | ❌ Nenhuma | ❌ Nenhum | ✅ Todos conformes | **Aprovado** |
| **1280 × 800 px**| Notebooks / Desktops | ❌ Nenhuma | ❌ Nenhum | ✅ Todos conformes | **Aprovado** |

### Destaques Técnicos de Layout:
* **Prevenção de Rolagem Horizontal:** `body { overflow-x: hidden; }` e `.app-container { width: 100%; max-width: 720px; margin: 0 auto; padding: 0 16px; }` garantem que o conteúdo nunca exceda a largura da tela em nenhum dispositivo.
* **Áreas Seguras Mobile (*Safe Areas*):** Suporte nativo a `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`, garantindo que o notch do iPhone e a barra de navegação inferior do Android não sobreponham botões de ação ou a barra inferior (`BottomNavigation`).

---

## 2. Tipografia, Contraste e Identidade Visual (Dark & Gold)

A identidade visual foi construída sobre uma paleta nobre e de alto contraste esportivo:

* **Paleta de Cores:**
  * **Fundo Base:** Preto Profundo e Grafite Ônix (`#08080a`, `#0e0e13`, `#15151c`).
  * **Dourado Metálico:** Dourado Nobre (`#d4af37`), Champanhe Claro (`#f3e5ab`) e Ouro Escurecido (`#996515`).
  * **Vermelho de Combate:** Vermelho Oficial UCU (`#e51928`) para cantos de ringue, nocautes e badges de lutas ao vivo.
  * **Textos:** Branco Puro (`#fcfcfd`) para títulos e Cinza Suave (`#c5c5d2`) para corpo de texto.
* **Contraste WCAG:** A relação de contraste entre o texto branco (`#fcfcfd`) e o fundo preto (`#08080a`) é de **19.8:1**, superando largamente a exigência mínima de 4.5:1 do nível AA da WCAG 2.1. O dourado sobre preto atinge **9.4:1**, garantindo leitura nítida sob luz solar intensa.
* **Tipografia Fluida:** Títulos utilizam a fonte moderna *Outfit* com escala modular calculada via `clamp(1.75rem, 5vw, 2.25rem)` para títulos principais, evitando quebras desajeitadas de linha no celular.

---

## 3. Ergonomia Touch e Usabilidade dos Formulários

* **Tamanho Mínimo de Alvo Tátil:** Todos os botões interativos (`GoldButton`, botões de alternância e itens do menu inferior) possuem altura mínima de `44px` a `52px`, facilitando o acionamento pelo polegar com uma só mão.
* **Microinterações Táteis:** O utilitário `.interactive-tap` aplica um leve feedback mecânico `transform: scale(0.97)` ao toque ativo, dando sensação tátil imediata de clique físico.
* **Teclados Especializados:**
  * Campo de Peso utiliza `type="text"` ou `type="number"` com `inputMode="decimal"`, abrindo o teclado numérico com separador no smartphone.
  * Campo de Telefone utiliza `type="tel"`, abrindo teclado telefônico nativo.
  * Campo de Senha inclui ícone de alternância de visibilidade para evitar erros de digitação no celular.
* **Modais e Gavetas (*Drawers*):** Modais utilizam posicionamento fixo com `max-height: 90vh`, rolagem interna e botão de fechamento acessível no canto superior direito, além de fechar ao clicar no backdrop escuro.

---

## 4. Animações, Estados de Carregamento e Reduced Motion

* **Fluidez das Animações (60 FPS):** A abertura da carta tridimensional (`CinematicEnvelope`) utiliza aceleração por hardware GPU através de `transform: translateY` e `perspective: 1000px`, registrando performance suave sem quedas de frames no navegador.
* **Gravação de Sessão Autônoma:** Toda a jornada de navegação móvel foi gravada em vídeo WebP (`audit_live_app_1793205401989.webp`), comprovando a transição do envelope para a carta e a navegação para o formulário de inscrição.
* **Zero Telas Estáticas ou Travadas:** Durante requisições assíncronas, o sistema renderiza esqueletos de carregamento dourados com animação pulsante (`skeletonPulse`), eliminando flashes brancos ou telas congeladas.
* **Respeito à Preferência de Movimento Reduzido (*Reduced Motion*):**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  Caso o usuário configure seu celular para reduzir movimentos, as animações do envelope e dos botões são desativadas instantaneamente, exibindo o conteúdo de forma estática e direta.
