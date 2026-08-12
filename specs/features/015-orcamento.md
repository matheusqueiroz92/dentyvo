# 015 — Orçamento

## Status
`aprovada` — pronta para o Arquiteto de Domínio

## Contexto
Clínicas odontológicas precisam registrar propostas de tratamento com valores
antes de o paciente aceitar (ou recusar) o plano. Hoje isso costuma viver em
planilha, papel ou WhatsApp — sem vínculo ao prontuário, sem snapshot de preço
e sem atalho para agendar o que foi aceito.

Persona principal: equipe da clínica (comercial + clínico) que monta a
proposta e registra a decisão do paciente. O paciente **não** tem login no
MVP (portal do paciente = v2).

## User story
Como profissional da clínica, quero emitir um orçamento vinculado ao
prontuário com itens (procedimento + valor ajustável) e acompanhar o status
(enviado → aceito/recusado), para formalizar a proposta comercial, gerar PDF
para o paciente e, quando aceito, agendar os procedimentos com atalho a
partir do orçamento — sem criar consulta automaticamente.

## Decisões aprovadas

| # | Tema | Decisão |
|---|---|---|
| 1 | Vínculo do item | Cada item referencia um `Procedimento` cadastrado da clínica; nome e valor padrão do cadastro entram como **sugestão** na criação |
| 2 | Snapshot de valor | O valor do item é **próprio do orçamento** (editável na criação). Mudança posterior no `Procedimento.valor` **não** altera orçamentos já emitidos — mesmo princípio de `SnapshotCabecalhoDocumento` |
| 3 | Snapshot de nome | Nome do procedimento também é snapshotado no item (rótulo congelado no documento) |
| 4 | Aceite ≠ agendamento | Aceitar o orçamento **não** cria `Agendamento` automaticamente; apenas habilita fluxo/atalho de “agendar itens deste orçamento” |
| 5 | Cabeçalho | Reutilizar `SnapshotCabecalhoDocumento` (mesmo contrato de Receita/Atestado) |
| 6 | Vínculo clínico | Orçamento vinculado a `Prontuario`; `profissionalId` responsável = sessão (nunca no input de negócio) |
| 7 | Conteúdo vs status | **Diferente** de Receita/Atestado: o orçamento **pode mudar de status** ao longo do tempo. O que fica congelado após emissão é o **conteúdo dos itens** (e o cabeçalho); só o status transiciona. Isso **não** viola o espírito de snapshot — não confundir com imutabilidade total de Receita/Atestado |
| 8 | Quem registra decisão | Só a **equipe da clínica** registra aceite/recusa em nome do paciente. Sem portal / paciente logado no MVP |
| 9 | Validade (`validoAte`) | Campo **opcional** `validoAte` (data civil), definido pelo emissor na criação — **puramente informativo**. Exibido no PDF (“Válido até DD/MM/AAAA”) e na listagem da UI. **Não** dispara transição automática de status; **não** exige job/cron. Se a data passar, o status permanece até a equipe aceitar/recusar manualmente. **Sem** status `expirado` no MVP |
| 10 | RBAC | **admin + dentista + recepção** emitem, listam, registram decisão e geram PDF. Atalho de agendamento segue RBAC da feature 002 |
| 11 | PDF | Sim — sob demanda via `GeradorPdfPort` / `pdf-lib`, sem blob persistido |
| 12 | Atalho agendar | Orçamento `aceito`: um botão “Agendar” por item abre o modal Nova Consulta existente, pré-preenchido com paciente + `procedimentoId` daquele item — **um agendamento por vez** |
| 13 | Status `rascunho` | **Fora do MVP**; orçamento nasce como `enviado` |

### Imutabilidade parcial (explícito — não confundir com 006/006b)

| Aspecto | Receita / Atestado | Orçamento (015) |
|---|---|---|
| Cabeçalho snapshot | Congelado na emissão | Congelado na emissão |
| Itens / conteúdo | Congelados; correção = nova emissão | Congelados após emissão; correção de conteúdo = **novo** orçamento |
| `validoAte` | N/A | Congelado na emissão (informativo); não altera status sozinho |
| Status | Sem workflow de status comercial | **Transiciona**: enviado → aceito \| recusado |
| Edição in-place de itens | Proibida | Proibida após emissão |
| Transição de status | N/A | Esperada e desejada |

Regra de ouro: depois de emitido, **não** se edita nome/valor/quantidade/procedimento dos itens nem `validoAte`; só se registra a decisão do paciente (aceito/recusado).

### Status no MVP

Orçamento **nasce como `enviado`** — sem `rascunho`, sem `expirado`.

```
enviado ──► aceito
       └──► recusado
```

