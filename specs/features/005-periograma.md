# 005 — Periograma (v2)

## Status
`aprovada`

> **Modelo baseado em imagens de referência reais fornecidas pelo usuário
> (formato Universidade de Berna adaptado, e template odontograma
> multi-dentição). Classificação de furca confirmada clinicamente:
> Hamp (rotina) e Glickman (periodontite aguda), via VO
> `ClassificacaoFurca`.**
## Contexto
Registro periodontal (sondagem, margem gengival, placa, sangramento,
mobilidade, implante, furca) usado em avaliações periodontais. Menos
frequente que o odontograma, mas essencial para clínicas com foco em
periodontia.

O layout de referência segue o **formato da Universidade de Berna**,
traduzido para português, com 6 pontos de sondagem por dente e múltiplas
medições por ponto.

## User story
Como dentista, quero registrar medições periodontais por dente e por ponto
de sondagem (exame inicial ou reavaliação), para acompanhar a evolução da
saúde periodontal do paciente ao longo do tempo.

## Decisões clínicas validadas

| # | Decisão | Valor |
|---|---|---|
| 1 | Numeração de dentes | **Mesma validação da 004**: permanente FDI 11–48 + decídua FDI 51–85 |
| 2 | Pontos de sondagem | **6 por dente**: 3 vestibular + 3 palatina/lingual (mesial, central, distal em cada lado) |
| 3 | Medições por ponto | **Quatro** campos: `margemGengival`, `profundidadeSondagem`, `placa`, `sangramentoSondagem` |
| 4 | Preenchimento | **Parcial permitido** — pontos e medições opcionais no salvamento |
| 5 | Mobilidade | Escala de **Miller** — graus **0, 1, 2 e 3** (nível do **dente**) |
| 6 | Tipo do exame | `exame_inicial` \| `reavaliacao` |
| 7 | Imutabilidade | Exame **imutável** após salvo; correção = novo exame `reavaliacao` |
| 8 | Comparação | **Sem** caso de uso dedicado — só listagem por data; UI/relatório futuro |
| 9 | Métricas agregadas / nível de inserção | Derivadas sob demanda; **fora de escopo desta spec de backend** |
| 10 | RBAC | Mesma matriz da feature 003: `admin` + `dentista`; `recepcao` sem acesso |
| 11 | Furca | VO `ClassificacaoFurca` com **dois sistemas** (Hamp I–III rotina; Glickman I–IV periodontite aguda); só multirradiculares/molares; `null` sem avaliação |
| 12 | Escolha do sistema de furca | **Livre** no momento do registro — sem regra automática no domínio |
| 13 | Mistura de sistemas no exame | **Aceitável** misturar Hamp e Glickman em dentes diferentes do mesmo periograma |
| 14 | Granularidade da furca (MVP) | **Uma** `ClassificacaoFurca` por dente (sem face/sítio); ver nota de escopo |

### Estrutura por ponto de sondagem (`PontoSondagem`)
Até 6 pontos por dente (3 vestibular + 3 palatina/lingual). Cada ponto
**pode** registrar até quatro medições; campos individuais são opcionais
(preenchimento parcial):

| Campo | Tipo | Observação |
|---|---|---|
| `margemGengival` | inteiro \| null | Pode ser **negativo** (recessão) |
| `profundidadeSondagem` | inteiro \| null | Profundidade de sondagem no ponto |
| `placa` | booleano \| null | Presença de placa |
| `sangramentoSondagem` | booleano \| null | Sangramento à sondagem |

Identificação do ponto (lado + posição):
- lado: `vestibular` \| `palatina_lingual`
- posicao: `mesial` \| `central` \| `distal`

Um ponto sem nenhuma medição preenchida pode ser omitido do payload; nem
todo ponto é sondável em toda consulta.

### Estrutura no nível do dente (`DentePeriograma`)

