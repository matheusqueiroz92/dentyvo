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
      listar, atualizar), escopado por `clinicaId`.
- [ ] `AtualizarPaciente(pacienteId, dados) → Paciente` altera nome, telefone,
      data de nascimento e contato de emergência; o **CPF não é editável**
      após a criação (ver Decisões aprovadas — decisão 13). RBAC idêntico a
      `CriarPaciente` (`admin` | `dentista` | `recepcao`).
- [ ] `Paciente` possui `consentimentoLgpd` nullable
      (`{ aceitoEm, versaoTermo, finalidades[] }`), permitindo cadastro
      inicial sem consentimento formalizado (ex.: urgência) e registro
      posterior via `RegistrarConsentimentoPaciente`.
- [ ] `RegistrarConsentimentoPaciente(pacienteId, finalidades[], versaoTermo)`
      persiste o consentimento (RBAC idêntico a `CriarPaciente`:
      `admin` | `dentista` | `recepcao`); `comunicacao_marketing` nunca é
      implícito — só entra se constar explicitamente em `finalidades`.
- [ ] A **ausência** de `consentimentoLgpd` **não bloqueia** atendimento
      clínico básico (prontuário, evolução, receita): a base legal para
      tratamento de dados de saúde pelo profissional é a tutela da saúde
      (LGPD art. 11, II, f), alternativa ao consentimento. O registro de
      consentimento nesta feature é captura/auditoria; a checagem que
      **impede** WhatsApp/lembretes/marketing sem a finalidade
      correspondente fica para quando 007/011 forem conectados a este
      dado (ver Fora de escopo).
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
| Registrar consentimento LGPD do paciente | sim | sim | sim |
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
- **CPF do paciente é imutável após o cadastro:** `AtualizarPaciente` não
  aceita alteração de CPF. Correção de CPF informado errado exige fluxo
  fora deste caso de uso (suporte/admin — fora de escopo desta emenda).
  Campos editáveis: `nome`, `telefone`, `dataNascimento`,
  `contatoEmergencia`. Consentimento LGPD continua só via
  `RegistrarConsentimentoPaciente` (não passa por `AtualizarPaciente`).
- **Consentimento LGPD do paciente (controladora = clínica):**
  - `consentimentoLgpd` é **nullable**: cadastro sem consentimento é
    permitido; formalização pode ocorrer depois
    (`RegistrarConsentimentoPaciente`).
  - Finalidades (códigos) sugeridas / canônicas nesta feature:
    - `tratamento_clinico` — uso do prontuário/histórico pelo profissional;
    - `comunicacao_lembretes` — lembrete de consulta (WhatsApp/notificação);
    - `comunicacao_marketing` — opcional e **separado**; nunca pré-marcado
      em UI; só válido se presente explicitamente em `finalidades`.
  - Tutela da saúde (LGPD art. 11, II, f): falta de consentimento **não**
    impede prontuário/evolução/receita. Comunicação automatizada
    (lembretes/WhatsApp) e marketing **devem** checar a finalidade
    específica — integração de bloqueio **fora** desta entrega (007/011).

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
  contatoEmergencia?, `consentimentoLgpd?` (módulo `core/paciente`):
  - `ConsentimentoLgpdPaciente` — `{ aceitoEm: Date, versaoTermo: string,
    finalidades: FinalidadeConsentimentoPaciente[] }` (nullable no
    `Paciente`);
  - `FinalidadeConsentimentoPaciente` — `tratamento_clinico` |
    `comunicacao_lembretes` | `comunicacao_marketing`.
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
  — `CriarPaciente` pode aceitar `consentimentoLgpd` opcional no mesmo
  ato do cadastro; se omitido, permanece `null`.
- `AtualizarPaciente(pacienteId, dados) → Paciente`
  — `dados`: `{ nome, telefone, dataNascimento, contatoEmergencia? }`;
  **não inclui CPF** (imutável após criação — decisão 13);
  RBAC igual a `CriarPaciente` (`admin` | `dentista` | `recepcao`);
  escopo por `clinicaId` da sessão; paciente inexistente / de outro tenant
  → erro de domínio já usado em busca (`PacienteNaoEncontrado` / tenant).
