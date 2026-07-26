# 010 — Assinatura e Pagamento (Gateway Nacional / PIX)

## Status
`rascunho`

## Contexto
A Dentyvo é um SaaS: acesso das clínicas às funcionalidades depende de uma
assinatura ativa. Diferente do M. Agendy (que usa Stripe), aqui o gateway deve
ser nacional, com suporte nativo a PIX, adequado à realidade de clínicas
pequenas/médias no Brasil. Gateway sugerido: **Asaas** (alternativa avaliada:
Vindi) — ambos com API de assinatura recorrente, PIX, boleto, cartão e webhooks
de status de pagamento.

## User story
Como dono de clínica, quero assinar um plano da Dentyvo pagando via PIX, boleto
ou cartão, para ter acesso contínuo à plataforma, com meu acesso sendo
bloqueado automaticamente se eu ficar inadimplente e restaurado assim que eu
regularizar o pagamento.

## Critérios de aceite
- [ ] Ao criar a clínica (spec 001), é possível iniciar um período de trial
      (a definir duração) sem necessidade de pagamento imediato.
- [ ] Clínica escolhe um `Plano` e cria uma `Assinatura` no gateway (PIX,
      boleto ou cartão como forma de pagamento).
- [ ] Sistema recebe webhook do gateway a cada mudança de status de cobrança
      (paga, vencida, estornada) e atualiza `Cobranca`/`Assinatura`
      correspondente.
- [ ] Assinatura com cobrança vencida sem pagamento após prazo de tolerância
      (a definir, ex: 3 dias) muda para `inadimplente` e bloqueia acesso
      operacional da clínica (ver regra de negócio da spec 002-domain-model).
- [ ] Pagamento de cobrança em atraso restaura o acesso automaticamente
      (via webhook), sem intervenção manual.
- [ ] Painel da clínica mostra status da assinatura, próxima cobrança, e link
      para regularizar pagamento pendente.
- [ ] Super-admin (spec 009) consegue visualizar status de assinatura de
      qualquer clínica e, em caso excepcional, conceder acesso manual
      (ex: cortesia, período de negociação) sem depender do gateway.

## Regras de negócio
- Bloqueio de acesso por inadimplência nunca apaga ou torna inacessível dado
  clínico já existente — apenas impede novas ações operacionais (nova
  marcação, nova evolução de prontuário, bot desativado). Ver regra em
  `specs/02-domain-model.md`.
- Todo processamento de webhook do gateway deve validar a assinatura/segredo
  do webhook antes de processar (evitar liberar acesso por payload forjado).
- Mudança de status de `Assinatura`/`Cobranca` só acontece via evento do
  gateway (webhook) ou ação explícita de super-admin — nunca inferida
  client-side.

## Modelo de domínio envolvido
`Assinatura`, `Plano`, `Cobranca`, `Clinica`.

## Casos de uso (application layer)
- `IniciarTrial(clinicaId) → Assinatura`
- `CriarAssinatura(clinicaId, planoId, metodoPagamento) → Assinatura`
      (chama o gateway, cria a assinatura recorrente)
- `ProcessarWebhookPagamento(payload) → void`
      (valida assinatura do webhook, atualiza `Cobranca`/`Assinatura`, dispara
      bloqueio/liberação de acesso conforme o novo status)
- `ConcederAcessoManual(clinicaId, motivo, ateData?) → void` (uso do super-admin)
- `VerificarAcessoAtivo(clinicaId) → boolean` (usado por middleware/guard nas
  rotas operacionais)

## Ports necessárias
- `AssinaturaGatewayPort` (criarAssinatura, cancelarAssinatura, consultarCobranca)
- `AssinaturaRepositoryPort`
- `CobrancaRepositoryPort`

## Contrato de API
- `POST /api/webhooks/pagamento` — recebido do gateway (Asaas ou equivalente),
  valida assinatura do payload, delega a `ProcessarWebhookPagamento`.
- Middleware/guard aplicado às rotas operacionais (`agendamento`, `prontuario`,
  `whatsapp-bot`) chamando `VerificarAcessoAtivo` antes de liberar a ação.

## Fora de escopo
- Split de pagamento entre múltiplos recebedores (não se aplica — Dentyvo
  recebe diretamente da clínica, sem repasse a terceiros).
- Upgrade/downgrade de plano com cobrança proporcional (proration) — MVP pode
  tratar troca de plano como efetiva só na próxima renovação.
- PIX Automático (débito recorrente direto em conta, sem cartão) como
  modalidade separada — avaliar como alternativa/complemento ao PIX comum
  quando o volume justificar; o gateway escolhido já suporta ambos, então a
  adoção é principalmente uma decisão de produto, não uma reescrita técnica.

## Plano de testes
- Domínio: transição de estado de `Assinatura` (trialing → ativa → inadimplente
  → ativa) segue exatamente as regras definidas, sem estados intermediários
  inválidos.
- Aplicação: `ProcessarWebhookPagamento` com assinatura de payload inválida é
  rejeitado e não altera nenhum estado.
- Aplicação: `VerificarAcessoAtivo` retorna `false` para clínica inadimplente
  além do prazo de tolerância, e `true` durante trial.
- Integração: bloqueio de acesso não impede leitura/exportação de dados já
  existentes (checar explicitamente que não é um bloqueio total).

## Dependências
001 (auth multi-tenant), 009 (super-admin, para concessão manual de acesso).
