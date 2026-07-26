# Plano de Execução (Ondas de Paralelismo)

Este documento organiza a ordem de implementação das specs em `specs/features/`
em "ondas": dentro de uma onda, as features não dependem umas das outras e podem
ser implementadas por agentes em paralelo (Cursor Agents Window). Entre ondas,
existe dependência — a onda seguinte só começa depois que a anterior foi
revisada e mergeada na branch principal.

## Onda 0 — Fundação (sequencial, um agente só, sem paralelismo)

Executar nesta ordem, cada passo mergeado antes do próximo:
1. Scaffold do projeto (Next.js + TypeScript + Drizzle + BetterAuth + Tailwind,
   estrutura de pastas de `specs/01-architecture.md`)
2. Integração do design system (tokens, componentes base) em `src/components`
   e configuração do Tailwind — feito antes de paralelizar, porque toda feature
   das ondas seguintes vai consumir esses componentes/tokens.
3. `specs/features/001-auth-multi-tenant.md`

Por que sequencial: praticamente toda feature depende de auth e do design
system. Paralelizar aqui geraria conflito constante nos mesmos arquivos base
(schema inicial, layout raiz, configuração do Tailwind).

## Onda 1 — Paralelizável (4 agentes simultâneos)

Depende só da Onda 0. Cada uma vive numa pasta de módulo isolada
(`core/agendamento`, `core/prontuario`+`core/anamnese`, `core/whatsapp-bot`
apenas a parte de conexão, `core/admin-plataforma`):

- `specs/features/002-agendamento.md`
- `specs/features/003-prontuario-anamnese.md`
- `specs/features/008-whatsapp-embedded-signup.md`
- `specs/features/009-admin-plataforma.md`

**Ponto de atenção**: todos os quatro provavelmente vão precisar adicionar
tabelas no schema Drizzle. Para reduzir conflito, cada agente deve criar seu
próprio arquivo (`db/schema/agendamento.ts`, `db/schema/prontuario.ts`, etc.)
em vez de editar um único arquivo de schema compartilhado — mergear o índice
que reexporta tudo (`db/schema/index.ts`) manualmente por último.

## Onda 2 — Paralelizável (3 agentes simultâneos)

Depende da Onda 1 já mergeada:

- `specs/features/006-receituario.md` (depende de 003)
- `specs/features/007-whatsapp-bot-secretaria-virtual.md` (depende de 002 e 008)
- `specs/features/010-assinatura-pagamento.md` (depende de 001 e 009)

## Onda 3 — v2, após validação clínica com a dentista de referência

Refinar os critérios de aceite (numeração de dentes, escalas) antes de
paralelizar:

- `specs/features/004-odontograma.md`
- `specs/features/005-periograma.md`

## Regra geral para todas as ondas

Antes de abrir uma onda com múltiplos agentes, confirme que a onda anterior
está mergeada na branch principal e que cada agente da nova onda parte de um
checkout atualizado dessa branch — evita retrabalho de rebase.
