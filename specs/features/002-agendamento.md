# 002 — Agendamento

## Status
`rascunho`

## Contexto
Núcleo do produto: substitui a agenda de papel/planilha da clínica.

## User story
Como recepcionista/dentista, quero ver a disponibilidade dos profissionais e
marcar/remarcar/cancelar consultas, para organizar o dia a dia da clínica sem
conflitos de horário.

## Critérios de aceite
- [ ] É possível cadastrar profissionais com janelas de disponibilidade (dias/horários).
- [ ] Marcar uma consulta bloqueia aquele horário para aquele profissional.
- [ ] Não é possível marcar dois agendamentos sobrepostos para o mesmo profissional.
- [ ] Remarcar libera o horário anterior e ocupa o novo, validando disponibilidade.
- [ ] Cancelar libera o horário e registra motivo (opcional).
- [ ] Agendamento tem `origem` (painel, whatsapp-bot, link público) para métricas.
- [ ] Sistema envia lembrete automático antes da consulta (canal: a definir —
      depende de 008/007, pode ser stub nesta feature).

## Regras de negócio
- Overbooking do mesmo profissional é sempre bloqueado, independente da origem
  do agendamento (painel, bot ou link público) — validação centralizada no
  domínio, não duplicada em cada camada de entrada.
- Duração do agendamento vem do `Procedimento` selecionado, mas pode ser
  ajustada manualmente pelo profissional.

## Modelo de domínio envolvido
`Agendamento`, `Profissional`, `Paciente`, `Procedimento`.

## Casos de uso (application layer)
- `ListarHorariosDisponiveis(profissionalId, data) → Horario[]`
- `MarcarConsulta(pacienteId, profissionalId, procedimentoId, dataHora, origem) → Agendamento`
- `RemarcarConsulta(agendamentoId, novaDataHora) → Agendamento`
- `CancelarConsulta(agendamentoId, motivo?) → void`

## Ports necessárias
- `AgendamentoRepositoryPort`
- `NotificacaoPort` (lembrete — implementação inicial pode ser um adapter "noop"
  ou e-mail simples; WhatsApp entra depois de 008)

## Fora de escopo
- Lembrete via WhatsApp (depende de 007/008).
- Overbooking intencional/lista de espera.

## Plano de testes
- Domínio: "não permite sobreposição de horário do mesmo profissional" (caso mais
  crítico — cobrir com múltiplos cenários de borda: início/fim exatamente iguais,
  sobreposição parcial).
- Aplicação: remarcar libera o slot antigo antes de tentar ocupar o novo.
- Integração: repositório real respeita índice/constraint de não sobreposição.

## Dependências
001 (auth multi-tenant).
