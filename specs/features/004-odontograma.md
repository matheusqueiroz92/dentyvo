# 004 — Odontograma (v2)

## Status
`rascunho` (fora do MVP — detalhar quando entrar em desenvolvimento)

## Contexto
Representação visual do estado de cada dente/face do paciente, usada em quase
toda consulta odontológica. É o maior diferencial visual frente a um sistema
genérico de prontuário.

## User story
Como dentista, quero registrar e visualizar o estado de cada dente/face do
paciente, para acompanhar histórico de procedimentos e planejar tratamento.

## Critérios de aceite (rascunho — refinar antes de iniciar)
- [ ] Representação de arcada dentária completa (numeração padrão FDI ou
      Universal — decidir e documentar aqui antes de implementar).
- [ ] Cada dente tem faces (vestibular, lingual/palatina, mesial, distal, oclusal)
      com estado independente (hígido, cariado, restaurado, ausente, etc.).
- [ ] Alterações no odontograma ficam vinculadas a uma evolução do prontuário
      (data, profissional responsável).
- [ ] Odontograma é versionado — dá pra ver o estado em datas anteriores.

## Regras de negócio
A definir em detalhe — depende de validação com dentista (esposa do autor) sobre
nomenclatura e fluxo real de preenchimento antes de travar o modelo de dados.

## Modelo de domínio envolvido
`Odontograma`, `Prontuario`.

## Fora de escopo (nesta primeira versão)
- Renderização gráfica interativa avançada (pode começar com estrutura de dados
  + UI simples, evoluir a UI depois).

## Plano de testes
A detalhar junto com os critérios de aceite refinados.

## Dependências
003 (prontuário).
