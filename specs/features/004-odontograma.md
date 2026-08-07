# 004 — Odontograma (v2)

## Status
`aprovada` — **emenda de modelo (estados por face × dente inteiro)
pronta para o Arquiteto de Domínio**. Fora do MVP atual da plataforma
(v2); domínio/ports já existem em `src/core/odontograma` e devem ser
**revisitados** pelo Arquiteto para alinhar esta emenda (stubs /
`CasoDeUsoNaoImplementadoError` onde a orquestração mudar).

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
| 6 | Histórico | **Append-only de eventos** por face **ou** por dente (não snapshot completo) |
| 7 | Estados de dente inteiro | Cinco estados no **nível do dente** (`ausente_extraido`, `implante`, `indicado_extracao`, `protese_coroa`, `tratamento_endodontico`): mutuamente exclusivos entre si e com faces **enquanto vigentes**; ao registrar um, limpa faces anteriores (padrão `ausente_extraido`) |
| 8 | Conflito de dente inteiro | Dois estados de dente inteiro **diferentes** no mesmo dente (mesmo lote ou lotes distintos com vigente anterior) → **rejeição** com erro de domínio (`EstadoDenteInteiroConflitanteError`), sem sobrescrita silenciosa |
| 9 | Retorno a faces | Registrar um estado **por face** num dente com estado de dente inteiro vigente **encerra** esse estado automaticamente (projeção: evento de face mais recente; sem caso de uso / evento dedicado de “desmarcar”) |
| 10 | RBAC | Mesma matriz da feature 003: `admin` + `dentista`; `recepcao` sem acesso |

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
entrar sem quebrar o modelo). Catálogo inicial **dividido em duas
categorias** (a categoria define nível e invariantes; não é só rótulo
de UI). Confirmação fina com a dentista de referência **antes do
lançamento** (não bloqueia esta emenda nem o Arquiteto).

#### ESTADOS POR FACE
Aplicam-se a **uma face** do dente (`nivel = face`). Podem **coexistir**
entre si: cada uma das 5 faces (vestibular, lingual/palatina, mesial,
distal, oclusal) tem no máximo um estado vigente independente.

| Valor | Significado |
|---|---|
| `higido` | Hígido |
| `cariado` | Cariado |
| `restaurado` | Restaurado |
| `fraturado` | Fraturado |
| `selante` | Selante |

#### ESTADOS DE DENTE INTEIRO
Aplicam-se ao **dente como um todo** (`nivel = dente`), **não** a uma
face isolada. São **mutuamente exclusivos** entre si e com qualquer
estado por face simultâneo no mesmo dente.

| Valor | Significado |
|---|---|
| `ausente_extraido` | Ausente / extraído |
| `implante` | Implante |
| `indicado_extracao` | Indicado para extração |
| `protese_coroa` | Prótese / coroa |
| `tratamento_endodontico` | Tratamento endodôntico |

> Nomes canônicos no código (união das duas categorias): `higido`,
> `cariado`, `restaurado`, `fraturado`, `selante`, `ausente_extraido`,
> `implante`, `indicado_extracao`, `protese_coroa`,
> `tratamento_endodontico`.

> **Invariante de catálogo:** estado por face **só** em `nivel = face`;
> estado de dente inteiro **só** em `nivel = dente`. Registrar o valor
> na categoria errada → erro de domínio específico (ex.:
> `EstadoIncompativelComNivelError`).

### Versionamento — append-only de eventos
**Decisão:** trocar snapshot completo por modelo **APPEND-ONLY** de eventos
(por face ou por dente inteiro), no mesmo espírito da `Evolucao` da
feature 003 (registros imutáveis que se acumulam).

**Justificativa:** o odontograma muda **incrementalmente** por consulta
(tipicamente 1–2 faces, ou um estado de dente inteiro). Snapshot completo
a cada alteração seria redundante e caro; o histórico natural é uma
trilha de eventos.

Cada evento registra:
- `numeroDente`
- `nivel` (`face` | `dente`) e `face` (obrigatória se `nivel = face`;
  ausente se `nivel = dente`)
- `estadoNovo` (`EstadoOdontograma` — valor compatível com o `nivel`)
- `procedimentoId` opcional (id opaco; sem validação cruzada obrigatória no MVP)
- `registradoEm`
- `profissionalId`

**Estado atual** de uma face = evento mais recente para a combinação
`numeroDente` + `face` (`nivel = face`) que seja **posterior** ao último
evento de dente inteiro daquele dente (se houver). Histórico = sequência
completa de eventos do prontuário (filtrável por dente/face/data).

