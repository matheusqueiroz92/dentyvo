# 010 — Assinatura e Pagamento (Gateway Nacional / PIX)

## Status
`aprovada`

## Contexto
A Dentyvo é um SaaS: acesso das clínicas às funcionalidades depende de uma
assinatura ativa. Diferente do M. Agendy (que usa Stripe), aqui o gateway deve
ser nacional, com suporte nativo a PIX, adequado à realidade de clínicas
pequenas/médias no Brasil. Gateway do MVP: **Asaas** (alternativas futuras:
Vindi, Iugu). A escolha de implementação fica isolada em
`src/core/assinatura/infra/adapters`; domínio e application permanecem
agnósticos ao provedor.

## User story
Como dono de clínica, quero assinar um plano da Dentyvo pagando via PIX ou
boleto, para ter acesso contínuo à plataforma, com meu acesso sendo bloqueado
automaticamente se eu ficar inadimplente e restaurado assim que eu regularizar
o pagamento.

## Decisões aprovadas (Planejador)

| # | Decisão | Valor |
|---|---|---|
| 1 | Duração do trial | **14 dias corridos** a partir de `IniciarTrial` |
| 2 | Tolerância pós-vencimento | **3 dias corridos** após `Cobranca.status = vencida`; só então a assinatura passa a `inadimplente` |
| 3 | Gateway MVP | Asaas; `AssinaturaGatewayPort` inclui `criarCliente` |
| 4 | Validação de webhook | Token em env (`ASAAS_WEBHOOK_TOKEN`); detalhe do header fica só no adapter Asaas |
| 5 | `VerificarAcessoAtivo` | Retorno estruturado; integração em outros módulos é etapa própria pós-010 |
| 6 | Leitura vs escrita | Call-site explícito: guard só em casos de uso de **escrita** operacional |
| 7 | Acesso manual | Opção A: `acessoManualAte` + `motivo`, sem sobrescrever status real de cobrança |
| 8 | Cartão | **Fora do MVP** (ver Fora de escopo) |
| 9 | Planos | Seed de 1–2 planos; **sem** enforcement de `limitesDeUso` no MVP |
| 10 | Gatilho do trial | Orquestração em `src/actions` após `CriarClinicaComAdmin` (fora dos módulos 001 e 010) |
| 11 | Ciclo | Apenas **mensal** no MVP |

## Critérios de aceite
- [ ] Ao criar a clínica (spec 001), a camada de delivery (`src/actions`) dispara
      `IniciarTrial(clinicaId)` imediatamente após `CriarClinicaComAdmin`
      concluir com sucesso, iniciando trial de **14 dias** sem pagamento
      imediato. Essa orquestração **não** vive em `core/auth` nem em
      `core/assinatura` — é responsabilidade de `src/actions`.
- [ ] Clínica escolhe um `Plano` e cria uma `Assinatura` no gateway com método
      `pix` ou `boleto` (ciclo mensal).
- [ ] Sistema recebe webhook do gateway a cada mudança de status de cobrança
      (`pendente` / `paga` / `vencida` / `estornada`) e atualiza
      `Cobranca`/`Assinatura` correspondente.
- [ ] Processamento de webhook é **idempotente por id do evento** (`evt_...` ou
      equivalente genérico mapeado pelo adapter): reentrega at-least-once do
      mesmo evento não altera estado duas vezes nem duplica efeitos.
- [ ] Assinatura com cobrança `vencida` sem pagamento após **3 dias** de
      tolerância muda para `inadimplente` e bloqueia escrita operacional da
      clínica (ver regra em `specs/02-domain-model.md`).
- [ ] Pagamento de cobrança em atraso restaura o acesso automaticamente
      (via webhook), sem intervenção manual.
- [ ] Painel da clínica mostra status da assinatura, próxima cobrança, e link
      para regularizar pagamento pendente.
- [ ] Super-admin (spec 009) consegue visualizar status de assinatura de
      qualquer clínica e, em caso excepcional, conceder acesso manual
      (`acessoManualAte` + motivo) sem depender do gateway e sem sobrescrever
      o status real de cobrança/`Assinatura`. Toda concessão gera auditoria via
      `AuditoriaLogPort` (spec 003).
