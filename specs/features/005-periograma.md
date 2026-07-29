# 005 — Periograma (v2)

## Status
`rascunho` — **bloqueada apenas pela confirmação de furca** com a dentista
de referência. Todo o restante está decidido e pronto para aprovação assim
que a furca for confirmada (ou substituída por outra escala).

> **Modelo baseado em imagens de referência reais fornecidas pelo usuário
> (formato Universidade de Berna adaptado, e template odontograma
> multi-dentição); furca com classificação de Glickman ainda pendente de
> confirmação final com a dentista de referência antes da aprovação.**

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
| 11 | Furca | **Proposta:** Glickman I–IV — **PENDENTE DE CONFIRMAÇÃO** (única pendência) |

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
| `furca` | grau \| null | **Proposta PENDENTE:** Glickman I–IV; só multirradiculares/molares; **null / N-A** nos demais |
| `nota` | texto livre opcional | Observação clínica do dente |

### Furca — interpretação proposta (PENDENTE DE CONFIRMAÇÃO)
- Interpretação proposta: **classificação de Glickman**, graus **I, II, III
  e IV**.
- Aplicável apenas a dentes **multirradiculares / molares**; demais →
  `null` (não aplicável).
- **Única pendência que mantém esta spec em `rascunho`.** Confirmar com a
  dentista de referência antes de aprovar / enviar ao Arquiteto. Se outra
  escala for adotada, atualizar só este campo na spec.

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
      (proposta Glickman I–IV ou null/N-A — a confirmar), `nota` opcional.
- [ ] `numeroDente` usa a **mesma validação** da feature 004 (FDI
      permanente + decídua).
- [ ] Periograma tem `tipo` (`exame_inicial` \| `reavaliacao`), vínculo ao
      prontuário, profissional responsável e data.
- [ ] Periograma é **imutável** após salvo; correção = novo exame
      `reavaliacao`.
- [ ] `ListarPeriogramasDoProntuario` retorna exames ordenados por data
      (mais recente primeiro ou crescente — definir no Arquiteto); **sem**
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
- `furca` (enquanto a proposta Glickman vigorar): graus I–IV só quando
  aplicável; caso contrário `null`.
- Exame persistido é imutável (sem edição; novo exame para correção).
- Isolamento multi-tenant e vínculo ao `Prontuario` (padrão 003/006).

## Matriz de permissões (periograma)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Registrar periograma | sim | sim | não |
| Consultar periograma | sim | sim | não |
| Listar periogramas do prontuário | sim | sim | não |

## Modelo de domínio envolvido
`Periograma` (com `DentePeriograma` e `PontoSondagem`); consome
`Prontuario` / profissional via ports — alinhar `specs/02-domain-model.md`
após aprovação (pós-confirmação da furca).

### Estrutura conceitual (alto nível — sem schema de banco)
```
Periograma                         // imutável após salvo
  id, prontuarioId, profissionalId, tipo, registradoEm
  dentes[]:
    numeroDente                    // validação idêntica à 004
    mobilidade?                    // Miller 0–3
    implante?
    furca?                         // Glickman I–IV | null  (PENDENTE CONFIRMAÇÃO)
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
  — ordenado por `registradoEm`; base para comparação visual futura na UI.

**Não incluir** `CompararPeriogramas` nesta feature.

## Ports necessárias
- `PeriogramaRepositoryPort` — persistência do exame e dentes/pontos
  (append de exames; sem update de exame existente).
- Consumo (leitura): `ProntuarioRepositoryPort` (003); sessão/auth (001).

## Contrato de API / Server Action (se aplicável)
Server actions clínicas (padrão next-safe-action + Zod), escopadas por
`ContextoSessao` — detalhar payloads no Arquiteto após aprovação.

## Fora de escopo
- **Cálculo de métricas agregadas e fórmula do nível de inserção** (UI /
  relatório futuro; não bloqueia backend desta feature).
- Caso de uso dedicado de comparação entre exames (só listagem por data).
- Gráficos visuais avançados tipo Berna completo.
- Persistência de médias/% como colunas próprias.
- Definição definitiva de furca **antes** da confirmação da dentista — a
  proposta Glickman fica explícita, mas não aprovada clinicamente.
- IA / preenchimento automático a partir de imagem do periograma em papel.
- Edição in-place de periograma já salvo.

## Plano de testes
- **Domínio:** validação `numeroDente` idêntica à 004; até 6 pontos;
  medições opcionais / parciais; `margemGengival` negativa; Miller 0–3;
  furca null fora de molares (quando confirmada); imutabilidade (sem
  update).
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

## Pendência restante (única)

**Furca — confirmação com a dentista de referência.**

- Proposta atual documentada: classificação de **Glickman**, graus **I–IV**;
  `null` / N-A para dentes que não sejam multirradiculares/molares.
- Todo o restante desta spec está decidido e pronto para aprovação.
- Enquanto a furca não for confirmada (ou substituída por outra escala
  explícita), o status permanece **`rascunho`** e **não** se avança ao
  Arquiteto de Domínio para a 005.
