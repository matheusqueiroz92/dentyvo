# 003 — Prontuário Eletrônico e Anamnese Digital

## Status
`aprovada`

## Contexto
Substitui a ficha de papel do paciente. É o registro clínico central, com
auditoria obrigatória por ser dado de saúde (LGPD).

Reaproveita `ContextoSessao` e isolamento por `clinicaId` da feature 001
(`src/core/auth`) — **sem modificar** o módulo de auth. `Paciente` é entregue
pelo módulo `core/paciente` (feature 002, em paralelo); esta feature consome
via port e não implementa cadastro de paciente.

## User story
Como dentista, quero preencher a anamnese e registrar evoluções do paciente
digitalmente, para ter histórico completo e acessível sem depender de papel.

## Critérios de aceite
- [ ] Cada paciente tem um prontuário único por clínica, criado via
      `CriarProntuario(pacienteId)` (no cadastro ou no primeiro atendimento —
      o gatilho de UI fica na delivery; o domínio garante unicidade
      paciente+clínica).
- [ ] Anamnese é um formulário estruturado com **4 seções obrigatórias**
      (`historicoMedico`, `alergias`, `medicacoesEmUso`,
      `condicoesPreexistentes`), cada uma com texto livre e/ou flags
      (ex.: “nega” / “nada a declarar”), vinculada ao prontuário.
- [ ] Checklist clínico específico (HAS, diabetes, anticoagulação, gestação,
      etc.) **não** faz parte do MVP — fica para validação com profissional
      de odontologia antes do lançamento (Onda 3 do plano de execução).
- [ ] Cada atendimento gera uma "evolução" (registro datado, vinculado ao
      profissional e, se aplicável, a um `procedimentoId` opaco).
- [ ] Evolução não pode ser apagada nem editada in-place; retificação cria
      novo registro ligado ao original (no máximo **uma** retificação por
      evolução original no MVP).
- [ ] Anamnese versionada por **snapshot completo**: cada atualização cria
      nova versão imutável; versões anteriores permanecem consultáveis.
- [ ] Todo acesso de leitura/escrita a um prontuário específico
      (`ConsultarProntuario` e casos de escrita clínica) é registrado em
      log de auditoria (quem, quando, o quê). Listagens/buscas **não**
      geram log no MVP.
- [ ] Apenas `admin` e `dentista` da mesma clínica do paciente acessam o
      prontuário clínico; `recepcao` não tem acesso. Tentativa cross-tenant
      ou sem permissão falha e gera log `acesso_negado`.

## Regras de negócio
- Um paciente tem no máximo um `Prontuario` por `clinicaId`.
- Anamnese pode ser atualizada ao longo do tempo, mas nunca sobrescreve a
  versão anterior: cada edição gera um novo snapshot completo (`versao`
  sequencial). Versão vigente = maior `versao` do prontuário.
- Nova versão de anamnese e demais escritas clínicas só por `admin` ou
  `dentista` da clínica dona do prontuário.
- Evolução, uma vez registrada, é imutável (sem `DELETE`, sem `UPDATE` do
  texto). Retificação = nova `Evolucao` com `tipo: retificacao`, apontando
  para a original via `evolucaoRetificadaId`, com `motivoRetificacao`
  obrigatório. No MVP: **no máximo uma retificação por evolução original**;
  não se retifica uma retificação.
- `procedimentoId` na evolução é id opaco opcional — no MVP não se valida
  existência contra o módulo de agendamento.
- Isolamento multi-tenant: toda leitura/escrita escopada por `clinicaId` da
  sessão; nunca confiar só em filtro de UI.
- Log de auditoria (`detalhe`) **nunca** contém texto clínico (descrição de
  evolução, conteúdo de anamnese) — apenas metadados e IDs (minimização LGPD).

## Matriz de permissões (prontuário clínico)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Consultar prontuário completo | sim | sim | não |
| Criar prontuário | sim | sim | não |
| Preencher / atualizar anamnese | sim | sim | não |
| Listar versões / obter versão vigente | sim | sim | não |
| Registrar evolução | sim | sim | não |
| Retificar evolução | sim | sim | não |
| Obter evoluções do prontuário | sim | sim | não |

