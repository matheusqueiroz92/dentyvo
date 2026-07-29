# 004 — Odontograma (v2)

## Status
`aprovada` (fora do MVP atual da plataforma — v2; domínio/ports/stubs em
`src/core/odontograma`).

> **Modelo baseado em imagens de referência reais fornecidas pelo usuário
> (formato Universidade de Berna adaptado, e template odontograma
> multi-dentição); furca com classificação de Glickman ainda pendente de
> confirmação final com a dentista de referência antes da aprovação.**
> (A menção à furca/Glickman aplica-se ao periograma — feature 005; aqui
> registra-se a mesma nota de procedência das imagens, que cobrem ambas as
> features.)

## Contexto
Representação visual do estado de cada dente/face do paciente, usada em quase
toda consulta odontológica. É o maior diferencial visual frente a um sistema
genérico de prontuário.

A plataforma atenderá também clínicas com foco em atendimento infantil
(mesmo não sendo o perfil majoritário da clínica de referência). Por isso o
odontograma do MVP desta feature (v2) cobre **dentição permanente e
decídua** no mesmo modelo — sem cadastros distintos de paciente.

## User story
Como dentista, quero registrar e visualizar o estado de cada dente/face do
paciente (permanente ou decíduo), para acompanhar histórico de procedimentos
e planejar tratamento — inclusive em clínicas pediátricas.

## Decisões clínicas validadas

| # | Decisão | Valor |
|---|---|---|
| 1 | Numeração de dentes | **Padrão FDI por quadrante** (não Universal) |
| 2 | Dentição no MVP desta feature | **Permanente e decídua** no mesmo odontograma |
| 3 | Faixas FDI válidas | Permanente: **11–18, 21–28, 31–38, 41–48**; Decídua: **51–55, 61–65, 71–75, 81–85** |
| 4 | Paciente pediátrico | **Não** criar campo/tipo de paciente pediátrico — aceita qualquer `numeroDente` válido independentemente da idade |
| 5 | Faces registradas | **Todas** — vestibular, lingual/palatina, mesial, distal e oclusal (aplicáveis às duas dentições) |
| 6 | Histórico | **Append-only de eventos por face** (não snapshot completo) |
| 7 | Dente ausente | Estado no **nível do dente** (`ausente_extraido` / equivalente); sem estados de face individuais |
| 8 | RBAC | Mesma matriz da feature 003: `admin` + `dentista`; `recepcao` sem acesso |

### Justificativa — dentição decídua no MVP da feature
Clínicas infantis e pacientes em dentição mista precisam registrar dentes de
leite (FDI 51–85). Amarrar isso a um cadastro separado de “paciente
pediátrico” adiciona complexidade sem ganho clínico no MVP: a validação é
sobre o **número do dente**, não sobre a idade do paciente.

### Validação de domínio — `numeroDente`
- Aceita apenas números pertencentes aos dois conjuntos FDI acima.
- Rejeita qualquer valor fora desses conjuntos (ex.: 19, 50, 91, 00) com
  erro de domínio específico (ex.: `NumeroDenteInvalidoError`).
- Dentição mista (permanentes + decíduos no mesmo odontograma) é permitida
  — comum em crianças em transição.

### Catálogo inicial de estados (`EstadoOdontograma`)
Enum **extensível** (não hardcoded de forma rígida — novos valores podem
entrar sem quebrar o modelo). Catálogo inicial suficiente para modelar;
confirmação fina com a dentista de referência **antes do lançamento** (não
bloqueia aprovação desta spec nem o Arquiteto):

| Valor | Significado |
|---|---|
| `higido` | Hígido |
| `cariado` | Cariado |
| `restaurado` | Restaurado |
| `ausente_extraido` | Ausente / extraído (**nível do dente**) |
| `indicado_extracao` | Indicado para extração |
| `protese_coroa` | Prótese / coroa |
| `implante` | Implante |
| `fraturado` | Fraturado |
| `tratamento_endodontico` | Tratamento endodôntico |
| `selante` | Selante |

> Nomes canônicos no código: `higido`, `cariado`, `restaurado`,
> `ausente_extraido`, `indicado_extracao`, `protese_coroa`, `implante`,
> `fraturado`, `tratamento_endodontico`, `selante`.

