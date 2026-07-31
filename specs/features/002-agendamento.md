# 002 — Agendamento

## Status
`aprovada`

## Contexto
Núcleo do produto: substitui a agenda de papel/planilha da clínica. Depende da
auth multi-tenant já entregue em `001` (`src/core/auth`): sessão com
`clinicaId`/`papel` via `ObterContextoSessao`, isolamento por tenant. Esta
feature **não modifica** `src/core/auth`.

Também entrega o módulo `core/paciente` (CRUD mínimo), para que a feature 003
(prontuário/anamnese) consuma o cadastro via port sem duplicar.

## User story
Como recepcionista/dentista, quero ver a disponibilidade dos profissionais e
marcar/remarcar/cancelar/confirmar consultas, para organizar o dia a dia da
clínica sem conflitos de horário.

## Critérios de aceite
- [ ] É possível definir janelas de disponibilidade semanais recorrentes por
      profissional (múltiplas janelas no mesmo dia permitidas, ex. intervalo de
      almoço). Apenas `admin` e `dentista` podem definir disponibilidade.
- [ ] Marcar uma consulta bloqueia aquele horário para aquele profissional
      (status `pendente` ou `confirmado`).
- [ ] Não é possível marcar dois agendamentos com interseção de intervalo para
      o mesmo profissional (regra half-open — ver Decisões aprovadas).
- [ ] Remarcar libera o horário anterior e ocupa o novo, validando
      disponibilidade e sobreposição, de forma atômica.
- [ ] Cancelar libera o horário e registra motivo (opcional); status
      `cancelado` não ocupa slot.
- [ ] Confirmar altera status de `pendente` → `confirmado`.
- [ ] Agendamento tem `origem` (`painel` | `whatsapp-bot` | `link-publico`)
      para métricas.
- [ ] Duração vem do `Procedimento` (padrão), com ajuste manual sujeito a
      min/max e à janela de disponibilidade (ver Decisões).
- [ ] Ao marcar, o sistema registra intenção de lembrete (stub: registro/log
      de “lembrete a enviar”, antecedência default **24h**) — sem job de envio
      real nesta feature.
- [ ] Existe CRUD mínimo de `Paciente` em `core/paciente` (criar, buscarPorId,
      listar), escopado por `clinicaId`.
- [ ] Existe CRUD mínimo de `Procedimento` em `core/agendamento` (criar,
      buscarPorId, listar), escopado por `clinicaId`.
- [ ] Ocupação de slot (`Marcar` / `Remarcar` / `Cancelar`) é atômica
      (transação) e segura sob concorrência (constraint de exclusão no banco).
- [ ] `admin`, `dentista` e `recepcao` podem marcar/remarcar/cancelar/confirmar
      e listar agendamentos do período; apenas `admin` e `dentista` definem
      disponibilidade.
- [ ] É possível listar agendamentos de um período (`dataInicio`/`dataFim`),
      com filtro opcional por `profissionalId`, ordenados por
      `dataHoraInicio` ascendente; escopo por `clinicaId`.
- [ ] Toda leitura/escrita é escopada por `clinicaId` da sessão (padrão 001).

### Matriz de permissões (MVP desta feature)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Definir disponibilidade do profissional | sim | sim | não |
| Marcar / remarcar / cancelar / confirmar consulta | sim | sim | sim |
| Listar agendamentos do período | sim | sim | sim |
| CRUD Procedimento | sim | sim | sim |
| CRUD Paciente | sim | sim | sim |
| Listar horários disponíveis | sim | sim | sim |

## Regras de negócio
- Overbooking do mesmo profissional é sempre bloqueado, independente da origem
  do agendamento (painel, bot ou link público) — validação centralizada no
  domínio, não duplicada em cada camada de entrada.
- Intervalo de ocupação é **half-open** `[dataHoraInicio, dataHoraFim)`:
  agendamentos contíguos (fim de um = início do outro) são permitidos; qualquer
  interseção de duração > 0 (incluindo 1 minuto) é bloqueada.
- Apenas status `pendente` e `confirmado` ocupam o slot; `cancelado` sempre
  libera; `realizado` e `faltou` não entram no fluxo de ocupação desta feature
  (podem ser definidos depois).
- Duração do agendamento vem de `Procedimento.duracaoPadraoMinutos`, mas pode
  ser ajustada manualmente: mínimo **15** min, máximo **240** min, múltiplos
  de **15**; o intervalo resultante deve caber inteiro em uma janela de
  disponibilidade do profissional naquela data.
- `Procedimento.duracaoPadraoMinutos` deve ser ≥ 15 (e respeitar os mesmos
  múltiplos/limites ao cadastrar).
- Disponibilidade no MVP: janelas semanais recorrentes por dia da semana;
  múltiplas janelas no mesmo dia são permitidas. Exceções pontuais
  (férias/feriado) **fora de escopo** (débito técnico).
- Timezone operacional fixo: `America/Sao_Paulo` (default até existir campo
  configurável em `Clinica`).