| Campo | Tipo | Observação |
|---|---|---|
| `numeroDente` | FDI | **Mesma validação da 004** (permanente + decídua) |
| `mobilidade` | 0–3 \| null | Escala de Miller; opcional no salvamento parcial |
| `implante` | booleano \| null | Indica se o “dente” é implante |
| `furca` | `ClassificacaoFurca` \| null | Só multirradiculares/molares; **null** quando não há avaliação de furca naquele dente |
| `nota` | texto livre opcional | Observação clínica do dente |

### Furca — `ClassificacaoFurca` (confirmado)

A dentista de referência usa **dois sistemas**, conforme o contexto
clínico — **não** um sistema único. Os graus **não são comparáveis** entre
sistemas (Hamp grau II ≠ Glickman grau II clinicamente).

#### Value Object `ClassificacaoFurca`

| Campo | Tipo | Observação |
|---|---|---|
| `sistema` | `"hamp"` \| `"glickman"` | Sistema de classificação escolhido |
| `grau` | inteiro | Validado **conforme o sistema** (ver abaixo) |

**Validação de domínio:**
- `sistema === "hamp"` → `grau` ∈ {1, 2, 3}
- `sistema === "glickman"` → `grau` ∈ {1, 2, 3, 4}
- Combinação inválida (ex.: `hamp` + grau `4`) → rejeitar com erro
  específico `GrauForaDoSistemaError` (não aceitar silêncio nem coerção).

**Aplicabilidade:** apenas dentes **multirradiculares (molares)**. Nos
demais dentes, ou quando não há avaliação de furca naquele dente →
`furca: null`.

**Documentação no código:** as descrições clínicas de cada grau/sistema
devem aparecer como **comentário** no VO (ou constantes documentadas),
pois são clinicamente distintas e não intercambiáveis.

#### Hamp — uso rotineiro (3 graus)

Critério objetivo de **profundidade horizontal de sondagem**:

| Grau | Descrição clínica |
|---|---|
| I | Perda horizontal; sonda penetra **até 3 mm** |
| II | Perda horizontal; sonda penetra **mais de 3 mm** |
| III | Destruição horizontal de lado a lado (**comunicação total**) |

#### Glickman — periodontite aguda (4 graus)

Inclui fatores anatômicos/radiográficos e visibilidade clínica:

| Grau | Descrição clínica |
|---|---|
| I | Início da perda óssea |
| II | Perda parcial |
| III | Comunicação total entre as furcas |
| IV | Recessão gengival com furca **totalmente visível** |

#### Escolha do sistema (aprovado)

O profissional escolhe **livremente** qual sistema (`hamp` \| `glickman`)
usar **no momento do registro** de cada avaliação de furca — não há regra
automática no domínio que force Hamp em “rotina” ou Glickman em
“periodontite aguda”. O contexto clínico (rotina vs. aguda) é orientação
de uso, não invariante de software. Misturar sistemas em dentes
diferentes do **mesmo** periograma é aceitável.

#### Nota de escopo consciente — furca por face (fora do MVP)

Furca por face individual (ex.: vestibular vs. distal) fica **fora do
MVP**; o registro reflete uma avaliação **única por dente**, a critério
do profissional sobre qual sítio/quadro é mais representativo —
reavaliar se a prática clínica real demandar granularidade maior.

### Métricas agregadas e nível de inserção — fora de escopo (backend)
Médias e percentuais (profundidade de sondagem, nível de inserção, % placa,
% sangramento) são métricas **derivadas**, calculadas sob demanda em etapa
**futura de UI/relatório** — **não** armazenadas e **não** fazem parte do
escopo desta spec de backend.

Em particular, a **fórmula do nível de inserção** **não** bloqueia a
aprovação desta feature: fica explicitamente **fora de escopo desta spec de
backend**.

### Cabeçalho do periograma
- vinculado ao `Prontuario`
- `tipo`: `exame_inicial` \| `reavaliacao`
- `profissionalId` responsável
- `registradoEm` (data do exame)
- **imutável** após persistido