- `RegistrarConsentimentoPaciente(pacienteId, finalidades[], versaoTermo) → Paciente`
  — grava/atualiza `consentimentoLgpd` (`aceitoEm` = instante do registro);
  RBAC igual a `CriarPaciente` (`admin` | `dentista` | `recepcao`);
  escopo por `clinicaId` da sessão.

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
| CRUD Paciente | Server Action (autenticada) | campos do paciente (+ consentimento opcional na criação) | entidade / lista |
| Atualizar paciente | Server Action (autenticada, admin/dentista/recepcao) | pacienteId, nome, telefone, dataNascimento, contatoEmergencia? (sem CPF) | Paciente atualizado |
| Registrar consentimento LGPD | Server Action (autenticada, admin/dentista/recepcao) | pacienteId, finalidades[], versaoTermo | Paciente atualizado |

## Fora de escopo
- Lembrete via WhatsApp/e-mail real e job agendado (depende de 007/008 / QStash).
- **Bloqueio de disparo** de lembretes/WhatsApp/marketing com base em
  `consentimentoLgpd.finalidades` — esta spec só define o **registro** do
  consentimento; a integração de gate fica para quando 007/011 forem
  conectados a este campo (débito de integração abaixo).
- Exceções pontuais de disponibilidade (férias, feriado, folga avulsa) —
  ver débito técnico.
- Overbooking intencional / lista de espera.
- Campo configurável de timezone em `Clinica` (fica default
  `America/Sao_Paulo`).
- Transições para `realizado` / `faltou` (pode ser feature posterior ou
  extensão).
- ~~Link público de autoagendamento~~ — **elevado** a emenda aprovada desta
  feature (ver seção *Emenda — Agendamento via link público* abaixo). Bot
  WhatsApp como canal de entrada permanece fora (007); confirmação
  WhatsApp do agendamento público = fase 2.
- Modificações amplas em `src/core/auth` / modelo de sessão profissional —
  a emenda do link público só exige extensão mínima (`Clinica.slug`,
  `Profissional.slug`) e leitura por slug; sem alterar `ContextoSessao`.
- Portal do paciente / consentimento self-service do titular (ver
  `specs/00-overview.md` — portal futuro). O link público **não** autentica
  o paciente como ator clínico.
- Correção de CPF após cadastro (fluxo suporte/admin) e exclusão de
  paciente — fora desta emenda de `AtualizarPaciente`.
- UI da tela de Configurações para
  `ConfigurarMenuPublicoDeProcedimentos` e edição de slugs — dependência
  cruzada (ver emenda); não é entrega de UI desta spec de agendamento.

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
  `CriarPaciente` sem consentimento deixa `consentimentoLgpd = null`;
  `AtualizarPaciente` altera nome/telefone/dataNascimento/contatoEmergencia
  e preserva o CPF original; tentativa de mudar CPF é rejeitada (ou CPF
  simplesmente não faz parte do input); RBAC = `CriarPaciente`;
  paciente de outra clínica / inexistente falha;
  `RegistrarConsentimentoPaciente` persiste `aceitoEm`/`versaoTermo`/
  `finalidades` e respeita o mesmo RBAC de `CriarPaciente`;
  `ListarAgendamentosDoPeriodo` retorna só do `clinicaId` da sessão, filtra
  por `profissionalId` quando informado, ordena por `dataHoraInicio`
  ascendente; `admin`/`dentista`/`recepcao` podem listar.
- **Domínio (consentimento):** `comunicacao_marketing` só se listado
  explicitamente; value object/registro rejeita finalidades desconhecidas;
  paciente sem consentimento permanece válido para vínculos de
  agendamento/prontuário (não há invariante que exija consentimento para
  atendimento).
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
   003 consome via port; inclui `consentimentoLgpd` nullable e
   `RegistrarConsentimentoPaciente` (emenda LGPD — decisão 12);
   inclui `AtualizarPaciente` com CPF imutável (emenda — decisão 13).
   **Procedimento:** permanece em `core/agendamento` (CRUD mínimo).