Justificativa (sem rascunho): alinha à emissão de Receita/Atestado; evita UI
de “enviar”; erro de conteúdo ⇒ novo orçamento.

## Critérios de aceite
- [ ] Profissional autorizado (`admin` \| `dentista` \| `recepcao`) emite
      `Orcamento` vinculado a `Prontuario`, com ≥ 1 item; cada item tem
      `procedimentoId` (do tenant), `nome` (snapshot), `valor` (snapshot,
      ≥ 0, editável na criação a partir do valor padrão do Procedimento) e
      `quantidade` (inteiro ≥ 1).
- [ ] Emissão aceita `validoAte` opcional (data civil); se informado, aparece
      no PDF (“Válido até …”) e na listagem; **nunca** muda status sozinho.
- [ ] Na emissão, persiste `SnapshotCabecalhoDocumento` (mesmos campos da
      006/006b) e `profissionalId` da sessão.
- [ ] Orçamento emitido nasce com status `enviado` (sem rascunho).
- [ ] Após emissão, **itens, cabeçalho e `validoAte` são imutáveis**; correção
      de conteúdo = novo orçamento.
- [ ] Equipe registra transição `enviado` → `aceito` \| `recusado`; estados
      terminais não reabrem no MVP.
- [ ] Passagem de `validoAte` **não** altera status nem exige job/cron;
      não existe status `expirado` no MVP.
- [ ] Orçamento `aceito` habilita na UI o atalho “Agendar” por item —
      **não** cria agendamento sozinho.
- [ ] Atalho abre modal Nova Consulta pré-preenchido com paciente do
      prontuário + `procedimentoId` do item (um de cada vez).
- [ ] `ListarOrcamentosDoProntuario` ordena por `emitidoEm` descendente e
      exibe `validoAte` quando houver.
- [ ] PDF sob demanda (`GeradorPdfPort` / `pdf-lib`), sem blob — inclui
      snapshot, itens (nome/valor/qtd), total, status, data de emissão e
      “Válido até …” se `validoAte` presente.
- [ ] Isolamento multi-tenant por `clinicaId` da sessão.
- [ ] RBAC: admin, dentista e recepção emitem/listam/decidem/PDF; atalho de
      agenda segue matriz da 002.

## Regras de negócio
- Isolamento multi-tenant: leitura/escrita escopada por `clinicaId`.
- `procedimentoId` de cada item deve existir e pertencer à mesma clínica.
- `valor` e `nome` do item são snapshots; alteração no cadastro de
  `Procedimento` não reescreve orçamentos emitidos.
- `quantidade` ≥ 1; total do orçamento = Σ (`valor` × `quantidade`) — derivado
  (pode ser calculado na leitura/PDF; persistir total é detalhe do Arquiteto).
- `validoAte` opcional (data civil do tenant, sem hora); se omitido, PDF/UI
  não inventam prazo; se informado, é só informação comercial — **sem**
  efeito em status.
- Conteúdo (itens + cabeçalho + `validoAte`) imutável após emissão.
- Transições de status: somente `enviado` → `aceito` \| `recusado`;
  aceito/recusado não voltam atrás no MVP.
- Aceitar orçamento **não** agenda consulta.
- `profissionalId` do documento = sessão; input de negócio sem
  `profissionalId` arbitrário.

## Matriz de permissões (orçamento)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Emitir orçamento | sim | sim | sim |
| Listar orçamentos do prontuário | sim | sim | sim |
| Registrar aceite / recusa | sim | sim | sim |
| Gerar PDF do orçamento | sim | sim | sim |
| Usar atalho “Agendar item…” | conforme RBAC de `MarcarConsulta` (002) | idem | idem |

Justificativa: orçamento é ato **comercial** (negociação de preço), diferente
de Receita/Atestado (ato com CRO). Recepção e admin participam do fechamento
na prática. O atalho de agendamento não amplia quem pode marcar consulta.

## Modelo de domínio envolvido
Entidades/VOs a criar ou consumir (alinhar `specs/02-domain-model.md` na
etapa do Arquiteto):

- **`Orcamento`** (nova): id, clinicaId, prontuarioId, profissionalId,
  emitidoEm, status (`enviado` \| `aceito` \| `recusado`), itens[],
  cabeçalho (`SnapshotCabecalhoDocumento`), `validoAte` (opcional, data
  civil informativa).
- **`ItemOrcamento`**: procedimentoId, nome (snapshot), valor (snapshot),
  quantidade.
