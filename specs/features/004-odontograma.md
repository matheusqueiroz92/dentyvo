# 004 — Odontograma (v2)

## Status
`rascunho` (fora do MVP — detalhar quando entrar em desenvolvimento)

> **Nota:** aguardando imagens de referência antes de aprovar o modelo de
> dados completo. Imagens de exemplo de odontograma reais chegam em breve e
> podem revelar mais detalhes antes da aprovação final.

## Contexto
Representação visual do estado de cada dente/face do paciente, usada em quase
toda consulta odontológica. É o maior diferencial visual frente a um sistema
genérico de prontuário.

## User story
Como dentista, quero registrar e visualizar o estado de cada dente/face do
paciente, para acompanhar histórico de procedimentos e planejar tratamento.

## Decisões clínicas validadas
Validadas com profissional de odontologia (ainda sujeitas a refinamento após
imagens de referência):

| # | Decisão | Valor |
|---|---|---|
| 1 | Numeração de dentes | **Padrão FDI por quadrante** (não Universal) |
| 2 | Faces registradas no dia a dia | **Todas** — vestibular, lingual/palatina, mesial, distal e oclusal. Nenhuma pode ficar de fora do MVP |

## Critérios de aceite (rascunho — refinar antes de iniciar)
- [ ] Representação de arcada dentária completa com numeração **FDI por
      quadrante** (não Universal).
- [ ] Cada dente registra **todas** as faces (vestibular, lingual/palatina,
      mesial, distal, oclusal) com estado independente (hígido, cariado,
      restaurado, ausente, etc.) — nenhuma face fica de fora do MVP.
- [ ] Alterações no odontograma ficam vinculadas a uma evolução do prontuário
      (data, profissional responsável).
- [ ] Odontograma é versionado — dá pra ver o estado em datas anteriores.

## Regras de negócio
- Numeração de dentes segue o padrão FDI por quadrante.
- Todas as faces clínicas (vestibular, lingual/palatina, mesial, distal,
  oclusal) são registráveis no MVP.
- Demais detalhes de nomenclatura de condições/procedimentos e fluxo de
  preenchimento ainda dependem de imagens de referência antes de travar o
  modelo de dados completo.

## Modelo de domínio envolvido
`Odontograma`, `Prontuario`.

## Fora de escopo (nesta primeira versão)
- Renderização gráfica interativa avançada (pode começar com estrutura de dados
  + UI simples, evoluir a UI depois).
- Numeração Universal (sistema norte-americano) — deliberadamente não adotada.

## Plano de testes
A detalhar junto com os critérios de aceite refinados.

## Dependências
003 (prontuário).