6. **RBAC:** marcar/remarcar/cancelar/confirmar e
   `ListarAgendamentosDoPeriodo` = `admin` | `dentista` | `recepcao`;
   definir disponibilidade = só `admin` | `dentista`;
   registrar consentimento LGPD e `AtualizarPaciente` = mesmo RBAC de
   CRUD Paciente (`CriarPaciente`).
7. **Confirmação:** no escopo (`ConfirmarConsulta`, `pendente` → `confirmado`).
8. **Lembrete:** stub que registra intenção (log/registro “lembrete a enviar”),
   antecedência default 24h; job/envio real depois da integração de notificação.
9. **Casos de uso extras:** `DefinirDisponibilidadeProfissional`,
   `ConfirmarConsulta`, `ListarAgendamentosDoPeriodo`, CRUD Paciente
   (incl. `AtualizarPaciente`) e Procedimento,
   `RegistrarConsentimentoPaciente`.
10. **Auth:** reutilizar `ObterContextoSessao` sem modificar `src/core/auth`;
    disponibilidade como entidade nova em `core/agendamento`.
11. **`ListarAgendamentosDoPeriodo`:** filtro por `dataHoraInicio` no intervalo
    half-open `[dataInicio, dataFim)`; `profissionalId` opcional; retorna
    todos os status do período; ordenação ascendente por `dataHoraInicio`;
    `clinicaId` deve coincidir com o da sessão (padrão 001). **Aprovado** —
    pronto para o Arquiteto.
12. **Consentimento LGPD do paciente (emenda — módulo `core/paciente`):**
    - Campo `consentimentoLgpd` nullable:
      `{ aceitoEm: Date, versaoTermo: string, finalidades: string[] }` com
      finalidades canônicas `tratamento_clinico` |
      `comunicacao_lembretes` | `comunicacao_marketing`.
    - Caso de uso `RegistrarConsentimentoPaciente`; RBAC = `CriarPaciente`.
    - Ausência de consentimento **não** bloqueia atendimento clínico
      (prontuário/evolução/receita — LGPD art. 11, II, f).
    - Gate de disparo WhatsApp/lembretes/marketing **não** entra nesta
      entrega — só o registro do consentimento.
    - **Aprovado para documentação;** Arquiteto/Implementador deste
      campo quando o cadastro de paciente for revisitado (não avançar
      automaticamente nesta rodada).
13. **`AtualizarPaciente` (emenda — módulo `core/paciente`):**
    - Caso de uso `AtualizarPaciente(pacienteId, dados) → Paciente`.
    - **CPF travado após criação** (campo de identidade/deduplicação):
      edição livre abriria risco de “corrigir” para o CPF de outro
      paciente da clínica e misturar prontuário/histórico de duas
      pessoas. Correção de CPF errado = fluxo separado (suporte/admin),
      fora desta emenda.
    - Campos editáveis em `dados`: `nome`, `telefone`, `dataNascimento`,
      `contatoEmergencia?`. Validação de formato/obrigatoriedade segue as
      mesmas regras de `CriarPaciente` / entidade `Paciente` para esses
      campos.
    - `consentimentoLgpd` **não** é alterado por este caso de uso
      (permanece em `RegistrarConsentimentoPaciente`).
    - RBAC = `CriarPaciente` (`admin` | `dentista` | `recepcao`);
      escopo `clinicaId` da sessão.
    - **Aprovado** — pronto para o Arquiteto de Domínio.

14. **Agendamento via link público (emenda — decisão consolidada):**
    - Ver seção *Emenda — Agendamento via link público* abaixo.
    - **Aprovado** — pronto para o Arquiteto de Domínio.

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
- **Gate de comunicação por finalidade de consentimento:** quando 007
  (WhatsApp/bot) e 011 (notificações) forem conectados a
  `Paciente.consentimentoLgpd`, checar `comunicacao_lembretes` antes de
  lembretes automáticos e `comunicacao_marketing` antes de qualquer
  disparo de marketing; sem essa finalidade, não enviar. Esta feature
  apenas persiste o consentimento.