### Imutabilidade
Periograma salvo **não** é editado. Correção ou acompanhamento = **novo**
exame com `tipo: reavaliacao`. Não há `UPDATE` in-place do registro
anterior (alinhado ao espírito de evolução clínica da 003).

## Critérios de aceite
- [ ] Cada dente **pode** ter até **6 pontos** de sondagem (3 vestibular +
      3 palatina/lingual; mesial, central, distal); pontos/medições
      **opcionais** no salvamento (preenchimento parcial permitido).
- [ ] Cada ponto preenchido admite: `margemGengival` (inteiro, inclusive
      negativo), `profundidadeSondagem` (inteiro), `placa` (boolean),
      `sangramentoSondagem` (boolean) — cada campo individualmente
      opcional.
- [ ] No nível do dente: `mobilidade` (Miller 0–3), `implante`, `furca`
      (`ClassificacaoFurca` \| null), `nota` opcional.
- [ ] `ClassificacaoFurca` possui `sistema` (`"hamp"` \| `"glickman"`) e
      `grau` (inteiro); Hamp aceita graus 1–3; Glickman aceita graus 1–4;
      combinação inválida lança `GrauForaDoSistemaError`.
- [ ] As descrições clínicas de cada grau/sistema estão documentadas como
      comentário no código do VO (sistemas clinicamente distintos, graus
      não comparáveis entre si).
- [ ] `furca` aplica-se só a dentes multirradiculares (molares); `null`
      quando não há avaliação de furca naquele dente (ou dente não
      elegível).
- [ ] `numeroDente` usa a **mesma validação** da feature 004 (FDI
      permanente + decídua).
- [ ] Periograma tem `tipo` (`exame_inicial` \| `reavaliacao`), vínculo ao
      prontuário, profissional responsável e data.
- [ ] Periograma é **imutável** após salvo; correção = novo exame
      `reavaliacao`.
- [ ] `ListarPeriogramasDoProntuario` retorna exames ordenados por
      `registradoEm` **descendente** (mais recente primeiro); **sem**
      caso de uso `CompararPeriogramas`.
- [ ] Cálculo de métricas agregadas / nível de inserção **fora** desta
      spec de backend.
- [ ] Apenas `admin` e `dentista` da mesma clínica acessam; `recepcao` não.

## Regras de negócio
- Mobilidade, quando informada, usa exclusivamente Miller (0–3), no nível
  do dente.
- Preenchimento parcial permitido: não exige 6×4 medições completas para
  salvar.
- `margemGengival` admite valores negativos (recessão).
- `numeroDente`: mesmos conjuntos FDI da 004; rejeitar fora do conjunto.
- `furca`: VO `ClassificacaoFurca` (`sistema` + `grau`) só em
  multirradiculares/molares; `null` sem avaliação; grau validado pelo
  sistema (`GrauForaDoSistemaError` se fora do intervalo).
- Escolha do sistema é **livre** no registro; misturar Hamp e Glickman
  no mesmo periograma é permitido.
- Uma única `ClassificacaoFurca` por dente (MVP); sem granularidade por
  face/sítio.
- Graus Hamp e Glickman **não** são intercambiáveis nem comparáveis;
  sempre persistir o `sistema` junto com o `grau`.
- Exame persistido é imutável (sem edição; novo exame para correção).
- Isolamento multi-tenant e vínculo ao `Prontuario` (padrão 003/006).

## Matriz de permissões (periograma)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Registrar periograma | sim | sim | não |
| Consultar periograma | sim | sim | não |
| Listar periogramas do prontuário | sim | sim | não |

## Modelo de domínio envolvido
`Periograma` (com `DentePeriograma`, `PontoSondagem` e VO
`ClassificacaoFurca`); consome `Prontuario` / profissional via ports —
alinhar `specs/02-domain-model.md` na etapa do Arquiteto.

