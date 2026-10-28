# U.C.U ARENA — Procedimento de Exportação e Recuperação de Desastres (Backup & Restore)

**Versão:** 1.0.0  
**Data:** 28 de Outubro de 2026  
**Finalidade:** Guia operacional para exportação de participantes, backup completo do histórico esportivo com checksum criptográfico e plano de recuperação de desastres.

---

## 1. Visão Geral da Estratégia de Backup

A integridade dos dados esportivos da **U.C.U Arena** é garantida por dois mecanismos complementares:

1. **Backups Automáticos do Provedor (Supabase Managed):** O Supabase realiza backups diários automatizados do banco de dados PostgreSQL com retenção de 7 dias no plano gratuito.
2. **Exportação Administrativa Local (Self-Service do Admin):** Diretamente pelo painel `/admin`, o Administrador Principal pode gerar a qualquer momento:
   * **Planilha CSV de Participantes:** Formato tabular compatível com Excel e Google Sheets contendo nome completo, apelido, peso declarado, peso verificado, categoria alocada, idade e dados do responsável.
   * **Pacote JSON de Backup Completo:** Estrutura JSON com esquema versionado (`1.0.0`) contendo evento, categorias, inscrições, confrontos com resultados e trilha de auditoria, assinado com checksum SHA para prevenção de adulterações.

---

## 2. Exportação de Dados pelo Painel Administrativo

### 2.1. Exportação da Lista de Participantes (CSV)
1. Acesse o painel administrativo em `/admin` e selecione a aba **Inscrições & Pesagem**.
2. Clique no botão **"Exportar Participantes (CSV)"**.
3. O navegador fará o download instantâneo do arquivo nomeado:
   ```
   participantes-[slug-do-evento]-[data-iso].csv
   ```
4. Formato e colunas do arquivo gerado:
   * `ID da Inscrição`
   * `Nome Completo`
   * `Apelido de Combate`
   * `Categoria de Peso`
   * `Peso Declarado (kg)`
   * `Peso Verificado (kg)`
   * `Status da Inscrição`
   * `Menor de Idade (Sim/Não)`
   * `Nome do Responsável Legal`
   * `Telefone do Responsável`
   * `Termos Aceitos`
   * `Data do Cadastro`

---

### 2.2. Exportação do Pacote de Backup Completo (JSON Versionado)
1. No painel administrativo em `/admin`, selecione a aba **Mídia & Auditoria** ou acesse as configurações do evento.
2. Clique no botão **"Exportar Backup Completo (JSON)"**.
3. O sistema gerará o arquivo estruturado:
   ```json
   {
     "schemaVersion": "1.0.0",
     "exportedAt": "2026-10-28T16:30:00.000Z",
     "eventId": "e100-inaugural-ucu-arena",
     "checksum": "sha256:4a8b...",
     "data": {
       "event": { ... },
       "categories": [ ... ],
       "registrations": [ ... ],
       "matches": [ ... ],
       "announcements": [ ... ],
       "mediaItems": [ ... ],
       "auditLogs": [ ... ]
     }
   }
   ```
4. Salve este arquivo em um local seguro (drive externo ou armazenamento em nuvem com criptografia).

---

## 3. Procedimento de Restauração em Caso de Desastre (Disaster Recovery)

Se a base de dados sofrer corrupção acidental ou deleção não intencional:

### Cenário 1: Restauração Via Ponto de Restauração Supabase
1. Acesse o Supabase Dashboard -> **Project Settings** -> **Backups**.
2. Localize o snapshot diário mais recente antes do incidente.
3. Clique em **Restore** e confirme. O banco de dados retornará ao estado exato da data/hora selecionada.

### Cenário 2: Reconstrução Limpa a Partir do Pacote JSON de Backup
1. Caso seja necessário recriar o evento em uma nova instância do Supabase:
2. Execute as 3 migrações SQL padrão ([`supabase/migrations/`](../../supabase/migrations/)).
3. Crie o Administrador Principal seguindo o guia de provisionamento ([`docs/security/ADMIN_PROVISIONING.md`](../security/ADMIN_PROVISIONING.md)).
4. Carregue o arquivo de backup JSON: as rotas de importação do serviço `adminService` leem a carga estruturada, validam o checksum e recriam o evento com todos os confrontos, atletas e histórico original.

---

## 4. Frequência Recomendada de Exportação

| Momento Operacional | Tipo de Exportação Recomendada |
| :--- | :--- |
| **Encerramento das Inscrições** | Exportação CSV + Backup JSON |
| **Após a Pesagem Oficial Presencial** | Exportação CSV com Pesos Verificados |
| **Após o Término dos Combates** | Backup JSON Completo com todos os Resultados e Vídeos |
| **Antes de Qualquer Alteração de Categorias** | Backup JSON Preventivo |