- Lembrete: ao marcar (e ao remarcar, se aplicável), registra-se intenção com
  antecedência default de **24h**; envio real fica para integração futura.
- Isolamento multi-tenant: todo dado de `Agendamento`, `Paciente`,
  `Procedimento` e disponibilidade é particionado por `clinicaId`.

## Modelo de domínio envolvido
- `Agendamento` — id, clinicaId, pacienteId, profissionalId, procedimentoId,
  dataHoraInicio, dataHoraFim, status (`pendente` | `confirmado` | `cancelado` |
  `realizado` | `faltou`), origem (`painel` | `whatsapp-bot` | `link-publico`),
  motivoCancelamento? 
- `DisponibilidadeProfissional` (nova) — janelas semanais recorrentes
  (profissionalId, clinicaId, diaDaSemana, horaInicio, horaFim); múltiplas
  por dia.
- `Procedimento` — id, clinicaId, nome, duracaoPadraoMinutos, valor (CRUD em
  `core/agendamento`).
- `Paciente` — id, clinicaId, nome, cpf, telefone, dataNascimento,
  contatoEmergencia? (módulo `core/paciente`).
- `Profissional` — já existe em `core/auth` (somente leitura/uso por id +
  clinicaId; **não modificar** auth).

## Casos de uso (application layer)

### `core/agendamento`
- `DefinirDisponibilidadeProfissional(profissionalId, janelas[]) → DisponibilidadeProfissional[]`
- `ListarHorariosDisponiveis(profissionalId, data) → Horario[]`
- `ListarAgendamentosDoPeriodo(clinicaId, dataInicio, dataFim, profissionalId?) → Agendamento[]`
- `MarcarConsulta(pacienteId, profissionalId, procedimentoId, dataHoraInicio, origem, duracaoMinutos?) → Agendamento`
- `RemarcarConsulta(agendamentoId, novaDataHoraInicio, duracaoMinutos?) → Agendamento`
- `CancelarConsulta(agendamentoId, motivo?) → void`
- `ConfirmarConsulta(agendamentoId) → Agendamento`
- `CriarProcedimento(...)` / `BuscarProcedimentoPorId(...)` / `ListarProcedimentos(...)`

### `core/paciente`
- `CriarPaciente(...)` / `BuscarPacientePorId(...)` / `ListarPacientes(...)`

Sessão: reutilizar `ObterContextoSessao` de `src/core/auth` (sem alterar o módulo).

## Ports necessárias
- `AgendamentoRepositoryPort` (inclui garantia de não-sobreposição sob
  concorrência / uso de constraint de exclusão)
- `DisponibilidadeProfissionalRepositoryPort`
- `ProcedimentoRepositoryPort`
- `PacienteRepositoryPort` (em `core/paciente`)
- `LembretePort` ou `NotificacaoPort` (stub: persiste/registra intenção de
  lembrete; sem envio real)
- Leitura de contexto de sessão via port/use-case já existente em auth
  (`ObterContextoSessao` / `AuthPort` — consumir, não reimplementar)

Schema Drizzle esperado (orientação para implementação futura):
- tabelas de agendamento/procedimento/disponibilidade em
  `db/schema/agendamento.ts` (não editar `db/schema/index.ts` nesta feature
  além do necessário de wiring, se a convenção do repo exigir — preferir
  arquivo dedicado);
- tabelas de paciente em schema do módulo paciente (ex.
  `db/schema/paciente.ts`).

## Contrato de API / Server Action (se aplicável)

| Fluxo | Camada | Entrada (alto nível) | Saída |
|---|---|---|---|
| Definir disponibilidade | Server Action (autenticada, admin/dentista) | profissionalId, janelas[] | janelas salvas |
| Listar horários | Server Action (autenticada) | profissionalId, data | lista de slots |
| Listar agendamentos do período | Server Action (autenticada, admin/dentista/recepcao) | dataInicio, dataFim, profissionalId? | `Agendamento[]` ordenados por `dataHoraInicio` |
| Marcar consulta | Server Action (autenticada) | paciente, profissional, procedimento, início, origem, duração? | Agendamento (`pendente`) + intenção de lembrete |
| Remarcar | Server Action (autenticada) | agendamentoId, novo início, duração? | Agendamento atualizado |
| Cancelar | Server Action (autenticada) | agendamentoId, motivo? | ok |
| Confirmar | Server Action (autenticada) | agendamentoId | Agendamento (`confirmado`) |
| CRUD Procedimento | Server Action (autenticada) | campos do procedimento | entidade / lista |
| CRUD Paciente | Server Action (autenticada) | campos do paciente | entidade / lista |

## Fora de escopo
- Lembrete via WhatsApp/e-mail real e job agendado (depende de 007/008 / QStash).
- Exceções pontuais de disponibilidade (férias, feriado, folga avulsa) —
  ver débito técnico.
- Overbooking intencional / lista de espera.
- Campo configurável de timezone em `Clinica` (fica default
  `America/Sao_Paulo`).
