# U.C.U ARENA — Política de Privacidade e Termos de Consentimento

**Versão:** 1.0.0 (Versão de Revisão Operacional)  
**Data:** 28 de Outubro de 2026  
**Status:** Vigente e Aplicada em Todas as Inscrições  
**Marco Legal:** Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e Estatuto da Criança e do Adolescente (ECA — Lei nº 8.069/1990).

---

## 1. Compromisso Fundamental de Privacidade

A **U.C.U Arena** coleta e trata apenas os dados estritamente necessários para a organização técnica, médica e regulamentar de campeonatos esportivos de combate, assegurando:
* **Princípio da Minimização:** Coletamos apenas o que é essencial para identificar o atleta, alocá-lo na categoria correta de peso e contatar seu responsável legal caso seja menor de idade.
* **Privacidade por Padrão (*Privacy by Design*):** O e-mail de recuperação nunca é público nem compartilhado com outros competidores.
* **Segurança na Identificação:** Os atletas acessam a plataforma exclusivamente com seu **Apelido e Senha**, evitando exposição pública de dados civis sensíveis.

---

## 2. Dados Coletados e Sua Finalidade

| Dado Coletado | Finalidade Específica | Visibilidade |
| :--- | :--- | :--- |
| **Nome Completo** | Identificação civil oficial, confecção de certificados e seguro do evento. | Confidencial (Apenas Atleta e Administrador Principal). |
| **Apelido de Combate** | Identificação pública nas chaves de luta, cards, transmissões e placar ao vivo. | **Público** nas chaves e cards do campeonato. |
| **Data de Nascimento** | Verificação de elegibilidade etária e enquadramento de proteção a menores. | Confidencial (Apenas cálculo de idade no sistema). |
| **Peso Declarado e Verificado** | Alocação esportiva justa na categoria de peso correspondente (50 a 90 kg). | **Público** (apenas categoria e peso oficial aferido na balança). |
| **Foto de Rosto / Avatar** | Identificação visual rápida pela arbitragem e exibição nos cards de luta. | **Público** (armazenada de forma otimizada em formato WebP). |
| **E-mail de Recuperação** | Recuperação segura de senha e comunicados de emergência. | **Estritamente Confidencial** (Zero exposição pública). |
| **Telefone de Contato** | Comunicações urgentes da organização sobre pesagem e cronograma. | Confidencial (Apenas Atleta e Administrador Principal). |

---

## 3. Proteção Especial a Atletas Menores de 18 Anos (Conformidade com o ECA)

Atletas com idade inferior a 18 anos na data do evento possuem salvaguardas adicionais obrigatórias:
1. **Consentimento Específico e em Destaque:** O cadastro de menores é sumariamente bloqueado se os campos do responsável legal não forem preenchidos e validados.
2. **Dados do Responsável Legal:**
   * Nome completo do responsável;
   * Grau de parentesco/vínculo legal;
   * Telefone direto do responsável;
   * Número do documento de identificação (RG/CPF) do responsável.
3. **Confidencialidade Rigorosa:** Os dados de contato e documentos de responsáveis legais são protegidos por Row Level Security (RLS) no PostgreSQL e jamais são renderizados em nenhuma tela pública, card ou relatório externo.

---

## 4. Termo de Cessão de Uso de Imagem e Voz

Ao marcar a caixa de consentimento de imagem no ato da inscrição, o participante (e seu responsável legal, quando menor) concorda formalmente que:
* A organização da **U.C.U Arena** possui autorização expressa e não onerosa para capturar, gravar, fotografar e divulgar imagens e vídeos dos combates, pesagem oficial e cerimônias de premiação.
* O material capturado poderá ser veiculado nos canais oficiais do evento (YouTube, Instagram, portal web e materiais promocionais de futuras edições da U.C.U Arena).
* O atleta ou responsável pode solicitar a retirada ou desindexação de fotos específicas de destaque mediante requerimento formal fundamentado à administração da organização.

---

## 5. Armazenamento, Segurança e Retenção dos Dados

* **Criptografia:** Todos os dados em trânsito são transmitidos exclusivamente via HTTPS com TLS 1.3. As senhas de acesso são transformadas em hashes criptográficos pelo Supabase Auth.
* **Isolamento de Banco:** As tabelas do banco contam com políticas ativas de Row Level Security (RLS), impedindo que qualquer usuário autenticado consiga consultar perfis privados de terceiros.
* **Retenção e Descarte:** Os dados de contato de atletas não aprovados ou cancelados podem ser expurgados definitivamente a qualquer momento mediante solicitação ao Administrador Principal. O histórico de resultados esportivos oficiais (vencedores, nocautes e títulos) é mantido para fins de registro histórico esportivo.

---

## 6. Canal de Contato com o Encarregado de Dados (DPO)

Para exercer seus direitos de confirmação de tratamento, acesso, correção ou eliminação de dados pessoais nos termos da LGPD, o atleta ou responsável legal pode contatar diretamente a organização através do canal oficial:
* **Canal Oficial:** Suporte Administrativo U.C.U Arena
* **E-mail / WhatsApp:** Disponibilizado no rodapé do convite e nas configurações do evento.
