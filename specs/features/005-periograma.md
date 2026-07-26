# 005 — Periograma (v2)

## Status
`rascunho` (fora do MVP — detalhar quando entrar em desenvolvimento)

## Contexto
Registro periodontal (sondagem, sangramento, mobilidade) usado em avaliações
periodontais. Menos frequente que o odontograma, mas essencial para clínicas com
foco em periodontia.

## User story
Como dentista, quero registrar medições periodontais por dente/face, para
acompanhar evolução da saúde periodontal do paciente ao longo do tempo.

## Critérios de aceite (rascunho — refinar antes de iniciar)
- [ ] Registro de profundidade de sondagem por face de cada dente.
- [ ] Registro de sangramento à sondagem (sim/não) por ponto.
- [ ] Registro de mobilidade dentária (escala a definir).
- [ ] Comparação entre periogramas de datas diferentes (evolução do quadro).

## Regras de negócio
A definir em detalhe com validação clínica antes de travar o modelo de dados.

## Modelo de domínio envolvido
`Periograma`, `Prontuario`.

## Fora de escopo (nesta primeira versão)
- Gráficos visuais avançados (começar com estrutura de dados tabular).

## Plano de testes
A detalhar junto com os critérios de aceite refinados.

## Dependências
003 (prontuário).