- Transições para `realizado` / `faltou` (pode ser feature posterior ou
  extensão).
- Link público de autoagendamento e bot WhatsApp como canais de entrada
  (origem já modelada; fluxos em 007+).
- Modificações em `src/core/auth`.

## Plano de testes
- **Domínio:** sobreposição half-open — contíguos OK; interseção de 1 min
  bloqueia; início/fim exatamente iguais (mesmo intervalo) bloqueia;
  `cancelado` não conflita; duração fora de 15–240 ou não múltiplo de 15
  rejeitada; slot fora da janela semanal rejeitado; múltiplas janelas no
  mesmo dia (buraco de almoço) respeitadas; `ConfirmarConsulta` só de
  `pendente` → `confirmado`.
- **Aplicação:** `RemarcarConsulta` libera o antigo e ocupa o novo de forma
  atômica; falha de lembrete stub não desfaz o agendamento (best-effort);
  RBAC: recepção não define disponibilidade; isolamento por `clinicaId`;
  CRUD Paciente/Procedimento escopados ao tenant;
  `ListarAgendamentosDoPeriodo` retorna só do `clinicaId` da sessão, filtra
  por `profissionalId` quando informado, ordena por `dataHoraInicio`
  ascendente; `admin`/`dentista`/`recepcao` podem listar.
- **Integração:** constraint/exclusão no banco impede race de dois marcadores
  no mesmo slot; repositórios respeitam `clinicaId`.
- **Contrato (crítico):** definir disponibilidade → listar slots → marcar →
  confirmar / remarcar / cancelar; paciente e procedimento criados e
  referenciados.

## Dependências
- 001 (auth multi-tenant) — **já cumprida**.
- Nenhuma outra feature de negócio.

## Decisões aprovadas

1. **Sobreposição:** intervalo half-open `[inicio, fim)`; qualquer interseção
   bloqueia (incl. 1 min); só `pendente`/`confirmado` ocupam o slot;
   `cancelado` sempre libera.
2. **Disponibilidade MVP:** janelas semanais recorrentes (opção A); múltiplas
   janelas no mesmo dia permitidas; timezone fixo `America/Sao_Paulo` até
   campo em `Clinica`.
3. **Duração:** min 15 min, max 240 min, múltiplos de 15; ajuste manual deve
   caber na janela; `duracaoPadraoMinutos` do procedimento ≥ 15.
4. **Atomicidade de slot:** resolvida nesta feature (transação + constraint
   de exclusão no banco). Falha ao registrar/enfileirar lembrete = best-effort
   (débito, análogo à 001).
5. **Paciente:** módulo próprio `core/paciente` (CRUD mínimo) nesta feature;
   003 consome via port. **Procedimento:** permanece em `core/agendamento`
   (CRUD mínimo).
6. **RBAC:** marcar/remarcar/cancelar/confirmar e
   `ListarAgendamentosDoPeriodo` = `admin` | `dentista` | `recepcao`;
   definir disponibilidade = só `admin` | `dentista`.
7. **Confirmação:** no escopo (`ConfirmarConsulta`, `pendente` → `confirmado`).
8. **Lembrete:** stub que registra intenção (log/registro “lembrete a enviar”),
   antecedência default 24h; job/envio real depois da integração de notificação.
9. **Casos de uso extras:** `DefinirDisponibilidadeProfissional`,
   `ConfirmarConsulta`, `ListarAgendamentosDoPeriodo`, CRUD Paciente e
   Procedimento.
10. **Auth:** reutilizar `ObterContextoSessao` sem modificar `src/core/auth`;
    disponibilidade como entidade nova em `core/agendamento`.
11. **`ListarAgendamentosDoPeriodo`:** filtro por `dataHoraInicio` no intervalo
    half-open `[dataInicio, dataFim)`; `profissionalId` opcional; retorna
    todos os status do período; ordenação ascendente por `dataHoraInicio`;
    `clinicaId` deve coincidir com o da sessão (padrão 001). **Aprovado** —
    pronto para o Arquiteto.

## Débito técnico conhecido

- **Exceções pontuais de disponibilidade** (férias, feriado, folga avulsa):
  não entram no MVP; registrar para feature posterior.
- **Timezone configurável por clínica:** hoje fixo `America/Sao_Paulo`.
- **Lembrete best-effort:** se a persistência do agendamento suceder e o
  registro da intenção de lembrete falhar, o agendamento permanece válido
  sem lembrete enfileirado. Resolver com padrão transversal de
  transação/outbox quando a integração real de notificação (WhatsApp/e-mail +
  QStash) estiver pronta — alinhado ao débito de atomicidade multi-repo da
  001.
- **Unit of Work transversal** entre módulos (mencionado na 001): a
  ocupação de slot em agendamento **não** espera esse padrão (constraint +
  transação local resolvem o invariante); o UoW continua necessário para
  fluxos multi-aggregate/multi-porta (ex. lembrete + envio futuro).