### Estados de dente inteiro (inclui `ausente_extraido`)
Generaliza a regra que já existia só para dente ausente a **todos** os
cinco estados da categoria **ESTADOS DE DENTE INTEIRO**.

**Ao registrar** um estado de dente inteiro para um `numeroDente`:
1. O evento é persistido com `nivel = dente` (não como cinco eventos de
   face).
2. Qualquer estado vigente das **5 faces** daquele dente deixa de ser
   consultável como vigente — o dente passa a ser representado pelo
   **estado único** de dente inteiro (mesmo padrão já usado para
   `ausente_extraido`). Na projeção vigente: faces vazias / sem estado
   de face; `estadoDente` = o estado de dente inteiro.
3. Esse estado permanece vigente **até** ser encerrado pela regra
   simétrica abaixo (ou substituído pelo **mesmo** estado de dente
   inteiro em novo append — sem conflito).

**Conflito entre estados de dente inteiro (obrigatório):**
- Se o dente já tem estado de dente inteiro vigente **A** e o lote tenta
  registrar estado de dente inteiro **B** com `A ≠ B` → rejeitar com
  `EstadoDenteInteiroConflitanteError` (não sobrescrever silenciosamente).
- Se o **mesmo lote** contém dois (ou mais) estados de dente inteiro
  **diferentes** para o mesmo `numeroDente` → rejeitar com o mesmo erro
  (tudo-ou-nada do lote).
- Re-registrar o **mesmo** estado de dente inteiro já vigente (ex.:
  `implante` de novo) é permitido: append do evento; faces continuam
  limpas; não há conflito.

**Retorno clínico / encerramento automático (simétrico — resolvido):**
Registrar um estado **POR FACE** num dente que tem estado de dente
inteiro vigente **encerra** esse estado automaticamente. Não há caso de
uso nem evento dedicado de “desmarcar” / “encerrar dente inteiro”.

- Mecanismo: o novo evento `nivel = face` é append-only e, sendo mais
  recente que o último `nivel = dente` daquele `numeroDente`, a projeção
  vigente deixa de tratar o estado de dente inteiro como vigente e volta
  ao acompanhamento por face.
- Exemplo: dente com `indicado_extracao` vigente + novo evento
  oclusal=`restaurado` → `estadoDente` deixa de ser vigente;
  oclusal vigente = `restaurado`; demais faces sem evento pós-dente-inteiro
  permanecem sem registro na projeção (modelo sparse — ver
  `specs/02-domain-model.md`). Sem ação prévia de desmarcar.
- Aplica-se a **todos** os ESTADOS DE DENTE INTEIRO (incluindo
  `ausente_extraido`).
- No mesmo lote, a ordem de processamento conta: dente inteiro depois
  face no mesmo dente → face encerra; face(s) depois dente inteiro →
  dente inteiro limpa faces anteriores do lote e fica vigente.
- Eventos de dente inteiro **anteriores** permanecem no histórico
  imutável; só deixam de ser o vigente.

> UI: o dentista pode *parecer* escolher um estado de dente inteiro
> “numa face” do mapa; a delivery/application deve normalizar para
> `nivel = dente` (um evento), nunca gravar o valor de dente inteiro em
> `nivel = face`.

## Critérios de aceite
- [ ] Representação de arcada com numeração **FDI por quadrante**, cobrindo
      permanente (11–48 nos quadrantes válidos) **e** decídua (51–85 nos
      quadrantes válidos).
- [ ] Validação de domínio rejeita `numeroDente` fora dos conjuntos FDI
      permanente e decídua.
- [ ] Não existe campo obrigatório de “paciente pediátrico”; qualquer
      paciente pode ter dentes permanentes e/ou decíduos válidos.
- [ ] Faces registráveis: vestibular, lingual/palatina, mesial, distal,
      oclusal — com estado independente via eventos **por face**.
- [ ] Catálogo `EstadoOdontograma` dividido em **ESTADOS POR FACE**
      (`higido`, `cariado`, `restaurado`, `fraturado`, `selante`) e
      **ESTADOS DE DENTE INTEIRO** (`ausente_extraido`, `implante`,
      `indicado_extracao`, `protese_coroa`, `tratamento_endodontico`);
      enum extensível; valor incompatível com o `nivel` é rejeitado.
- [ ] Estados por face **coexistem** livremente entre si: faces distintas
      do mesmo dente podem ter estados vigentes diferentes ao mesmo tempo.
