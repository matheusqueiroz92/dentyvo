# Dentyvo

Plataforma SaaS multi-tenant para clínicas e consultórios odontológicos. Digitaliza
agenda, pacientes, prontuário, odontograma, periograma, receituário, atestado e
orçamento, e oferece uma “secretária virtual” no WhatsApp (Meta Cloud API +
Embedded Signup).

O produto é **multi-tenant**: cada clínica é um tenant. Dados clínicos são
particionados por `clinicaId`. Visão de produto, personas e objetivos do MVP:
[`specs/00-overview.md`](specs/00-overview.md).

O desenvolvimento segue **SDD (Specs-Driven Development)**: funcionalidade nova
só entra com spec aprovada em [`specs/features/`](specs/features/). O fluxo de
agentes (Planejador → Arquiteto → Testes → Implementador → Revisor) está em
[`AGENTS.md`](AGENTS.md). Tokens, componentes e regras de UI:
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Stack

| Camada | Tecnologia |
|---|---|
| App | Next.js (App Router) + TypeScript |
| Hospedagem | Vercel (sem Docker) |
| Banco | PostgreSQL (Neon / Vercel Postgres) + Drizzle ORM |
| Auth | Better Auth |
| Validação / actions | Zod + next-safe-action |
| UI | ShadCN/ui, Tailwind, Lucide, tokens em `docs/DESIGN_SYSTEM.md` |
| Formulários / tabelas | React Hook Form, TanStack Table, TanStack Query |
| WhatsApp | Meta Cloud API (Embedded Signup) |
| Pagamentos | Asaas (PIX) |
| Arquivos | Vercel Blob |
| Jobs / rate limit | Upstash QStash, Vercel Cron, Upstash Redis |
| Testes | Vitest (unitário + componente) e Playwright (e2e) |

Arquitetura hexagonal (Ports & Adapters) + DDD por módulo em `src/core`. Detalhes
para manutenção: [`docs/README.md`](docs/README.md) e
[`specs/01-architecture.md`](specs/01-architecture.md).

## Rodar localmente

Requisito: Node.js 20+.

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local`. A lista canônica das variáveis (e o que cada uma faz)
está em [`.env.example`](.env.example). Mínimo para o app subir:

- `DATABASE_URL` — Postgres da aplicação
- `DATABASE_URL_MIGRATIONS` — conexão **direta** (sem pooler), usada pelo
  Drizzle Kit e por `node scripts/migrate.mjs`
- `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` (em local, em geral `http://localhost:3000`)

Opcional conforme o fluxo: Google OAuth, Meta WhatsApp, Asaas, Blob, Upstash,
Turnstile. Sem Turnstile, o CAPTCHA do link público só faz bypass em
`NODE_ENV=development`.

Aplique o schema e suba o servidor:

```bash
npm run db:generate
node scripts/migrate.mjs
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Documentação OpenAPI (só fora de produção): [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Next.js em desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run test` (alias `test:unit`) | Vitest — `*.test.ts` (node) e `*.test.tsx` (jsdom) |
| `npm run test:watch` | Vitest em watch |
| `npm run test:e2e` | Playwright (`e2e/`). Exige `DATABASE_URL_E2E` **diferente** de `DATABASE_URL`. Uma vez: `npx playwright install chromium` |
| `npm run db:generate` | gera migrations Drizzle a partir de `src/db/schema` |
| `npm run db:migrate` | CLI Drizzle Kit |
| `node scripts/migrate.mjs` | aplica migrations no banco real (preferido em Windows/Neon; usa `DATABASE_URL_MIGRATIONS`) |

## Estrutura de pastas

```
specs/                 especificações (SDD) — o que construir
  00-overview.md
  01-architecture.md
  02-domain-model.md
  features/            uma spec por funcionalidade
src/
  core/<modulo>/       domínio hexagonal
    domain/            entidades e regras (sem Next.js, Drizzle, fetch)
    application/
      use-cases/       uma ação de negócio por arquivo
      ports/           interfaces
    infra/adapters/    banco, APIs, filas
  app/                 rotas Next.js (delivery, sem regra de negócio)
  actions/             server actions → use cases
  components/          ui/ (ShadCN) e domain/ (clínicos)
  db/                  schema Drizzle + migrations
  lib/                 auth, Swagger, utilitários
docs/                  design system e índice de manutenção
AGENTS.md              papéis e ordem dos agentes
.cursor/rules/         regras carregadas automaticamente no Cursor
skills/                guias (hexagonal, TDD, domínio odontológico, UI)
```

Mapa de camadas e módulos: [`docs/README.md`](docs/README.md).

## Documentação

- Processo de desenvolvimento: [`AGENTS.md`](AGENTS.md)
- Design system: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- Manutenção / arquitetura (índice, sem copiar a spec): [`docs/README.md`](docs/README.md)
- Specs: [`specs/00-overview.md`](specs/00-overview.md), [`specs/01-architecture.md`](specs/01-architecture.md), [`specs/02-domain-model.md`](specs/02-domain-model.md)