- [ ] Seed de 1–2 `Plano`s disponíveis; `limitesDeUso` podem existir no modelo
      mas **não** são enforced no MVP.
- [ ] `VerificarAcessoAtivo(clinicaId)` retorna
      `{ permitido, motivo, ateData? }` com
      `motivo ∈ trialing | ativa | acesso_manual | inadimplente | cancelada | sem_assinatura`.

## Regras de negócio
- Bloqueio de acesso por inadimplência nunca apaga ou torna inacessível dado
  clínico já existente — apenas impede novas ações operacionais (nova
  marcação, nova evolução de prontuário, bot desativado). Ver regra em
  `specs/02-domain-model.md`.
- Leitura/exportação de dados existentes **não** passa pelo guard; apenas
  casos de uso de **escrita** operacional chamam `VerificarAcessoAtivo`
  (call-site explícito na etapa de integração pós-010).
- Todo processamento de webhook deve validar o segredo do webhook antes de
  processar (evitar liberar acesso por payload forjado). A forma concreta da
  validação (header, token, etc.) é responsabilidade do adapter do gateway.
- Entrega de webhook é at-least-once: processar o mesmo `eventoId` duas vezes
  deve ser no-op após o primeiro sucesso (idempotência).
- Mudança de status de `Assinatura`/`Cobranca` só acontece via evento do
  gateway (já traduzido para conceitos do domínio pelo adapter) ou ação
  explícita de super-admin — nunca inferida client-side.
- `ConcederAcessoManual` grava override (`acessoManualAte` + motivo) e **não**
  altera o status de cobrança/`Assinatura` vindos do gateway. Enquanto
  `acessoManualAte` for futuro, `VerificarAcessoAtivo` retorna
  `permitido: true` com `motivo: acesso_manual`.
- Ciclo de cobrança no MVP: apenas mensal.
- Métodos de pagamento no MVP: apenas `pix` e `boleto`.

## Modelo de domínio envolvido
`Assinatura`, `Plano`, `Cobranca`, `Clinica`.

Campos relevantes para esta feature (além do já definido em
`specs/02-domain-model.md`):
- `Assinatura.acessoManualAte` (nullable) e motivo da concessão manual.
- Persistência de id de cliente/assinatura/cobrança **no gateway** como
  referências opacas (`gatewayClienteId`, `gatewayAssinaturaId`,
  `gatewayCobrancaId`) — strings sem significado de domínio específico de
  provedor.
- Registro de eventos de webhook já processados (`eventoId`) para
  idempotência.

## Casos de uso (application layer)
- `IniciarTrial(clinicaId) → Assinatura`
- `CriarAssinatura(clinicaId, planoId, metodoPagamento) → Assinatura`
      (`metodoPagamento`: `pix` | `boleto`; chama o gateway via port genérica)
- `ProcessarWebhookPagamento(evento) → void`
      (recebe evento já no formato genérico da application — ou valida
      segredo + traduz no boundary do adapter antes de delegar; atualiza
      `Cobranca`/`Assinatura` com status do domínio; aplica regra de
      tolerância / restauração de acesso)
- `ConcederAcessoManual(clinicaId, motivo, ateData) → void`
      (super-admin; audita via `AuditoriaLogPort`)
- `VerificarAcessoAtivo(clinicaId) → ResultadoAcesso`
      onde `ResultadoAcesso = { permitido: boolean; motivo: ...; ateData?: Date }`

### Integração pendente (fora do escopo do Arquiteto/Implementador desta feature)
Aplicar o guard (`VerificarAcessoAtivo`) nos casos de uso de **escrita** dos
módulos `agendamento`, `prontuario` e `whatsapp-bot` fica para uma etapa
própria **após** a 010 estar implementada. Nesta feature, apenas a assinatura
e o retorno do caso de uso são definidos — nenhum outro módulo é modificado.

### Orquestração do trial (fora dos módulos de domínio)
Responsabilidade de `src/actions`: após `CriarClinicaComAdmin` (001) retornar
sucesso, chamar `IniciarTrial(clinicaId)`. Não alterar `core/auth` nem acoplar
`IniciarTrial` dentro do domínio da 001.