- [ ] Ao registrar um estado de **DENTE INTEIRO**, o dente passa a ser
      representado por esse estado único: estados de face **anteriores**
      daquele dente deixam de vigorar (mesmo padrão de `ausente_extraido`).
- [ ] Ao registrar um estado **POR FACE** num dente com estado de dente
      inteiro vigente, esse estado de dente inteiro **encerra
      automaticamente** (projeção: face mais recente; sem “desmarcar”
      prévio nem evento/caso de uso dedicado). Ex.: `indicado_extracao`
      vigente + oclusal=`restaurado` → dente volta ao acompanhamento por
      face; `indicado_extracao` deixa de ser vigente.
- [ ] Dois estados de DENTE INTEIRO **diferentes** no mesmo dente — no
      mesmo lote **ou** em lotes distintos quando já houver vigente —
      são **rejeitados** com `EstadoDenteInteiroConflitanteError` (sem
      sobrescrita silenciosa do anterior).
- [ ] Re-registrar o **mesmo** estado de dente inteiro já vigente é
      permitido (append; sem conflito).
- [ ] Histórico é append-only: cada alteração cria um novo evento imutável
      (dente, nivel, face?, estadoNovo, procedimentoId?, registradoEm,
      profissionalId, sequencia); projeção vigente por
      (`registradoEm`, `sequencia`) — não por `id`.
- [ ] `salvarEventos` é atômico (tudo-ou-nada): falha em qualquer item do
      lote ⇒ nenhum evento do lote é persistido (transação no adapter).
- [ ] Eventos vinculados ao prontuário, com data e profissional responsável.
- [ ] Apenas `admin` e `dentista` da mesma clínica acessam; `recepcao` não.

## Regras de negócio
- Numeração segue exclusivamente o padrão FDI por quadrante (não Universal).
- `numeroDente` só é válido se pertencer a:
  - permanente: `{11–18, 21–28, 31–38, 41–48}`, ou
  - decídua: `{51–55, 61–65, 71–75, 81–85}`.
- Eventos são imutáveis (sem `UPDATE`/`DELETE` do histórico).
- Projeção vigente por dente (ordem `registradoEm`, `sequencia`):
  - se o último evento relevante do dente for `nivel = dente` →
    `estadoDente` vigente e faces sem vigente;
  - se existir evento `nivel = face` **mais recente** que o último
    `nivel = dente` → estado de dente inteiro **não** vigente; faces
    vigentes = últimos eventos de face **posteriores** a esse dente
    inteiro (modelo sparse: face sem evento pós-dente-inteiro não
    materializa `higido` no domínio).
- `sequencia` é bigserial atribuída na persistência; `null` só pré-insert.
- `salvarEventos` é atômico (tudo-ou-nada) em transação explícita no adapter.
- Estados por face e de dente inteiro seguem as categorias do catálogo;
  misturar valor e `nivel` incompatíveis é erro de domínio.
- Estados por face podem coexistir (um vigente por face, faces
  independentes) quando o dente está em modo por face.
- Registrar estado de dente inteiro **limpa** faces vigentes anteriores;
  registrar face **encerra** dente inteiro vigente (simetria; sem
  rejeição de face por “dente inteiro ativo”).
- Dois estados de dente inteiro diferentes no mesmo dente
  (lote atual e/ou vigente persistido) → `EstadoDenteInteiroConflitanteError`.
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
`EstadoOdontograma` (enum extensível com duas categorias), erros de
domínio (`NumeroDenteInvalidoError`, `EstadoDenteInteiroConflitanteError`,
`EstadoIncompativelComNivelError` ou equivalente); consome `Prontuario` /
profissional via ports — alinhar `specs/02-domain-model.md` após o
Arquiteto aplicar esta emenda.

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
  estadoNovo               // EstadoOdontograma (compatível com nivel/categoria)
  procedimentoId?          // opaco, opcional
  registradoEm
  profissionalId
  sequencia                // bigserial (null só pré-persistência); desempate
                           // monotônico após registradoEm — não usar id UUID

// Categorias de estadoNovo:
//   POR FACE: higido | cariado | restaurado | fraturado | selante
//   DENTE INTEIRO: ausente_extraido | implante | indicado_extracao |
//                  protese_coroa | tratamento_endodontico

// Ordenação / estado vigente (por numeroDente):
//   ordenar eventos do dente por (registradoEm ASC, sequencia ASC)
//   seja T = último evento com nivel = dente (se existir)
//   se não há evento nivel = face posterior a T
//     → estadoDente = estado de T; faces sem vigente
//   senão (há face posterior a T, ou nunca houve T)
//     → estadoDente não vigente (null na projeção)
//     → faces vigentes = último evento nivel = face por face,
//       considerando só eventos posteriores a T (se T existir)