- **Redirect de slug antigo (link público):** alterar `Clinica.slug` ou
  `Profissional.slug` invalida links já compartilhados; sem redirect de
  slug antigo no MVP (avisar na UI de edição — Configurações).
- **Confirmação WhatsApp do agendamento público:** fase 2 (007); MVP usa
  rate limit + CAPTCHA + status `pendente` com confirmação no painel.

---

## Emenda — Agendamento via link público

### Status da emenda
`aprovada` — **pronta para o Arquiteto de Domínio**.

Registro alinhado a `specs/00-overview.md` (*Próxima adição de escopo* /
*Agendamento via link público*). O domínio já admite
`Agendamento.origem = link-publico` desde a 002 original; esta emenda
define a superfície pública, slugs, menu curto de procedimentos,
resolução de paciente e proteções do canal.

### Contexto
Clínicas sem secretária (ou com fila no telefone) precisam oferecer um
canal em que o **paciente** escolha horário e solicite consulta sem login
no painel. O valor de `origem` já existe para métricas; o canal deve
**reutilizar** as regras centrais de disponibilidade/overbooking
(`ListarHorariosDisponiveis` / `MarcarConsulta` / domínio de slot), sem
duplicar invariantes nem recalcular disponibilidade do zero.

Persona: **Paciente** (visitante anônimo no link) + equipe da clínica
(recebe o agendamento no painel com `origem: link-publico`).

### User story
Como paciente, quero abrir o link público da clínica (ou o link direto de
um profissional), escolher um tipo de atendimento do menu, informar meus
dados e um horário livre, para marcar consulta sem ligar nem criar conta.

Como recepcionista/dentista, quero receber no painel os agendamentos
vindos do link com `origem = link-publico` e status `pendente`, para
confirmar e organizar o dia sem conflitos (mesmas regras de slot da
agenda interna).

### Critérios de aceite

#### Identificadores públicos (slugs)
- [ ] `Clinica` possui `slug` **único na plataforma** (normalizado:
      minúsculas, hífens). URL canônica da clínica:
      `dentyvo.com/agendar/[slug-clinica]`.
- [ ] `Profissional` possui `slug` **único por clínica** (não global).
      URL canônica do profissional:
      `dentyvo.com/agendar/[slug-clinica]/[slug-profissional]`.
- [ ] O cliente **nunca** envia `clinicaId` / `profissionalId` como fonte
      de verdade; o servidor resolve ids a partir dos slugs da URL.
- [ ] `admin` pode editar `Clinica.slug` e `Profissional.slug` (fluxo
      autenticado em Configurações — UI fora desta entrega de
      agendamento). A UI de edição **deve avisar** que alterar o slug
      invalida links já compartilhados; **sem** redirect de slug antigo
      no MVP.
- [ ] Geração inicial sugerida a partir do nome (com sufixo se colidir);
      detalhe de schema/geração fica com o Arquiteto.

#### Dois formatos de link (mesmo fluxo)
- [ ] `/agendar/[slug-clinica]`: lista profissionais da clínica com
      disponibilidade; paciente escolhe um — ou avança direto se houver
      **apenas um** profissional elegível.
- [ ] `/agendar/[slug-clinica]/[slug-profissional]`: pula a escolha;
      profissional já pré-resolvido pela URL.
- [ ] Ambos os formatos reutilizam o **mesmo** fluxo/formulário a partir
      da etapa de escolha de procedimento; a única diferença é se a etapa
      de profissional é exibida ou pré-resolvida.

#### Menu público curto de procedimentos
- [ ] Cada clínica pode configurar um menu público de **2–4** opções
      genéricas voltadas ao paciente leigo (ex.: "Consulta/Avaliação",
      "Limpeza", "Emergência/Dor", "Retorno"), cada uma mapeada a um
      `Procedimento` real já cadastrado (sem catálogo paralelo).
- [ ] Caso de uso `ConfigurarMenuPublicoDeProcedimentos(clinicaId, itens[])
      → void`, RBAC **admin** apenas. UI na tela de Configurações —
      **dependência cruzada**; esta spec não entrega essa UI.
