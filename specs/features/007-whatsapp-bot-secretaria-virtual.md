# 007 — WhatsApp Bot "Secretária Virtual"

## Status
`rascunho`

## Contexto
Muitas clínicas atendidas não têm secretária. O bot atende o paciente no primeiro
contato, oferece opções (marcar consulta, orçamento, falar com atendente) e reduz
a carga manual sobre o dentista/recepção. Depende da conexão do número da clínica
via Embedded Signup (spec 008).

## User story
Como paciente, quero mandar mensagem no WhatsApp da clínica e ser atendido
imediatamente com opções claras, para marcar consulta ou tirar dúvida sem
precisar ligar em horário comercial.
Como dono de clínica, quero que meu WhatsApp responda automaticamente pacientes
mesmo quando não tenho secretária, sem perder a opção de assumir a conversa
manualmente quando necessário.

## Critérios de aceite
- [ ] Nova mensagem de um número desconhecido/sem conversa ativa dispara boas-vindas
      + menu: 1) Marcar consulta, 2) Solicitar orçamento, 3) Falar com atendente.
- [ ] Opção 1 leva a fluxo de agendamento (lista de profissionais/horários
      disponíveis, reaproveitando `core/agendamento`, ou link público de agenda).
- [ ] Opção 2 cria um registro de "solicitação de orçamento" visível no painel da
      clínica.
- [ ] Opção 3 marca a conversa como `aguardando-humano` e o bot para de responder
      automaticamente até um atendente encerrar/retomar.
- [ ] Estado da conversa é mantido por paciente/telefone (`ConversaBot`), then a
      próxima mensagem do mesmo número continua o fluxo em vez de reiniciar o menu.
- [ ] Mensagens fora do menu esperado recebem resposta padrão reoferecendo o menu.

## Regras de negócio
- Conversa em `aguardando-humano` nunca recebe resposta automática do bot.
- Cada `ConversaBot` pertence a exatamente uma clínica (roteada pelo
  `phone_number_id` que recebeu a mensagem — ver 008).
- Agendamento criado via bot tem `origem = whatsapp-bot` (ver spec 002) para
  métricas e para não sobrepor horário validado por `core/agendamento`.

## Modelo de domínio envolvido
`ConversaBot`, `ClinicWhatsappAccount` (008), `Agendamento` (002).

## Casos de uso (application layer)
- `ReceberMensagemWhatsapp(phoneNumberId, telefonePaciente, texto) → void`
  (identifica clínica pelo phoneNumberId, roteia pra conversa certa)
- `IniciarConversa(clinicaId, telefonePaciente) → ConversaBot`
- `ProcessarEscolhaMenu(conversaId, opcaoEscolhida) → RespostaBot`
- `TransferirParaAtendente(conversaId) → void`
- `EnviarMensagemWhatsapp(clinicaId, telefonePaciente, texto) → void`

## Ports necessárias
- `ConversaBotRepositoryPort`
- `WhatsappMessagingPort` (enviar mensagem — implementado pelo adapter da Cloud API)
- reaproveita `AgendamentoRepositoryPort` de 002 para consultar disponibilidade

## Contrato de API
- `POST /api/whatsapp/webhook` — recebido da Meta, valida assinatura, delega ao
  caso de uso `ReceberMensagemWhatsapp`.

## Fora de escopo
- IA para respostas livres (fora do menu) — v2.
- Multi-idioma.

## Plano de testes
- Domínio: conversa `aguardando-humano` nunca gera resposta automática.
- Aplicação: fluxo completo de menu (mock do `WhatsappMessagingPort`) cobrindo as
  3 opções e entradas inválidas.
- Integração: roteamento correto por `phone_number_id` quando há múltiplas
  clínicas conectadas simultaneamente.

## Dependências
002 (agendamento), 008 (conexão WhatsApp via Embedded Signup).
