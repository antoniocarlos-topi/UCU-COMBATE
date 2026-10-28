# Regras do Projeto — U.C.U Arena

Este documento define as regras operacionais, de design, arquitetura e qualidade que regem todo o desenvolvimento da plataforma **U.C.U Arena**. Estas regras devem ser mantidas em mente e aplicadas em todas as tarefas.

---

## 1. Princípios Fundamentais do Desenvolvedor (MANDATÓRIOS)

1. **Liberdade Criativa Total:** Você tem total liberdade criativa para mudar e alterar o que quiser para elevar a qualidade do sistema ao mais alto nível.
2. **Comunicação Ativa e Proativa:** Você tem total liberdade para perguntar e pedir qualquer definição ou ajuste que ajude a melhorar o produto.
3. **Busca Pelo Melhor Caminho:** A cada ação, analise criticamente se a forma planejada é a melhor maneira possível e escolha sempre o método de maior excelência técnica e visual.
4. **Resolução de Causa Raiz e Prevenção:** Em toda funcionalidade ou correção, analise se é plenamente funcional, investigue se há riscos de bugs ou atritos, entenda a causa raiz de qualquer falha e garanta que ela não volte a ocorrer.
5. **Cobertura Completa de Variáveis:** Ao criar ou modificar funções, mapeie todos os possíveis cenários e variáveis de entrada (valores nulos, extremos, tipos divergentes) para garantir robustez inabalável.
6. **Organização e Estrutura Exemplar:** Configure, estruture e organize o código, pastas e componentes da forma mais limpa, legível e escalável possível.
7. **Entrega Impecável e Surpreendente:** Desenvolva tudo de maneira esmerada e surpreendente. Fuja de soluções simples ou rascunhos rasos; entregue impacto profissional.
8. **Estética Viva, Rica e Fluida:** Mantenha a interface sempre bela, intuitiva e cheia de vida, com micro-interações elegantes, transições suaves, estados de carregamento impecáveis e um visual de encher os olhos.

---

## 2. Padrões de Design e UX Mobile-First

- **Mobile-First Inegociável:** Cada tela e componente deve ser projetado prioritariamente para telas de smartphones (360px a 430px de largura), adaptando-se com elegância a tablets e desktops.
- **Identidade Visual:**
  - Fundo principal: Preto Profundo e Grafite Ônix (`#0a0a0c`, `#121215`, `#1a1a20`).
  - Destaques principais: Ouro Metálico (`#d4af37`, `#f3e5ab`, `#996515`, com gradientes lineares dourados).
  - Acentos controlados: Branco Puro (`#ffffff`) para leitura clara e Vermelho de Combate (`#e63946`) usado com moderação em cantos de luta, alertas ou nocautes.
- **Micro-interações:**
  - Botões devem possuir resposta tátil/visual imediata (`active:scale(0.98)`, brilho sutil ao toque).
  - Cards e listas com animações de entrada escalonadas (*staggered fade-in*).
  - Zero telas estáticas ou mortas; forneça esqueletos dourados pulsantes durante requisições.

---

## 3. Segurança e Integridade Arquitetural

- **Zero Trust Client:** Nunca confie em regras aplicadas apenas no React/Navegador. Toda restrição de negócio (pesagem, aprovação, chaveamento) deve ser validada por Row Level Security (RLS) e Constraints no PostgreSQL.
- **Segredos Protegidos:** A chave `SUPABASE_SERVICE_ROLE_KEY` jamais pode entrar no repositório ou no bundle do frontend.
- **Login por Apelido:** O acesso dos atletas é feito via Apelido e Senha. O e-mail de recuperação é mantido confidencial e nunca é exposto em telas públicas ou cards de atletas.
- **Proteção a Menores (LGPD):** Nenhum menor de 18 anos pode ser cadastrado sem nome, documento e telefone do responsável legal devidamente registrados e consentimento formal arquivado.
- **Multi-Evento Sob Gestão Única:** A aplicação gerencia múltiplos eventos independentes, mas mantém exatamente uma conta de Administrador Principal para a organização nesta versão.