- [ ] Se a clínica **não** configurar o menu, o sistema usa um
      procedimento catch-all padrão único **"Consulta/Avaliação"**,
      criado automaticamente (um por clínica, reutilizado).
- [ ] No link público, o paciente escolhe apenas itens do menu público
      (rótulo amigável); o agendamento persiste o `procedimentoId` mapeado.

#### Identificação do paciente
- [ ] Visitante informa nome, telefone e CPF.
- [ ] Se existir `Paciente` com o mesmo CPF no `clinicaId` resolvido →
      **vincula** o agendamento a esse paciente; **não** atualiza
      nome/telefone automaticamente a partir do formulário público
      (evita sobrescrita não supervisionada — mesmo princípio da decisão
      13 / `AtualizarPaciente`).
- [ ] Se CPF não encontrado no tenant → **cria** `Paciente` novo com os
      dados informados.
- [ ] Sem fila de mesclagem manual no MVP; não casar só por telefone/nome.
- [ ] Captura aceite explícito de `comunicacao_lembretes` no fluxo
      público; `comunicacao_marketing` **nunca** pré-marcado (só entra se
      o usuário marcar explicitamente — default: não oferecer ou
      desmarcado).

#### Horários
- [ ] Listagem de slots **reutiliza** `ListarHorariosDisponiveis` (002)
      já existente — **não** recalcula disponibilidade do zero para o
      canal público.
- [ ] Mostra apenas horários realmente livres para o profissional e a
      data escolhidos; sem vazar PII de outros pacientes.

#### Criação do agendamento e abuso
- [ ] Agendamento criado pelo canal tem `origem = "link-publico"` e
      status inicial **`pendente`** (equipe confirma no painel via
      `ConfirmarConsulta`).
- [ ] Proteção MVP: rate limit por **IP + slug da clínica** nas actions
      públicas (listar slots / marcar) **e** CAPTCHA na submissão do
      agendamento (token verificado no servidor antes do caso de uso).
- [ ] Confirmação via WhatsApp (007) é **fase 2** — não bloqueia este MVP.
- [ ] Overbooking continua bloqueado no domínio, independente da origem.
- [ ] Profissional e procedimento referenciados devem pertencer à clínica
      resolvida; caso contrário, erro de domínio/autorização.
- [ ] Isolamento multi-tenant: nada do canal público lê ou escreve fora
      do `clinicaId` resolvido.

#### RBAC do canal público
- [ ] Canal **não** usa `ContextoSessao` / `ObterContextoSessao`.
- [ ] Resolve
      `ContextoAgendamentoPublico = { clinicaId, canal: "link-publico",
      slug, profissionalSlug? }` **somente** a partir do(s) slug(s) da
      URL.
- [ ] Elegibilidade exige **os dois** gates: `Clinica.status = ativa`
      **e** `VerificarAcessoAtivo` (010) permitido — o link não contorna
      inadimplência nem clínica inativa.
- [ ] Canal autoriza **apenas**: ler resumo público (nome/logo da
      clínica, profissionais elegíveis, menu público), listar slots
      livres e criar agendamento com `origem: link-publico`.
- [ ] Explicitamente **proibido** nesse canal: cancelar, remarcar,
      confirmar, listar agenda completa do período, CRUD genérico de
      paciente/procedimento, acessar dado de outro paciente ou qualquer
      dado clínico.

### Matriz de permissões (canal público)

| Ação | Visitante (link público) | admin | dentista | recepcao |
|---|---|---|---|---|
| Abrir página / listar slots / ver menu público | sim | n/a (painel autenticado) | n/a | n/a |
| Solicitar agendamento (`origem: link-publico`) | sim | sim (`origem: painel`) | sim | sim |
| `ConfigurarMenuPublicoDeProcedimentos` | **não** | **sim** | não | não |
| Editar slug clínica / profissional | **não** | **sim** (Configurações) | não* | não |
| Cancelar / remarcar / confirmar | **não** | sim | sim | sim |
| Listar agendamentos / dados de outros pacientes | **não** | sim | sim | sim |

\* Edição de `Profissional.slug` próprio pode ser refinada na UI de
Configurações; RBAC mínimo aprovado: **admin** configura slugs e menu
público.

