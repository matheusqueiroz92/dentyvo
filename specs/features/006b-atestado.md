# 006b — Atestado odontológico

## Status
`aprovada` — pronta para o Arquiteto de Domínio

## Relação com a 006
Documento **irmão** de `specs/features/006-receituario.md` (base arquitetural).
Não altera o status nem o escopo já aprovado/implementado da 006; reaproveita
o mesmo padrão: vínculo a `Prontuario`, emissão por `Profissional` (dentista),
imutabilidade pós-emissão, snapshot de cabeçalho, PDF sob demanda via
`GeradorPdfPort` / `pdf-lib`.

## Contexto
Após procedimentos ou consultas, o dentista precisa emitir atestado (repouso,
acompanhamento, comparecimento) de forma legível e rastreável no prontuário —
hoje muitas clínicas ainda fazem isso à mão ou em editores externos, sem
histórico no sistema.

Persona: **dentista** (mesmo ator prescritivo/atestante da 006; CRO obrigatório).

## User story
Como dentista, quero emitir um atestado odontológico vinculado ao prontuário
(com motivo, período de afastamento e CID opcional) e gerar o PDF, para
entregar ao paciente sem sair do fluxo clínico e manter trilha de auditoria.

## Decisões aprovadas (Planejador)

| # | Tema | Decisão |
|---|---|---|
| 1 | Formato do documento | Spec própria `006b-atestado.md` (não seção dentro da 006) |
| 2 | Período de afastamento | Estruturado: `dataInicio` + `quantidadeDias` (inteiro ≥ 1) → persiste `dataFim` calculada. Texto livre / híbrido = fora do MVP |
| 3 | Regra de calendário | `dataFim` **inclusiva** = `dataInicio + (quantidadeDias − 1)` (ex.: 1 dia ⇒ início = fim). Data civil do tenant (sem hora) |
| 4 | CID | **Opcional**; se preenchido, validar **formato** CID-10 na emissão (ver abaixo). Sem tabela/catálogo semântico |
| 5 | Snapshot de cabeçalho | Generalizar `SnapshotCabecalhoReceita` → `SnapshotCabecalhoDocumento` — **só estrutural** (ver restrições obrigatórias abaixo) |
| 6 | `GeradorPdfPort` | **Estender** a port existente (e/ou movê-la para `shared` se o Arquiteto achar mais limpo) para gerar PDF de `Atestado` snapshotado; mesmo adapter `pdf-lib`; sem blob. Port espelho só se o Arquiteto justificar e documentar |
| 7 | Timezone / “dia” | Período em **data civil** do tenant (sem componente de hora) no MVP |
| 8 | Overview | Registrar 006b em `specs/00-overview.md` nesta aprovação |
| 9 | Conteúdo vs receita | Sem lista de itens — um atestado = um documento por emissão |
| 10 | Módulo | `src/core/atestado` (paralelo a `receituario`); schema `db/schema/atestado.ts` |
| 11 | RBAC | Idêntica à 006: só `dentista` |

### CID — validação estrutural (aprovado)

- Campo opcional; ausente / string vazia (após trim) ⇒ `null` / omitido; emissão e PDF ok.
- Se preenchido: validar **formato** CID-10 na emissão — rejeitar claramente inválido.
- Padrão estrutural (sem catálogo): **uma letra** seguida de **2–3 dígitos**, com
  subcategoria opcional após ponto (ex.: `K08`, `K08.1`, `A09`).
  Exemplos válidos de formato: `K08.1`, `A09`. Exemplos inválidos: `08`,
  `KK08`, `K8`, texto livre sem código.
- **Não** validar se o código existe na CID-10 oficial nem se é clinicamente
  apropriado ao motivo — só estrutura do código.
- Normalização (maiúsculas, trim) a cargo do domínio/Arquiteto; documentar no
  modelo.

### Snapshot — restrições obrigatórias (aprovado; Arquiteto deve validar)

A generalização `SnapshotCabecalhoReceita` → `SnapshotCabecalhoDocumento` é
**puramente estrutural**:

- Rename + generalização de tipo; **mesmos campos** (obrigatórios e opcionais
  idênticos aos da 006).
- **Sem** alteração de schema de banco já aplicado pela feature 006
  (`receita.cabecalho` jsonb permanece compatível — mesma forma JSON).
- **Sem** quebrar nenhum teste existente da `Receita`.

O Arquiteto de Domínio **deve validar isso explicitamente** (inspecionar VO,
persistência e suíte de testes da 006) **antes** de prosseguir com o restante
do desenho do atestado — não assumir. Se a validação falhar, parar e sinalizar;
não “consertar” mudando colunas/migração da 006 sem nova aprovação.