## Modelo de domínio envolvido
`Prontuario`, `Evolucao`, `Anamnese`; consome `Paciente` (módulo
`core/paciente`, feature 002) via port — não cria/edita paciente aqui.

### Estrutura de módulos
- `src/core/prontuario` — `Prontuario`, `Evolucao`, consulta, auditoria
  (`AuditoriaLogPort`), criação e listagem de evoluções.
- `src/core/anamnese` — formulário estruturado, versionamento por snapshot,
  preenchimento/atualização e listagem de versões.

> **Nota de decisão (Arquiteto / Planejador) — por que dois módulos, e não
> um só `prontuario`:**
>
> Critério principal: **donos de ciclo de vida distintos** (limites de
> agregado / SRP no sentido de responsabilidade de evolução do modelo), não
> só “pastas menores”.
>
> 1. **Ciclo de vida diferente** — `Evolucao` é append-only + retificação
>    (no máximo uma por original); `Anamnese` é versionada por **snapshot
>    completo** (cada edição = nova versão imutável, vigente = maior
>    `versao`). Misturar as duas políticas no mesmo módulo/repositório
>    tende a vazar regras de um no outro.
> 2. **SRP de domínio** — prontuário cuida do registro clínico do paciente
>    (identidade do prontuário, evoluções, auditoria de acesso); anamnese
>    cuida do formulário estruturado e do histórico de versões. São
>    capacidades clínicas distintas, com casos de uso e erros próprios.
> 3. **Dependências futuras** — receituário, odontograma e periograma
>    (v2) dependem do **prontuário**, não do formulário de anamnese.
>    Manter anamnese isolada evita que esses módulos puxem versionamento
>    de formulário sem precisar.
> 4. **Alinhamento com a arquitetura** — `specs/01-architecture.md` e o
>    plano de execução (Onda 1) já listam `core/prontuario` e
>    `core/anamnese` separados; a implementação segue esse mapa.
>
> **Por que `anamnese` depende de `ProntuarioRepositoryPort`:** a anamnese
> é sempre vinculada a um prontuário existente da mesma clínica. O módulo
> de anamnese **não** é dono do prontuário — só consulta/valida existência
> e tenant via a port do módulo dono (mesmo padrão de cross-module de
> `agendamento` → `PacienteRepositoryPort`). Assim a Dependency Rule
> permanece: anamnese (application) depende de uma abstração do
> prontuário, sem importar adapters nem regras de evolução/auditoria.

### Anamnese — seções MVP (`respostas`)
Cada seção é obrigatória e aceita texto livre e/ou flags (ex. negação):

| Seção | Obrigatória |
|---|---|
| `historicoMedico` | sim |
| `alergias` | sim |
| `medicacoesEmUso` | sim |
| `condicoesPreexistentes` | sim |

Campos clínicos específicos além dessas seções: **a validar com profissional
de odontologia antes do lançamento** (Onda 3).

### Evolucao — retificação
- `tipo`: `registro` \| `retificacao`
- Se `retificacao`: `evolucaoRetificadaId` (obrigatório) + `motivoRetificacao`
  (obrigatório); a evolução alvo deve ser `tipo: registro` e ainda não
  retificada.
- Campos comuns: `profissionalId`, `descricao`, `registradoEm`,
  `procedimentoId?`

### Auditoria — evento mínimo
Tabela em arquivo próprio `src/db/schema/auditoria-log.ts` (não editar
`db/schema/index.ts` nesta feature; merge do índice depois). Port dona no
módulo `prontuario` (reaproveitada pela 009).