### Regras de negócio (emenda)
- Slugs são a única chave pública de roteamento; ids internos não são
  autoridade no cliente.
- Alterar slug invalida o link anterior (sem redirect no MVP).
- Menu público é fachada de rótulos → `Procedimento` existente; duração e
  regras de slot vêm do procedimento mapeado.
- Catch-all: ausência de menu configurado ⇒ um único item efetivo
  "Consulta/Avaliação" (procedimento padrão da clínica).
- Paciente existente por CPF: vínculo somente; formulário público não
  muta identidade/contato do cadastro.
- Paciente novo: cria com dados do formulário + consentimento de
  lembretes conforme captura na UI.
- Slots = saída de `ListarHorariosDisponiveis` (mesma regra half-open /
  janelas semanais).
- Status inicial público = `pendente`; confirmação operacional no painel.
- `ContextoAgendamentoPublico` após gates `ativa` + `VerificarAcessoAtivo`.

### Modelo de domínio envolvido (emenda)
- `Clinica` — adiciona `slug` (único na plataforma).
- `Profissional` — adiciona `slug` (único por `clinicaId`).
- `Procedimento` — reutilizado; menu público só referencia ids existentes
  (+ procedimento catch-all "Consulta/Avaliação" se necessário).
- `MenuPublicoProcedimento` (ou equivalente) — itens `{ rotuloPublico,
  procedimentoId, ordem }` por clínica, 2–4 quando configurado.
- `Agendamento` — reutiliza; força `origem: link-publico`, status
  `pendente`.
- `Paciente` — resolve por CPF no tenant ou cria; consentimento com
  `comunicacao_lembretes`.
- `ContextoAgendamentoPublico` — value object / tipo de application
  `{ clinicaId, canal: "link-publico", slug, profissionalSlug? }`.
- `DisponibilidadeProfissional` — leitura via caso de uso já existente.

### Casos de uso (application layer)

#### Canal público (`core/agendamento`, sem sessão profissional)
- `ResolverContextoAgendamentoPublico(slugClinica, slugProfissional?) → ContextoAgendamentoPublico`
  — resolve slugs; valida `Clinica.status = ativa` e
  `VerificarAcessoAtivo`; rejeita slug inexistente / clínica inelegível /
  profissionalSlug de outra clínica ou inexistente.
- `ObterResumoAgendamentoPublico(contexto) → ResumoPublico`
  — nome/logo da clínica; lista de profissionais elegíveis (se
  `profissionalSlug` ausente); menu público efetivo (configurado ou
  catch-all); se profissional pré-resolvido, inclui esse profissional.
- `ListarHorariosDisponiveisNoLinkPublico(contexto, profissionalId, data) → Horario[]`
  — **delega** a `ListarHorariosDisponiveis` (002); não recalcula do zero;
  garante que `profissionalId` pertence ao contexto (e coincide com o
  slug pré-resolvido, se houver).
- `MarcarConsultaViaLinkPublico(contexto, dados) → Agendamento`
  — `dados`: nome, telefone, cpf, procedimentoId (do menu), profissionalId,
    dataHoraInicio, tokenCaptcha (validado na borda/action), aceite
    lembretes; resolve/cria paciente (regra CPF); marca com
    `origem: "link-publico"`, status `pendente`; reutiliza regra de
    `MarcarConsulta` / domínio de slot; **não** expõe cancelar/remarcar/
    confirmar.

#### Configuração autenticada (dependência cruzada — Configurações)
- `ConfigurarMenuPublicoDeProcedimentos(clinicaId, itens[]) → void`
  — `itens`: 2–4 entradas `{ rotuloPublico, procedimentoId }` (ordem
  implícita ou explícita); cada `procedimentoId` deve existir no tenant;
  RBAC **admin** apenas; usa `ObterContextoSessao` (painel).
- Casos de uso de edição de `Clinica.slug` / `Profissional.slug` —
  autenticados, admin; UI e wiring em Configurações (fora da UI pública
  desta emenda); devem validar unicidade e superfícies de aviso de
  invalidação de links.