## Ports necessárias
- `AssinaturaGatewayPort`
  - `criarCliente(...)`
  - `criarAssinatura(...)` (ciclo mensal; métodos `pix` | `boleto`)
  - `cancelarAssinatura(...)`
  - `consultarCobranca(...)`
  - `listarCobrancasDaAssinatura(...)` (opcional mas previsto para painel/sync)
- `AssinaturaRepositoryPort`
- `CobrancaRepositoryPort`
- Reuso: `AuditoriaLogPort` (003) em `ConcederAcessoManual`

### Portabilidade de gateway (obrigatório)
Todo detalhe específico do Asaas — nomes de endpoint (`/v3/customers`,
`/v3/subscriptions`, `/v3/payments/...`), formato de payload, nomes de
eventos (`PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`,
`PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`), mecanismo de validação via header
`asaas-access-token` — fica **isolado** em
`src/core/assinatura/infra/adapters` (ex.: `AsaasGatewayAdapter`,
`AsaasWebhookAdapter`).

A camada `application/` (use cases e ports) conhece apenas conceitos
genéricos do domain model:
- `Cobranca.status`: `pendente` | `paga` | `vencida` | `estornada`
- `Cobranca.metodo`: `pix` | `boleto` | `cartao` (este último reservado no
  modelo; não aceito no MVP de `CriarAssinatura`)
- ids de gateway como strings opacas

`AssinaturaGatewayPort` deve ser desenhada como se qualquer gateway PIX
brasileiro (Asaas, Vindi, Iugu etc.) pudesse implementá-la. Tradução de
eventos/payloads do provedor → domínio ocorre **dentro do adapter**, nunca em
`application/`.

#### Referência de implementação Asaas (somente infra — não vaza para ports)
| Método da port | Endpoint Asaas (adapter) |
|---|---|
| `criarCliente` | `POST /v3/customers` |
| `criarAssinatura` | `POST /v3/subscriptions` (`billingType` PIX/BOLETO, `cycle` MONTHLY) |
| `listarCobrancasDaAssinatura` | `GET /v3/subscriptions/{id}/payments` |
| `consultarCobranca` | `GET /v3/payments/{id}` |
| `cancelarAssinatura` | `DELETE /v3/subscriptions/{id}` |
| Validação webhook | header `asaas-access-token` === `ASAAS_WEBHOOK_TOKEN` |

## Contrato de API / Server Action
- `POST /api/webhooks/pagamento` — boundary HTTP; o adapter Asaas valida o
  token do header, traduz o payload para o evento genérico da application e
  delega a `ProcessarWebhookPagamento`.
- Server actions do painel da clínica: criar assinatura, consultar status /
  próxima cobrança / link de regularização.
- Server action / fluxo admin (009): `ConcederAcessoManual`.
- Orquestração pós-cadastro em `src/actions`: `CriarClinicaComAdmin` →
  `IniciarTrial` (ver acima).

## Precificação e promoção de lançamento

> Registro de intenção de produto. **Não implementar nesta feature** — a
> promoção (contador de vagas + prazo de 12 meses por cliente) ainda **não tem
> spec própria com critérios de aceite completos**. Precisa passar pelo ciclo
> completo (Planejador → Arquiteto → Testes → Implementador) antes de
> implementar, provavelmente como sub-feature desta 010 ou spec própria
> numerada (ex.: 012). O **aviso** de aumento de preço depende também da
> feature **011** (módulo central de notificações).

### Faixas de plano (valores finais a confirmar antes do lançamento)

| Plano | Faixa mensal | Observação |
|---|---|---|
| Básico | R$ 79–99/mês | — |
| Médio | R$ 149–179/mês | Inclui bot de WhatsApp |
| Full | R$ 249–299/mês | — |

### Promoção de lançamento (30 primeiros clientes)

- Os **30 primeiros clientes** pagam: Básico **R$ 59/mês** e Médio **R$ 99/mês**
  durante **12 meses corridos** a partir da assinatura.
- Após os 12 meses, migra **automaticamente** para o preço cheio do plano
  escolhido.
- O cliente deve ser **avisado com antecedência** (ex.: 30 dias) antes da
  migração de preço — não basta cobrar silenciosamente o valor cheio na
  renovação.
- Esse aviso **deve** usar `EnviarNotificacao` do módulo **011**
  (`core/notificacao`), tipo `aviso_aumento_preco`, com canais **e-mail** e
  **in-app** (painel). Não criar canal ad hoc de e-mail só para promoção.