| Campo | Obrigatório | Notas |
|---|---|---|
| `id` | sim | |
| `clinicaId` | sim no MVP | nullable só entra com `UsuarioPlataforma` (009) |
| `atorUsuarioId` | sim | da sessão |
| `atorProfissionalId` | sim no MVP | da sessão |
| `acao` | sim | `leitura` \| `escrita` \| `acesso_negado` |
| `recursoTipo` | sim | `prontuario` \| `anamnese` \| `evolucao` |
| `recursoId` | sim | |
| `pacienteId` | quando conhecido | facilita trilha |
| `ocorridoEm` | sim | timestamp servidor |
| `detalhe` | opcional | só metadados/IDs (ex. `versaoAnamnese`); **sem PHI clínico** |

Quando logar: `ConsultarProntuario` (sempre `leitura` em sucesso); escritas
clínicas (`escrita`); tentativas negadas (`acesso_negado`). Não logar
listagens/buscas no MVP.

## Casos de uso (application layer)
- `CriarProntuario(pacienteId) → Prontuario`  
  (valida paciente via `PacienteRepositoryPort`; escopo `clinicaId` da sessão)
- `PreencherAnamnese(prontuarioId, respostas) → Anamnese`  
  (primeira versão / snapshot inicial)
- `AtualizarAnamnese(prontuarioId, respostas) → Anamnese`  
  (nova versão snapshot; não sobrescreve a anterior)
- `ListarVersoesAnamnese(prontuarioId) → Anamnese[]`
- `ObterVersaoVigenteAnamnese(prontuarioId) → Anamnese | null`
- `RegistrarEvolucao(prontuarioId, descricao, procedimentoId?) → Evolucao`
- `RetificarEvolucao(evolucaoId, descricao, motivoRetificacao) → Evolucao`
- `ObterEvolucoesDoProntuario(prontuarioId) → Evolucao[]`
- `ConsultarProntuario(prontuarioId) → Prontuario`  
  (sempre registra auditoria de leitura)

Identidade do ator (`usuarioId` / `profissionalId` / `clinicaId` / `papel`)
vem de `ContextoSessao` (001), não de parâmetros soltos de “solicitante”
quando a delivery já autenticou.

## Ports necessárias
- `ProntuarioRepositoryPort`
- `AnamneseRepositoryPort`
- `EvolucaoRepositoryPort` (ou agregada em `ProntuarioRepositoryPort`, a
  critério do Arquiteto de Domínio)
- `AuditoriaLogPort`
- `PacienteRepositoryPort` (consumida de `core/paciente` / feature 002; nos
  testes desta feature, fake/stub até o merge — não bloqueia o Implementador)

## Contrato de API / Server Action (se aplicável)
Delivery (rotas/actions) fica fora do escopo desta aprovação de domínio;
quando implementada: validação Zod na borda + chamada aos use-cases acima,
sempre com sessão 001. Sem regra de negócio na action.

## Fora de escopo
- Odontograma e periograma (features 004 e 005, v2).
- Anexos de exames/imagens (v2).
- Cadastro/edição de `Paciente` (feature 002 / `core/paciente`).
- Checklist clínico detalhado além das 4 seções (Onda 3 — validar com
  profissional de odontologia).
- Encadeamento de retificação sobre retificação (revisitar se surgir
  necessidade real).
- Log de auditoria em listagens/buscas de pacientes.
- Validação de existência de `procedimentoId` contra agendamento.
- Alterações em `src/core/auth`.

## Plano de testes
- Domínio: evolução imutável; retificação válida; segunda retificação da
  mesma original rejeitada; retificar retificação rejeitada; anamnese gera
  nova versão sem apagar a anterior; seções obrigatórias.
- Aplicação: `ConsultarProntuario` sempre gera auditoria de leitura;
  escritas geram `escrita`; cross-tenant / `recepcao` geram
  `acesso_negado` sem vazar dado; `detalhe` do log sem texto clínico;
  `CriarProntuario` com fake de `PacienteRepositoryPort`.
- Integração: adapters respeitam `clinicaId`; tabela de auditoria em
  schema próprio.

## Dependências
- 001 (auth multi-tenant) — **aprovada / implementada**.
- 002 (`core/paciente`) — consumo via port; integração real no merge das
  ondas; fake/stub nos testes desta feature até lá.