### Versionamento — append-only de eventos por face
**Decisão:** trocar snapshot completo por modelo **APPEND-ONLY** de eventos
por face, no mesmo espírito da `Evolucao` da feature 003 (registros
imutáveis que se acumulam).

**Justificativa:** o odontograma muda **incrementalmente** por consulta
(tipicamente 1–2 faces por vez), não o dente inteiro de uma vez. Snapshot
completo a cada alteração seria redundante e caro; o histórico natural é
uma trilha de eventos.

Cada evento registra:
- `numeroDente`
- `face` (quando aplicável — ver dente ausente)
- `estadoNovo` (`EstadoOdontograma`)
- `procedimentoId` opcional (id opaco; sem validação cruzada obrigatória no MVP)
- `registradoEm`
- `profissionalId`

**Estado atual** de uma face = evento mais recente para a combinação
`numeroDente` + `face`. Histórico = sequência completa de eventos do
prontuário (filtrável por dente/face/data).

### Dente ausente
- Modelado como estado no **nível do dente** (`ausente_extraido`), **não**
  replicado em cada face.
- Dente marcado como ausente **não** deve ter estados de face individuais
  (invariante de domínio: eventos de face são rejeitados enquanto o dente
  estiver ausente; ou, ao marcar ausente, faces deixam de ser consultáveis
  como estado vigente).
- Retorno clínico (reimplante / novo dente no mesmo número — raro) = novo
  evento de nível de dente que remove o estado ausente e volta a permitir
  faces — detalhe de implementação no Arquiteto, desde que a invariante
  “ausente ⇒ sem faces vigentes” se mantenha.

## Critérios de aceite
- [ ] Representação de arcada com numeração **FDI por quadrante**, cobrindo
      permanente (11–48 nos quadrantes válidos) **e** decídua (51–85 nos
      quadrantes válidos).
- [ ] Validação de domínio rejeita `numeroDente` fora dos conjuntos FDI
      permanente e decídua.
- [ ] Não existe campo obrigatório de “paciente pediátrico”; qualquer
      paciente pode ter dentes permanentes e/ou decíduos válidos.
- [ ] Faces registráveis: vestibular, lingual/palatina, mesial, distal,
      oclusal — com estado independente via eventos.
- [ ] Catálogo inicial de `EstadoOdontograma` disponível como enum
      extensível (valores listados acima).
- [ ] Histórico é append-only: cada alteração cria um novo evento imutável
      (dente, face, estadoNovo, procedimentoId?, registradoEm,
      profissionalId, sequencia); estado atual = evento mais recente por
      dente+face, com desempate por `sequencia` (não por `id`).
- [ ] `salvarEventos` é atômico (tudo-ou-nada): falha em qualquer item do
      lote ⇒ nenhum evento do lote é persistido (transação no adapter).
- [ ] Dente ausente (`ausente_extraido`) é estado de **nível do dente**;
      sem estados de face individuais enquanto ausente.
- [ ] Eventos vinculados ao prontuário, com data e profissional responsável.
- [ ] Apenas `admin` e `dentista` da mesma clínica acessam; `recepcao` não.

## Regras de negócio
- Numeração segue exclusivamente o padrão FDI por quadrante (não Universal).
- `numeroDente` só é válido se pertencer a:
  - permanente: `{11–18, 21–28, 31–38, 41–48}`, ou
  - decídua: `{51–55, 61–65, 71–75, 81–85}`.
- Eventos são imutáveis (sem `UPDATE`/`DELETE` do histórico).
- Estado vigente de face = último evento para aquele `numeroDente`+`face`,
  ordenado por (`registradoEm`, `sequencia`) — não por `id` UUID.
- `sequencia` é bigserial atribuída na persistência; `null` só pré-insert.
- `salvarEventos` é atômico (tudo-ou-nada) em transação explícita no adapter.
- Dente com estado de nível `ausente_extraido` não possui faces com estado
  vigente.
- Isolamento multi-tenant e vínculo ao `Prontuario` (padrão 003/006).
- `procedimentoId` no evento é opcional e opaco no MVP.