## Critérios de aceite
- [ ] Dentista emite `Atestado` com `motivo` (texto livre obrigatório),
      `cid` opcional (formato CID-10 se preenchido), e período estruturado
      (`dataInicio` + `quantidadeDias` ≥ 1); `dataFim` inclusiva persistida.
- [ ] Emissão com CID de formato inválido é rejeitada (erro de domínio /
      validação na emissão).
- [ ] Não há lista de itens/medicamentos no atestado.
- [ ] Na emissão, o `Atestado` persiste **snapshot de cabeçalho**
      (`SnapshotCabecalhoDocumento`, mesmos campos da 006).
- [ ] PDF gerado sob demanda (`GeradorPdfPort` estendido / adapter `pdf-lib`),
      sem blob persistido; inclui snapshot, `emitidaEm`, motivo, CID (se
      houver), período (`dataInicio`, `quantidadeDias`, `dataFim`).
- [ ] Atestado vinculado ao prontuário; histórico via
      `ListarAtestadosDoProntuario`.
- [ ] Atestado emitido é **imutável**; correção = nova emissão.
- [ ] `profissionalId` = sempre `ContextoSessao.profissionalId` (nunca no
      input de negócio).
- [ ] Apenas `dentista` da mesma clínica emite, lista e gera PDF;
      `admin` e `recepcao` negados.
- [ ] MVP sem assinatura digital com validade jurídica (mesmo espírito da 006).
- [ ] Refactor do snapshot (se feito nesta feature) não altera schema 006 nem
      quebra testes de `Receita` (validação explícita do Arquiteto + suite
      verde na implementação).

## Regras de negócio
- Atestado não pode ser editado após emitido — correção cria novo atestado.
- Isolamento multi-tenant: leitura/escrita escopada por `clinicaId` da sessão.
- Snapshot de cabeçalho congelado na emissão; mudanças posteriores em
  clínica/profissional/paciente não alteram atestados já emitidos nem o PDF
  regenerado a partir deles.
- `EmitirAtestado` usa `profissionalId` da sessão; input sem `profissionalId`
  externo.
- `motivo` obrigatório (não vazio após trim).
- `quantidadeDias` inteiro ≥ 1; `dataFim` = `dataInicio + (quantidadeDias − 1)`
  em data civil do tenant (sem hora).
- `cid` opcional; se preenchido, formato CID-10 estrutural obrigatório;
  se omitido, PDF não exibe linha de CID enganosa (domínio: `null`/omitido).
- `assinaturaDigitalId` nullable / v2 — fora do escopo deste MVP.

## Matriz de permissões (atestado)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Emitir atestado | não | sim | não |
| Listar atestados do prontuário | não | sim | não |
| Gerar PDF do atestado | não | sim | não |

Mesma justificativa da 006: ato clínico atestante exige CRO; papel `admin`
sem CRO não substitui dentista.

## Modelo de domínio envolvido
Nova entidade `Atestado`; reusa/generaliza snapshot de cabeçalho;
consome `Prontuario`, `Profissional`, `Clinica`, `Paciente` via ports —
não cria nem edita essas entidades neste módulo.

Atualizar `specs/02-domain-model.md` na etapa do Arquiteto: seção `Atestado`
+ nota de `SnapshotCabecalhoDocumento` compartilhado com `Receita`.

### Estrutura de módulo
- `src/core/atestado` — emissão, listagem, geração de PDF, imutabilidade.
- Schema: `db/schema/atestado.ts` (não editar `db/schema/index.ts` nesta
  feature, alinhado à 006).
- Refactor leve da 006: `SnapshotCabecalhoReceita` →
  `SnapshotCabecalhoDocumento` (alias/reexport ok), **sem** migração de
  schema da tabela `receita`.

### Campos do Atestado (MVP)
```
motivo: string              // obrigatório — finalidade (ex.: "repouso pós-procedimento")
cid?: string | null         // opcional; se presente, formato CID-10 estrutural
dataInicio: Date            // obrigatório (data civil)
quantidadeDias: number      // obrigatório, inteiro ≥ 1
dataFim: Date               // derivado inclusivo e persistido na emissão
+ snapshot de cabeçalho     // SnapshotCabecalhoDocumento
+ emitidaEm, clinicaId, prontuarioId, profissionalId
```