- **`Procedimento`** (existente — 002): fonte de sugestão nome/valor.
- **`Prontuario`** (003): vínculo obrigatório.
- **`SnapshotCabecalhoDocumento`** (shared — 006/006b): reutilizar.
- **`Agendamento` / `MarcarConsulta`** (002): consumidos só pelo atalho de
  UI (sem caso de uso de agendar em lote).

## Casos de uso (application layer)
- `EmitirOrcamento({ prontuarioId, itens[], validoAte? }, contexto) → Orcamento`
  — status inicial `enviado`; snapshot de cabeçalho + itens; profissional
  da sessão.
- `ListarOrcamentosDoProntuario({ prontuarioId }, contexto) → Orcamento[]`
  — ordenado por `emitidoEm` descendente.
- `ConsultarOrcamento({ orcamentoId }, contexto) → Orcamento`
- `RegistrarDecisaoOrcamento({ orcamentoId, decisao: "aceito" | "recusado" }, contexto) → Orcamento`
  — só a partir de `enviado`; equipe registra decisão do paciente.
- `GerarPdfOrcamento({ orcamentoId }, contexto) → ArquivoPdf`

**Não incluir no MVP:** `EditarItensOrcamento`, `CompararOrcamentos`,
`AgendarTodosItensDoOrcamento` (lote), `ExpirarOrcamentosVencidos` (job).

## Ports necessárias
- `OrcamentoRepositoryPort` — persistência append de orçamentos +
  transição de status (sem update de itens / `validoAte`).
- Consumo (leitura): `ProntuarioRepositoryPort` (003),
  repositório/consulta de `Procedimento` (002), sessão/auth (001).
- `GeradorPdfPort` (estendida, padrão 006/006b).
- Sem port nova de agendamento: UI chama actions/use cases já existentes
  de `MarcarConsulta`.

## Contrato de API / Server Action (se aplicável)
Server actions (next-safe-action + Zod), escopadas por `ContextoSessao` —
payloads detalhados no Arquiteto. Superfície prevista:

| Ação | Input (alto nível) | Saída |
|---|---|---|
| Emitir | prontuarioId, itens[{ procedimentoId, valor?, quantidade? }], validoAte? | OrcamentoDTO |
| Listar do prontuário | prontuarioId | OrcamentoListaDTO[] |
| Consultar | orcamentoId | OrcamentoDTO |
| Registrar decisão | orcamentoId, decisao | OrcamentoDTO |
| Gerar PDF | orcamentoId | { pdfBase64, nomeArquivo, contentType } |
| Atalho UI agendar | — | abre modal Nova Consulta com `procedimentoId` (e paciente) pré-preenchidos |

## Fora de escopo
- Portal do paciente / aceite online pelo paciente (v2).
- Estado `rascunho` e edição multi-sessão antes de “enviar”.
- Status `expirado` e qualquer job/cron de expiração automática.
- Agendamento em lote de todos os itens de uma vez.
- Criação automática de `Agendamento` no aceite.
- Cobrança / financeiro (013) — orçamento aceito **não** gera
  `CobrancaPaciente` automaticamente neste MVP.
- Assinatura digital com validade jurídica.
- Envio automático do PDF por WhatsApp/e-mail (bot 007 pode consumir
  depois).
- Desconto percentual global, formas de pagamento no documento, parcelas.
- Comparação entre versões de orçamento.
- Alterar RBAC ou regras de `MarcarConsulta` (002).

## Plano de testes
- **Domínio:** emissão com ≥ 1 item; snapshot nome/valor; quantidade ≥ 1;
  `validoAte` opcional sem efeito em status; imutabilidade de itens /
  `validoAte` após emissão; transições válidas / inválidas (ex.: aceito →
  recusado rejeitado); procedimento fora do tenant rejeitado; total
  derivado.
- **Aplicação:** emitir + listar ordenado (com `validoAte` na lista); registrar
  decisão só em `enviado`; RBAC (admin/dentista/recepção); isolamento
  `clinicaId`; PDF com e sem “Válido até …”.
- **Integração:** adapter Drizzle (orçamento + itens); round-trip; mudança
  de `Procedimento.valor` não altera item já emitido.
- **Contrato/e2e (crítico leve):** emitir → listar → aceitar → atalho abre
  modal de consulta com procedimento pré-preenchido.

## Dependências
- **001** (auth / `ContextoSessao` / papéis)
- **002** (`Procedimento`, `MarcarConsulta`, modal Nova Consulta)
- **003** (`Prontuario`)
- **006 / 006b** (`SnapshotCabecalhoDocumento`, padrão `GeradorPdfPort`)

Overview (`specs/00-overview.md`) atualizado nesta aprovação: 015 removida
do planejamento futuro. `Orcamento` / `ItemOrcamento` em
`specs/02-domain-model.md` na etapa do Arquiteto.
