# Dentyvo

Plataforma SaaS multi-tenant para clínicas e consultórios odontológicos, cobrindo
agendamento, prontuário eletrônico, odontograma, periograma, receituário e um
"secretária virtual" via WhatsApp (Meta Cloud API + Embedded Signup).

Este repositório é desenvolvido com **SDD (Specs-Driven Development)**: nenhuma
linha de código de funcionalidade é escrita antes de existir uma spec aprovada em
`specs/features/`. Os agentes do Cursor devem ler as specs antes de implementar.

## Como usar este esqueleto no Cursor

1. Abra este diretório como projeto no Cursor.
2. As regras em `.cursor/rules/*.mdc` são carregadas automaticamente e valem para
   qualquer agente/chat dentro do projeto — definem arquitetura, UI, TDD, SOLID/DRY e
   convenções de nomenclatura.
3. Leia `AGENTS.md` — define os papéis de agente (Planejador, Arquiteto de Domínio,
   Implementador, Engenheiro de Testes, Revisor) e a ordem de execução.
4. Para cada nova funcionalidade:
   - Primeiro peça ao agente **Planejador** para gerar/revisar a spec em
     `specs/features/NNN-nome-da-feature.md`, usando `specs/templates/feature-spec-template.md`.
   - Só depois da spec aprovada por você, peça ao agente **Implementador** para
     implementar seguindo TDD (testes antes do código de produção).
5. As `skills/` contêm guias reutilizáveis (arquitetura hexagonal, workflow de TDD,
   modelagem de domínio odontológico) — referencie-as explicitamente nos prompts
   dos agentes quando precisar reforçar um padrão.

## Stack (herdada do M. Agendy)

- Next.js (App Router) + TypeScript
- Arquitetura Hexagonal (Ports & Adapters) + DDD — regra de negócio em `src/core`,
  independente de framework
- Drizzle ORM + PostgreSQL
- BetterAuth (autenticação multi-tenant)
- Zod (validação) + next-safe-action (server actions tipadas)
- ShadCN/ui + Tailwind
- Meta WhatsApp Cloud API (Embedded Signup) para o bot "secretária virtual"
- AWS Lambda / serverless para jobs assíncronos (lembretes, processamento de webhook)
- Testes: Vitest (unitário + componente) e Playwright (e2e) seguindo TDD

## Testes

### Camada 1 — unitário e componentes (`test:unit`)

Vitest com dois projetos:

- **node** — `src/**/*.test.ts` (domínio, use cases, adapters)
- **jsdom** — `src/**/*.test.tsx` (formulários React + Testing Library)

```bash
npm run test:unit
# ou, equivalente:
npm run test
```

### Camada 2 — e2e (`test:e2e`)

Playwright sobe `next dev` com `DATABASE_URL` apontando para `DATABASE_URL_E2E`
(branch Neon de teste). Defina a variável em `.env.local` — **nunca** use o
mesmo banco de desenvolvimento.

```bash
# Uma vez (browsers do Playwright)
npx playwright install chromium

# Rodar os fluxos críticos de autenticação
npm run test:e2e
```

Os specs ficam em `e2e/`. Dados de clínica usam timestamp + CPF válido por
execução (mesmo padrão de `scripts/teste-integracao-manual.mjs`) para permitir
reexecução sem colisão. Login real com Google **não** entra no e2e; o fluxo
unificado de sessão social/onboarding é coberto em
`src/lib/auth-sessao-social.test.ts` e `src/lib/auth-destino.test.ts`.
Proteção contra account takeover no linking (conta completa não verificada)
está em `src/lib/auth-linking-risco.test.ts`.

## Estrutura de pastas

```
specs/                  → especificações (SDD) — fonte de verdade do que construir
  00-overview.md         → visão de produto, personas, objetivos
  01-architecture.md      → padrões de arquitetura e estrutura de código
  02-domain-model.md      → entidades e regras de negócio centrais
  templates/               → modelo de spec de feature
  features/                → uma spec por funcionalidade
.cursor/rules/           → regras carregadas automaticamente pelos agentes do Cursor
skills/                   → guias reutilizáveis por assunto (SKILL.md)
src/                      → código-fonte (a ser criado pelos agentes, seguindo specs/01-architecture.md)
```
