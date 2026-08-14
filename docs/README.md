# Documentação para manutenção

Este diretório guarda o design system e este índice. **Decisões arquiteturais
canônicas** não moram aqui — estão em
[`specs/01-architecture.md`](../specs/01-architecture.md). Não copie essa spec:
se ela mudar, este arquivo só precisa continuar apontando para o lugar certo.

## Onde olhar

| Precisa de | Vá em |
|---|---|
| Por que hexagonal, stack, Blob, multi-tenant, pastas do monólito | [`specs/01-architecture.md`](../specs/01-architecture.md) |
| Entidades e termos do domínio (português) | [`specs/02-domain-model.md`](../specs/02-domain-model.md) |
| Critérios de aceite de uma feature | [`specs/features/`](../specs/features/) |
| Como os agentes devem trabalhar | [`AGENTS.md`](../AGENTS.md) |
| Tokens, layout, estados de UI | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) |
| Como implementar um módulo novo | [`skills/hexagonal-architecture/SKILL.md`](../skills/hexagonal-architecture/SKILL.md) |
| Ciclo red/green/refactor | [`skills/tdd-workflow/SKILL.md`](../skills/tdd-workflow/SKILL.md) |
| Subir o projeto | [`README.md`](../README.md) |

Regras do Cursor (arquitetura, UI, TDD, SOLID) em `.cursor/rules/*.mdc` — aplicadas
em todo chat do repositório.

## Camadas (resumo operacional)

Dependência aponta para dentro. `domain/` não importa Next.js, Drizzle nem `fetch`.

```
src/app (rotas) e src/actions (Zod + chamada)
        → src/core/<modulo>/application/use-cases
                → domain (regras)
                → ports (interfaces)
                      ↑ implementa
                infra/adapters (Postgres, Meta, Asaas, …)
```

- **Delivery** (`src/app`, `src/actions`): validação de entrada e orquestração
  HTTP/UI. Sem regra de negócio.
- **Application**: um arquivo por caso de uso; depende só de ports.
- **Infra**: adapters. Composition root típica: `create-<modulo>-module.ts`.
- **UI**: primitives em `src/components/ui`; clínicos em `src/components/domain`.

## Módulos em `src/core`

Cada pasta segue `domain/` + `application/` + `infra/`. Módulos atuais:

| Módulo | Papel |
|---|---|
| `auth` | sessão, clínica, profissionais, RBAC intra-tenant |
| `agendamento` | disponibilidade, consultas, link público |
| `paciente` | cadastro e consentimento LGPD |
| `prontuario` | prontuário, evoluções, auditoria |
| `anamnese` | anamnese estruturada |
| `odontograma` / `periograma` | registros clínicos por dente / sondagem |
| `receituario` / `atestado` | documentos imutáveis + PDF |
| `orcamento` | orçamento vinculado ao prontuário |
| `whatsapp-bot` | conexão Embedded Signup e conta da clínica |
| `notificacao` | in-app / canais |
| `assinatura` | plano, cobrança Asaas, bloqueio de acesso |
| `admin-plataforma` | super-admin cross-tenant |
| `shared` | erros e tipos compartilhados |

Nomes de entidade, use case e tabela seguem
[`specs/02-domain-model.md`](../specs/02-domain-model.md).

## Contratos HTTP

Rotas em `src/app/api/**` com JSDoc `@swagger`. A UI em `/api-docs` só existe
fora de produção (404 em `NODE_ENV=production`). Agendamento pelo link
`/agendar/[slug]` é página + Server Action, não REST.

## Schema

Alteração de tabela: editar `src/db/schema` → `npm run db:generate` →
`node scripts/migrate.mjs` (usa `DATABASE_URL_MIGRATIONS`, conexão direta).
Não inventar tabela “por antecipação” — só o que a spec da feature pedir.
