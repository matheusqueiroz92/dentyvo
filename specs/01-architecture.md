# Arquitetura

Ver também `.cursor/rules/architecture.mdc` (regras aplicadas automaticamente pelos
agentes) e `skills/hexagonal-architecture/SKILL.md` (guia detalhado com exemplos).

## Estilo arquitetural

Monólito modular em Next.js (App Router) + TypeScript, com Arquitetura Hexagonal
(Ports & Adapters) e DDD por módulo, replicando o padrão do projeto de referência
M. Agendy.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Hospedagem | Vercel (deploy direto do repositório, sem Docker) |
| Banco | PostgreSQL gerenciado (Neon / Vercel Postgres) + Drizzle ORM |
| Auth | BetterAuth (multi-tenant) |
| Validação | Zod |
| Server actions | next-safe-action |
| UI | ShadCN/ui + Tailwind |
| Integração WhatsApp | Meta WhatsApp Cloud API (Embedded Signup) — webhook como rota serverless normal |
| Jobs assíncronos/agendados | Upstash QStash (lembretes, renovação de token) + Vercel Cron Jobs (tarefas periódicas simples) |
| Testes | Vitest (unitário) + testes de integração para adapters |

## Sobre hospedagem e Docker

Este projeto **não usa Docker** em nenhuma etapa (dev ou produção). A Vercel builda
e roda o Next.js diretamente; o banco é um serviço gerenciado (connection string
única para dev e produção); o bot de WhatsApp usa a Cloud API oficial da Meta, que
é só um webhook HTTP — não exige processo persistente como exigiria uma lib não
oficial (ex: Baileys). Isso elimina a necessidade de container tanto para a
aplicação quanto para a integração de WhatsApp. Reavaliar Docker só se o projeto
crescer para múltiplos serviços com necessidade de ambiente 100% reprodutível em
equipe, ou para bancos efêmeros em CI.

## Multi-tenancy

Cada clínica é um tenant. Todo dado clínico (paciente, prontuário, agendamento)
é particionado por `clinica_id`. Toda query de domínio deve ser escopada por
tenant — nunca confiar apenas em filtro de UI.

## Estrutura de pastas (visão de projeto)

```
src/
├── app/                     # rotas (delivery layer)
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│       └── whatsapp/
│           └── webhook/route.ts
├── actions/                 # server actions (chamam use-cases)
├── components/
├── core/
│   ├── auth/
│   ├── clinica/
│   ├── agendamento/
│   ├── prontuario/
│   ├── anamnese/
│   ├── odontograma/         # v2
│   ├── periograma/          # v2
│   ├── receituario/
│   ├── whatsapp-bot/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── admin-plataforma/
│   └── assinatura/
├── db/
│   ├── schema/
│   └── migrations/
└── lib/
```

## Módulos e responsabilidades

- `core/auth`: autenticação, sessão, RBAC (dentista, recepção, admin).
- `core/clinica`: cadastro de clínica (tenant), profissionais vinculados.
- `core/agendamento`: disponibilidade, marcação, remarcação, cancelamento,
  lembretes.
- `core/prontuario`: histórico clínico do paciente, evoluções.
- `core/anamnese`: formulário estruturado de anamnese odontológica.
- `core/receituario`: geração de receitas a partir de modelo.
- `core/whatsapp-bot`: integração com Meta Cloud API (conexão da clínica via
  Embedded Signup, recebimento/roteamento de mensagens, máquina de estados da
  conversa). Ver `specs/features/007-whatsapp-bot-secretaria-virtual.md` e
  `specs/features/008-whatsapp-embedded-signup.md`.
- `core/admin-plataforma`: gestão cross-tenant (super-admin) de clínicas e
  usuários. Ver `specs/features/009-admin-plataforma.md`.
- `core/assinatura`: assinatura, cobrança e controle de acesso por status de
  pagamento (gateway nacional com PIX). Ver
  `specs/features/010-assinatura-pagamento.md`.

## Fluxo de dependência

```
app/ (rotas) ──► actions/ ──► core/<modulo>/application/use-cases ──► core/<modulo>/domain
                                        │
                                        ▼
                              core/<modulo>/application/ports (interface)
                                        ▲
                                        │ implementa
                              core/<modulo>/infra/adapters
```
