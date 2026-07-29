# 005 — Periograma (v2)

## Status
`rascunho` (fora do MVP — detalhar quando entrar em desenvolvimento)

> **Nota:** aguardando imagens de referência antes de aprovar o modelo de
> dados completo. Imagens de exemplo de periograma reais chegam em breve e
> podem revelar mais detalhes antes da aprovação final.

## Contexto
Registro periodontal (sondagem, sangramento, mobilidade) usado em avaliações
periodontais. Menos frequente que o odontograma, mas essencial para clínicas com
foco em periodontia.

## User story
Como dentista, quero registrar medições periodontais por dente/face, para
acompanhar evolução da saúde periodontal do paciente ao longo do tempo.

## Decisões clínicas validadas
Validadas com profissional de odontologia (ainda sujeitas a refinamento após
imagens de referência):

| # | Decisão | Valor |
|---|---|---|
| 1 | Numeração de dentes | **Padrão FDI por quadrante** (alinhado ao odontograma — feature 004) |
| 2 | Mobilidade | Escala de **Miller** — graus **0, 1, 2 e 3** |
| 3 | Profundidade de sondagem | **6 pontos por dente**: três na face vestibular e três na face lingual/palatina (mesial, médio e distal em cada face) |

## Critérios de aceite (rascunho — refinar antes de iniciar)
- [ ] Registro de profundidade de sondagem em **6 pontos por dente** (três na
      face vestibular e três na face lingual/palatina: mesial, médio e distal).
- [ ] Registro de sangramento à sondagem (sim/não) por ponto.
- [ ] Registro de mobilidade dentária na escala de Miller (grau 0, 1, 2 e 3).
- [ ] Comparação entre periogramas de datas diferentes (evolução do quadro).
- [ ] Numeração de dentes alinhada ao odontograma (FDI por quadrante).

## Regras de negócio
- Mobilidade usa exclusivamente a escala de Miller (0–3).
- Cada dente tem exatamente 6 pontos de sondagem: vestibular mesial/médio/distal
  e lingual (ou palatina) mesial/médio/distal.
- Demais detalhes de UI tabular/gráfica e campos auxiliares ainda dependem de
  imagens de referência antes de travar o modelo de dados completo.

## Modelo de domínio envolvido
`Periograma`, `Prontuario`.

## Fora de escopo (nesta primeira versão)
- Gráficos visuais avançados (começar com estrutura de dados tabular).

## Plano de testes
A detalhar junto com os critérios de aceite refinados.

## Dependências
003 (prontuário), 004 (odontograma — numeração FDI compartilhada).