### Ports necessárias (emenda)
- Leitura/escrita de `Clinica` por `slug` (e atualização de slug).
- Leitura/escrita de `Profissional` por `(clinicaId, slug)`.
- `MenuPublicoProcedimentoRepositoryPort` (ou extensão de port de
  procedimento/clínica) — persistir/ler itens do menu; garantir
  procedimento catch-all.
- `PacienteRepositoryPort` — busca por CPF no tenant + criar.
- Repositórios já existentes de agendamento / disponibilidade /
  procedimento.
- Port de `VerificarAcessoAtivo` (010) — consumir, não reimplementar.
- `RateLimitPort` (ou equivalente) — chave IP + slug clínica.
- `CaptchaPort` — verificar token na submissão.
- **Não** depender de `ObterContextoSessao` nos use cases do canal
  público (apenas nos de configuração autenticada).

### Contrato de API / Server Action

| Fluxo | Camada | Auth | Entrada (alto nível) | Saída |
|---|---|---|---|---|
| Página clínica | Rota pública `/agendar/[slug]` | nenhuma | slug clínica | UI (escolhe profissional se >1) |
| Página profissional | Rota pública `/agendar/[slug]/[profissionalSlug]` | nenhuma | slugs | UI com profissional pré-resolvido |
| Resolver contexto / resumo | Action/route pública | rate limit | slugs | resumo + menu + profissionais |
| Listar horários | Action/route pública | rate limit | slugs, profissional, data | slots livres (`ListarHorariosDisponiveis`) |
| Solicitar agendamento | Action/route pública | rate limit + CAPTCHA | slugs, dados paciente, menu item, profissional, início | Agendamento `pendente`, `origem: link-publico` |
| Configurar menu público | Server Action autenticada | admin | itens[2..4] | ok |
| Editar slugs | Server Action autenticada | admin | novo slug | ok (+ aviso UI de invalidação) |

### Fora de escopo desta emenda
- Login/portal do paciente (v2 — overview).
- Cancelar/remarcar pelo próprio paciente via link.
- Confirmação WhatsApp / OTP via bot (007) — **fase 2**.
- Redirect/histórico de slugs antigos.
- Catálogo paralelo de procedimentos “públicos” desconectado de
  `Procedimento`.
- UI da tela de Configurações (menu público + edição de slugs) — apenas
  o caso de uso/`ports` do menu entram como contrato; a UI é dependência
  cruzada.
- Expor prontuário, odontograma, receita ou PII de terceiros no link.
- Substituir o fluxo autenticado do painel.
- SMS como canal de verificação.

### Plano de testes
- **Aplicação (contexto):** slug clínica inexistente falha; clínica
  `inativa` falha; `VerificarAcessoAtivo` negado falha mesmo com status
  `ativa`; `profissionalSlug` de outra clínica / inexistente falha;
  contexto preenchido com `profissionalSlug?` corretamente.
- **Aplicação (menu):** menu configurado 2–4 itens mapeia para
  procedimentos do tenant; item com procedimento de outro tenant rejeitado;
  sem menu ⇒ catch-all "Consulta/Avaliação" único; `ConfigurarMenuPublicoDeProcedimentos` só `admin`.
- **Aplicação (paciente):** CPF existente → vincula sem alterar
  nome/telefone; CPF novo → cria paciente; aceite
  `comunicacao_lembretes` registrado; marketing não implícito.
- **Aplicação (marcar):** `origem = link-publico`, status `pendente`;
  delega regras de slot/overbooking; procedimento fora do menu rejeitado;
  profissional pré-resolvido na URL não pode ser trocado para outro id.
- **Aplicação (horários):** `ListarHorariosDisponiveisNoLinkPublico`
  chama/equivale a `ListarHorariosDisponiveis`; não inventa slots.
- **Aplicação (abuso/borda):** ausência/falha de CAPTCHA bloqueia
  marcação; rate limit por IP+slug rejeita excesso (teste de adapter ou
  contrato da port).
- **RBAC canal:** superfície pública não cancela/remarca/confirma/lista
  agenda completa; não usa `ObterContextoSessao`.