## Matriz de permissões (odontograma)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Registrar evento(s) de odontograma | sim | sim | não |
| Consultar estado vigente | sim | sim | não |
| Listar histórico de eventos | sim | sim | não |

## Modelo de domínio envolvido
`Odontograma` (agregado/visão sobre eventos), `EventoOdontograma`,
`EstadoOdontograma` (enum extensível); consome `Prontuario` / profissional
via ports — alinhar `specs/02-domain-model.md` após aprovação.

### Estrutura conceitual (alto nível — sem schema de banco)
```
EventoOdontograma          // append-only, imutável
  id
  clinicaId
  prontuarioId
  numeroDente              // FDI válido (permanente OU decídua)
  nivel                    // face | dente
  face?                    // vestibular | lingual_palatina | mesial | distal | oclusal
                           // (obrigatória se nivel = face; ausente se nivel = dente)
  estadoNovo               // EstadoOdontograma (enum extensível)
  procedimentoId?          // opaco, opcional
  registradoEm
  profissionalId
  sequencia                // bigserial (null só pré-persistência); desempate
                           // monotônico após registradoEm — não usar id UUID

// Ordenação / estado vigente:
//   ordenar por (registradoEm ASC, sequencia ASC)
//   por (numeroDente, face) → último EventoOdontograma com nivel = face
//   por numeroDente (ausência etc.) → último EventoOdontograma com nivel = dente

// Persistência:
//   salvarEventos(lote) atômico (tudo-ou-nada) em transação explícita
```

## Casos de uso (application layer)
- `RegistrarEventosOdontograma({ prontuarioId, eventos[] }, contexto: ContextoSessao) → EventoOdontograma[]`
  — `profissionalId` = sessão; um ou mais eventos no mesmo registro
  (ex.: 1–2 faces na consulta).
- `ConsultarOdontogramaVigente({ prontuarioId }, contexto) → visão agregada`
  — deriva estado atual a partir do último evento por dente/face.
- `ListarHistoricoOdontograma({ prontuarioId, filtros? }, contexto) → EventoOdontograma[]`
  — ordenado por `registradoEm` (filtros opcionais: dente, face, intervalo).

## Ports necessárias
- `OdontogramaRepositoryPort` — append de eventos + leitura para projeção
  vigente e histórico.
- Consumo (leitura): `ProntuarioRepositoryPort` (003); sessão/auth (001).

## Contrato de API / Server Action (se aplicável)
Server actions clínicas (padrão next-safe-action + Zod), escopadas por
`ContextoSessao` — detalhar payloads no Arquiteto após aprovação.

## Fora de escopo
- Numeração Universal (sistema norte-americano).
- Campo/tipo “paciente pediátrico” ou cadastro duplicado por faixa etária.
- Snapshot completo do odontograma a cada alteração (substituído por
  append-only de eventos).
- Renderização gráfica interativa avançada (estrutura de dados + UI
  simples primeiro; mapa visual rico depois).
- Integração automática odontograma ↔ periograma (além da numeração FDI
  compartilhada).
- Fechamento definitivo do catálogo de estados com a dentista (refino pré-
  lançamento; enum já modelável e extensível).

## Plano de testes
- **Domínio:** validação de `numeroDente`; enum de estados; invariante
  ausente ⇒ sem faces vigentes; rejeição de numeração inválida; estado
  vigente = último evento por dente+face.
- **Aplicação:** append de eventos com profissional da sessão; projeção
  vigente; histórico ordenado; isolamento por `clinicaId`; RBAC
  (recepção negada).
- **Integração:** adapter de repositório (quando existir).
- **Contrato/e2e:** fluxo crítico de registro/consulta no prontuário
  (quando UI existir).

## Dependências
003 (prontuário — padrão de imutabilidade/append e RBAC). Numeração FDI
compartilhada com 005 (periograma).

## Pendências

Nenhuma pendência bloqueante para aprovação desta spec.

- Catálogo de estados: lista inicial acima é suficiente para modelar;
  confirmação fina com a dentista fica para **antes do lançamento**, sem
  bloquear Arquiteto.
- Furca/Glickman: escopo da feature **005**, não desta.

**Spec aprovada.** Domínio, ports e stubs de use case em
`src/core/odontograma`. Próximo passo: Engenheiro de Testes (red).