### Dependência desta parte da 010

| Parte | Depende de |
|---|---|
| Contador de vagas + preço promocional 12 meses | Sub-feature / spec própria (ex.: 012) — ciclo SDD completo |
| Aviso pré-migração de preço | **011 — Notificações** (`EnviarNotificacao`, canais e-mail + in-app) |

### DECISÃO PENDENTE DE ARQUITETURA (não implementar ainda)

O contador de "vagas restantes da promoção" tem o **mesmo risco de condição de
corrida** resolvido com constraint de banco na feature 002 (dois cadastros
simultâneos podem achar que pegaram a mesma vaga 30).

Quando essa funcionalidade for implementada, o **Arquiteto de Domínio** deve
tratar a contagem/reserva de vaga promocional como **invariante de negócio
protegida por constraint de banco**, não só checagem em memória. Esta nota
não autoriza implementação nesta etapa de documentação nem na implementação
atual da 010.

## Fora de escopo
- **Cartão de crédito/débito no lançamento inicial.** Explicitamente fora do
  MVP: cartão exige tokenização no cliente + tratamento de `remoteIp` e
  trabalho real de conformidade de segurança. O motivador do gateway nacional
  foi o PIX; cartão fica como **próxima iteração** após o modelo básico
  (PIX/boleto + trial + webhook + bloqueio) estar validado. O valor
  `cartao` permanece no domain model/`Cobranca.metodo` para não forçar
  migração depois, mas `CriarAssinatura` do MVP rejeita esse método.
- Split de pagamento entre múltiplos recebedores (não se aplica — Dentyvo
  recebe diretamente da clínica, sem repasse a terceiros).
- Upgrade/downgrade de plano com cobrança proporcional (proration) — MVP pode
  tratar troca de plano como efetiva só na próxima renovação.
- Enforcement de `limitesDeUso` do `Plano` (nº de profissionais, mensagens do
  bot/mês, etc.).
- Ciclos diferentes de mensal (semanal, anual, etc.).
- PIX Automático (débito recorrente direto em conta) como modalidade
  separada — avaliar depois; adoção é decisão de produto, não reescrita
  técnica da port.
- Aplicar o guard `VerificarAcessoAtivo` dentro dos módulos `agendamento`,
  `prontuario` e `whatsapp-bot` (etapa de integração pós-010).
- **Promoção de lançamento** (contador de 30 vagas, preço promocional por 12
  meses, aviso pré-migração via 011) — fora do escopo desta 010 até existir
  spec própria/sub-feature com critérios de aceite e ciclo SDD completo, e
  até a **011** estar disponível para o canal `EnviarNotificacao`.

## Plano de testes
- Domínio: transição de estado de `Assinatura` (trialing → ativa →
  inadimplente → ativa) e regra dos 3 dias de tolerância após cobrança
  vencida; trial expira em 14 dias sem pagamento.
- Domínio: `acessoManualAte` vigente concede acesso sem alterar status de
  cobrança; expirado deixa de conceder.
- Aplicação: `ProcessarWebhookPagamento` com segredo/token inválido é
  rejeitado e não altera nenhum estado.
- Aplicação: reprocessar o **mesmo** `eventoId` duas vezes é idempotente
  (segunda chamada não duplica efeitos / não quebra estado).
- Aplicação: `VerificarAcessoAtivo` retorna `permitido: false` /
  `motivo: inadimplente` além da tolerância; `permitido: true` /
  `motivo: trialing` durante trial; `motivo: acesso_manual` com override
  vigente.
- Aplicação: `CriarAssinatura` com método `cartao` é rejeitado no MVP.
- Integração (adapter Asaas): mapeamento correto de eventos do provedor →
  status do domínio; validação do header de autenticação do webhook.
- Contrato/e2e (quando a etapa de integração pós-010 existir): bloqueio não
  impede leitura/exportação; impede apenas escritas operacionais.

## Dependências
001 (auth multi-tenant / `CriarClinicaComAdmin`), 009 (super-admin, para
concessão manual), 003 (`AuditoriaLogPort`). Schema novo, se necessário, em
`db/schema/assinatura.ts` (não editar `db/schema/index.ts` nesta feature).