- **Contrato (crítico):** abrir `/agendar/[slug]` → escolher profissional
  (ou auto se um) → escolher item do menu → ver slots → submeter com
  CAPTCHA → agendamento no painel com origem e status corretos; abrir
  `/agendar/[slug]/[profissionalSlug]` pula escolha de profissional.

### Dependências
- 002 núcleo (agendamento, paciente, `ListarHorariosDisponiveis`,
  `MarcarConsulta`) — já entregue.
- 001 (`Clinica`, `Profissional`, isolamento) — extensão mínima de slug.
- 010 (`VerificarAcessoAtivo`) — **obrigatória** nos gates do contexto
  público.
- 007 (WhatsApp) — fase 2 para confirmação; não bloqueia o MVP.
- Configurações (UI) — dependência cruzada para
  `ConfigurarMenuPublicoDeProcedimentos` e edição de slugs; contrato do
  caso de uso do menu faz parte desta emenda.

### Decisões aprovadas (emenda — consolidado)

1. **Slug da clínica:** único na plataforma; URL
   `dentyvo.com/agendar/[slug]`; admin edita; aviso de invalidação de
   links; sem redirect de slug antigo no MVP.
2. **Paciente:** casa por CPF no tenant e vincula; **não** atualiza
   nome/telefone pelo formulário público; cria se ausente; sem mesclagem
   manual; captura `comunicacao_lembretes`; marketing nunca pré-marcado.
3. **Menu público curto:** 2–4 opções genéricas mapeadas a `Procedimento`
   existente; `ConfigurarMenuPublicoDeProcedimentos` (admin);
   catch-all "Consulta/Avaliação" se não configurado; UI de configuração
   = dependência cruzada (Configurações).
4. **Dois formatos de link:** `/agendar/[slug]` (escolhe profissional, ou
   direto se só um) e `/agendar/[slug]/[slug-profissional]` (pré-resolvido);
   `Profissional.slug` único por clínica; mesmo fluxo a partir do
   procedimento.
5. **Horários:** reutiliza o **núcleo** `ListarHorariosDisponiveisCore`
   (painel e link público); só slots livres — sem recalcular do zero.
6. **Abuso:** rate limit (IP + slug) + CAPTCHA na submissão + status
   `pendente`; WhatsApp (007) = fase 2.
7. **RBAC:** `ContextoAgendamentoPublico { clinicaId, canal:
   "link-publico", slug, profissionalSlug? }`; gates `Clinica.status =
   ativa` **e** `VerificarAcessoAtivo`; somente ler resumo/slots/menu e
   criar com `origem: link-publico`.
8. **Núcleo compartilhado (ajuste arquitetural):**
   `MarcarConsulta` / `ListarHorariosDisponiveis` = portas autenticadas
   (RBAC) que delegam a `MarcarConsultaCore` /
   `ListarHorariosDisponiveisCore`.
   `MarcarConsultaViaLinkPublico` /
   `ListarHorariosDisponiveisNoLinkPublico` = portas públicas que
   validam contexto público e delegam aos **mesmos** núcleos — nenhuma
   regra de sobreposição/disponibilidade duplicada.

### Plano do Implementador (checklist pós-red)

Além do green dos use cases e wiring de actions/rotas:

1. **Schema / constraints UNIQUE (obrigatório — não só checagem em app):**
   - `Clinica.slug`: coluna persistida + **`UNIQUE` global** no banco.
   - `Profissional.slug`: coluna persistida + **`UNIQUE (clinica_id, slug)`**
     (único por clínica, não globalmente).
   - Migrar adapters que hoje derivam slug do nome (fallback pré-migration)
     para ler/gravar a coluna real; gerar slug no cadastro com sufixo se
     colidir.
2. Tabela/persistência de `MenuPublicoProcedimento` + procedimento
   catch-all "Consulta/Avaliação" por clínica quando menu vazio.
3. Rate limit (IP + slug) e CAPTCHA na borda (actions/routes públicas).
4. `npm run db:generate` + `node scripts/migrate.mjs` após schema.
5. Test + lint verdes; commit + push antes da próxima feature.

**Pronto para o Engenheiro de Testes / Implementador.**