// Conflitos (domínio):
//   dois estados de dente inteiro diferentes no mesmo numeroDente
//     enquanto o primeiro ainda vigente → EstadoDenteInteiroConflitanteError
//   valor de categoria incompatível com nivel
//     → EstadoIncompativelComNivelError (ou equivalente)
//   NÃO rejeitar face por existir dente inteiro vigente — face encerra

// Persistência:
//   salvarEventos(lote) atômico (tudo-ou-nada) em transação explícita
```

## Casos de uso (application layer)
- `RegistrarEventosOdontograma({ prontuarioId, eventos[] }, contexto: ContextoSessao) → EventoOdontograma[]`
  — `profissionalId` = sessão; um ou mais eventos no mesmo registro
  (ex.: 1–2 faces na consulta).
- `ConsultarOdontogramaVigente({ prontuarioId }, contexto) → visão agregada`
  — deriva estado atual pela recência: `estadoDente` vigente só se não
  houver face posterior ao último evento de dente; senão faces vigentes
  (pós-dente-inteiro).
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
- Caso de uso ou evento dedicado de “encerrar / desmarcar estado de dente
  inteiro” — o retorno a faces é só o append de evento por face mais
  recente (projeção).
- Renderização gráfica interativa avançada (estrutura de dados + UI
  simples primeiro; mapa visual rico depois).
- Integração automática odontograma ↔ periograma (além da numeração FDI
  compartilhada).
- Fechamento definitivo do catálogo de estados com a dentista (refino pré-
  lançamento; enum já modelável e extensível).

## Plano de testes
- **Domínio:**
  - validação de `numeroDente`; rejeição de numeração inválida;
  - catálogo nas duas categorias; valor incompatível com `nivel`;
  - estados por face coexistem (ex.: vestibular `cariado` + oclusal
    `restaurado` no mesmo dente);
  - um estado de dente inteiro aplicado limpa/anula vigentes de face
    **anteriores** daquele dente (cobrir pelo menos `ausente_extraido` e
    um outro, ex. `implante` / `protese_coroa`);
  - dente com dente inteiro vigente (ex. `indicado_extracao`) + evento
    de face posterior (ex. oclusal=`restaurado`) → dente inteiro **deixa
    de ser vigente**; face registrada vigora; **sem** rejeição e **sem**
    evento de “desmarcar”;
  - mesmo cenário no **mesmo lote** (ordem: dente inteiro, depois face)
    e em **lotes distintos** (vigente persistido + novo registro de face);
  - dois estados de dente inteiro **diferentes** no mesmo dente no
    **mesmo lote** → `EstadoDenteInteiroConflitanteError`; lote atômico
    (nada persiste);
  - dente com dente inteiro vigente A + lote com B ≠ A → mesmo erro;
  - após face encerrar A, registrar B (outro dente inteiro) → permitido;
  - re-registro do **mesmo** estado de dente inteiro → permitido;
  - estado vigente / projeção = regras de recência acima.
- **Aplicação:** append de eventos com profissional da sessão; projeção
  vigente refletindo limpeza de faces, encerramento por face e conflitos;
  histórico ordenado; isolamento por `clinicaId`; RBAC (recepção negada).
- **Integração:** adapter de repositório (quando existir).
- **Contrato/e2e:** fluxo crítico de registro/consulta no prontuário
  (quando UI existir) — UI deve mapear estados de dente inteiro para
  `nivel = dente`.

## Dependências
003 (prontuário — padrão de imutabilidade/append e RBAC). Numeração FDI
compartilhada com 005 (periograma).

## Pendências

Nenhuma pendência bloqueante para o Arquiteto.

- Catálogo de estados: lista inicial acima é suficiente para modelar;
  confirmação fina com a dentista fica para **antes do lançamento**, sem
  bloquear Arquiteto.
- Furca/Glickman: escopo da feature **005**, não desta.
- Alinhar `specs/02-domain-model.md` na passagem do Arquiteto (categorias
  face × dente inteiro; projeção com encerramento simétrico por face;
  ausência de evento ≠ `higido` no domínio — já parcialmente documentado).

**Spec aprovada e pronta para o Arquiteto.** Próximo passo: Arquiteto de
Domínio atualizar entidades/ports/assinaturas em `src/core/odontograma`
(corpo de use case = stub `CasoDeUsoNaoImplementadoError` onde a
orquestração mudar). Em seguida Engenheiro de Testes (red) e
Implementador (green).