### Estrutura conceitual (alto nível — sem schema de banco)
```
Periograma                         // imutável após salvo
  id, prontuarioId, profissionalId, tipo, registradoEm
  dentes[]:
    numeroDente                    // validação idêntica à 004
    mobilidade?                    // Miller 0–3
    implante?
    furca?                         // ClassificacaoFurca | null
                                   //   { sistema: "hamp"|"glickman", grau: int }
                                   //   hamp: 1–3; glickman: 1–4
                                   //   só molares; null = sem avaliação
    nota?
    pontos[]:                      // 0..6; medições opcionais
      lado                         // vestibular | palatina_lingual
      posicao                      // mesial | central | distal
      margemGengival?              // int (pode ser negativo)
      profundidadeSondagem?
      placa?
      sangramentoSondagem?
```

## Casos de uso (application layer)
- `RegistrarPeriograma({ prontuarioId, tipo, dentes[] }, contexto: ContextoSessao) → Periograma`
  — `profissionalId` = sessão; exame fica imutável após persistir.
- `ConsultarPeriograma({ periogramaId }, contexto) → Periograma`
- `ListarPeriogramasDoProntuario({ prontuarioId }, contexto) → Periograma[]`
  — ordenado por `registradoEm` **descendente** (mais recente primeiro);
  base para comparação visual futura na UI.

**Não incluir** `CompararPeriogramas` nesta feature.

## Ports necessárias
- `PeriogramaRepositoryPort` — persistência do exame e dentes/pontos
  (append de exames; sem update de exame existente).
- Consumo (leitura): `ProntuarioRepositoryPort` (003); sessão/auth (001).

## Contrato de API / Server Action (se aplicável)
Server actions clínicas (padrão next-safe-action + Zod), escopadas por
`ContextoSessao` — detalhar payloads no Arquiteto.

## Fora de escopo
- **Cálculo de métricas agregadas e fórmula do nível de inserção** (UI /
  relatório futuro; não bloqueia backend desta feature).
- Caso de uso dedicado de comparação entre exames (só listagem por data).
- Gráficos visuais avançados tipo Berna completo.
- Persistência de médias/% como colunas próprias.
- Regra automática que force Hamp vs. Glickman conforme diagnóstico
  (escolha livre do profissional no registro).
- Conversão / equivalência entre graus Hamp e Glickman.
- Furca por face/sítio individual (ex.: vestibular vs. distal) — MVP
  registra uma avaliação única por dente; reavaliar se a prática exigir.
- IA / preenchimento automático a partir de imagem do periograma em papel.
- Edição in-place de periograma já salvo.

## Plano de testes
- **Domínio:** validação `numeroDente` idêntica à 004; até 6 pontos;
  medições opcionais / parciais; `margemGengival` negativa; Miller 0–3;
  `ClassificacaoFurca` — Hamp 1–3, Glickman 1–4, rejeição
  `GrauForaDoSistemaError` (ex. hamp+4); furca null fora de molares /
  sem avaliação; imutabilidade (sem update).
- **Aplicação:** registro com tipo + profissional + data; listagem
  ordenada por data; rejeição de edição; isolamento por `clinicaId`; RBAC
  (recepção negada).
- **Integração:** adapter de repositório (quando existir).
- **Contrato/e2e:** fluxo crítico de registro/listagem no prontuário
  (quando UI existir).

## Dependências
003 (prontuário + RBAC), 004 (validação FDI compartilhada — permanente +
decídua).

---

## Decisões de aprovação (resolvidas)

1. **Escolha do sistema** — livre no momento do registro; sem regra
   automática no domínio.
2. **Mistura de sistemas** — aceitável no mesmo periograma (decorre da
   decisão 1).
3. **Granularidade** — uma `ClassificacaoFurca` por dente no MVP; furca
   por face individual fica fora do MVP (nota de escopo consciente
   acima).