### Snapshot de cabeçalho (persistido no Atestado)
**Obrigatórios:** clinicaNome, clinicaEndereco, profissionalNome,
profissionalCro, pacienteNome, pacienteCpf, emitidaEm.
**Opcionais:** pacienteDataNascimento, profissionalEspecialidade.
**Fora do MVP:** documento fiscal da clínica.
*(Mesmo contrato da 006 — forma JSON idêntica.)*

## Casos de uso (application layer)
- `EmitirAtestado({ prontuarioId, motivo, cid?, dataInicio, quantidadeDias }, contexto: ContextoSessao) → Atestado`
  — valida CID se presente; calcula/persiste `dataFim`; `profissionalId` =
  `contexto.profissionalId`.
- `ListarAtestadosDoProntuario({ prontuarioId }, contexto: ContextoSessao) → Atestado[]`
- `GerarPdfAtestado({ atestadoId }, contexto: ContextoSessao) → ArquivoPdf`
  — regenera a partir do atestado + snapshot persistidos; sem blob armazenado.

## Ports necessárias
- `AtestadoRepositoryPort` — persistência do atestado (com snapshot e período).
- `GeradorPdfPort` (existente, **estendida** / eventualmente em `shared`) —
  gera PDF a partir dos dados já snapshotados do atestado (`pdf-lib`,
  serverless, sem headless Chrome).
- Consumo (somente leitura, sem alterar os módulos donos):
  - `ProntuarioRepositoryPort` (003)
  - `PacienteRepositoryPort` (paciente / 002)
  - `ClinicaRepositoryPort` (001)
  - `ProfissionalRepositoryPort` (001)

## Contrato de API / Server Action (se aplicável)
Server actions no prontuário (mesmo espírito da 006), escopadas por
`ContextoSessao`:
- emitir atestado → payload `{ prontuarioId, motivo, cid?, dataInicio, quantidadeDias }`
- listar atestados do prontuário → `{ prontuarioId }`
- gerar PDF → `{ atestadoId }` (download/stream; sem URL pública permanente
  no MVP)

Detalhe de rotas/UI fica para implementação; esta spec não define schema
Drizzle.

## Fora de escopo
- Assinatura digital com validade jurídica (ICP-Brasil).
- Persistência de blob/arquivo PDF.
- Documento fiscal da clínica no cabeçalho.
- Período apenas como texto livre (ou híbrido estruturado|texto).
- Catálogo/tabela CID-10 completa ou validação semântica (existência /
  adequação clínica do código).
- Migração ou mudança de colunas do schema `receita` da 006 por causa do
  rename do VO de snapshot.
- Atestado de comparecimento com campos distintos além de `motivo` (mesmo
  modelo com motivo adequado).
- Envio automático por WhatsApp/e-mail do PDF.
- Alterar regras de negócio ou RBAC da 006 (Receita).

## Plano de testes
- Domínio: atestado emitido imutável; `motivo` obrigatório; `quantidadeDias`
  ≥ 1; `dataFim` inclusiva; snapshot obrigatório; ausência de itens; CID
  omitido ok; CID formato válido aceito; CID formato inválido rejeitado.
- Aplicação:
  - `EmitirAtestado` grava snapshot via ports e amarra `profissionalId` da
    sessão; calcula `dataFim`; rejeita CID inválido.
  - `ListarAtestadosDoProntuario` retorna histórico do prontuário no tenant.
  - `GerarPdfAtestado` inclui snapshot + motivo + período (+ CID se presente)
    sem consultar ports de cadastro ao vivo.
  - RBAC: só `dentista`; `admin` e `recepcao` negados.
  - Cross-tenant / prontuário inexistente falha sem vazar dado.
- Regressão 006: após generalização do snapshot, **toda** a suíte de testes
  de `Receita` / receituário permanece verde; sem migração de schema 006.
- Integração (adapter): persistência do atestado + geração PDF com `pdf-lib`
  (smoke).
- Contrato/e2e: fluxo crítico opcional (emitir → listar → PDF), alinhado ao
  rigor da 006.

## Dependências
- **006 (receituário):** padrão arquitetural, RBAC, snapshot, `GeradorPdfPort`
  / `pdf-lib`.
- 001 (auth multi-tenant): `ContextoSessao`, `ClinicaRepositoryPort`,
  `ProfissionalRepositoryPort`.
- 003 (prontuário): `ProntuarioRepositoryPort`.
- Módulo paciente (002): `PacienteRepositoryPort`.
- `src/core/shared` (erros e autorização), mesmo padrão dos outros módulos.

## Próximo passo
Abrir o **Arquiteto de Domínio** com esta spec. Primeiro gate do Arquiteto:
validar explicitamente as restrições do snapshot (seção acima); só então
definir domínio/ports/stubs do atestado.
