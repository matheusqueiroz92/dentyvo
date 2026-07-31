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
| Estilo | Tailwind CSS (tokens em `docs/DESIGN_SYSTEM.md`) |
| Frontend | ver **Stack de frontend** abaixo |
| Integração WhatsApp | Meta WhatsApp Cloud API (Embedded Signup) — webhook como rota serverless normal |
| Jobs assíncronos/agendados | Upstash QStash (lembretes, renovação de token) + Vercel Cron Jobs (tarefas periódicas simples) |
| Armazenamento de arquivos | **Vercel Blob Storage** — ver seção abaixo |
| Testes | Vitest (unitário) + testes de integração para adapters |

## Stack de frontend

Decisão finalizada. Camadas client-side da UI:

| Camada | Tecnologia |
|---|---|
| Componentes UI | ShadCN/ui (gerado via CLI, customizado com os tokens do `docs/DESIGN_SYSTEM.md`) |
| Formulários | React Hook Form + Zod (via `@hookform/resolvers/zod`) |
| Data fetching client-side / cache | TanStack Query — escopo: polling de notificações (011), listagens com busca/filtro/paginação client-side. **Não** substitui RSC + Server Actions para carregamento inicial de página. |
| Tabelas/grids | TanStack Table, para os requisitos da seção "Table / Data Grid" de `docs/DESIGN_SYSTEM.md` (ordenação, filtro, paginação, colunas configuráveis) |
| Animação | Motion (`motion/react`) + Lenis (smooth scroll) |
| Ícones | Lucide React |

### Débito técnico — migração ShadCN

**Resolvido:** primitives da landing (`Button`, `Badge`, `Card`, `Accordion`) migrados para ShadCN (CLI + tokens do design system). `ButtonLink` e `PricingCard` permanecem wrappers de domínio sobre esses primitives.

## Sobre hospedagem e Docker

Este projeto **não usa Docker** em nenhuma etapa (dev ou produção). A Vercel builda
e roda o Next.js diretamente; o banco é um serviço gerenciado (connection string
única para dev e produção); o bot de WhatsApp usa a Cloud API oficial da Meta, que
é só um webhook HTTP — não exige processo persistente como exigiria uma lib não
oficial (ex: Baileys). Isso elimina a necessidade de container tanto para a
aplicação quanto para a integração de WhatsApp. Reavaliar Docker só se o projeto
crescer para múltiplos serviços com necessidade de ambiente 100% reprodutível em
equipe, ou para bancos efêmeros em CI.

## Armazenamento de arquivos (Vercel Blob)

**Decisão:** uploads binários usam **Vercel Blob Storage** (SDK `@vercel/blob`),
alinhado à hospedagem na Vercel e sem serviço de object storage separado no MVP.

### Uso imediato — logo da clínica

- A entidade `Clinica` persiste apenas `logoUrl` (string | null) — a URL pública
  retornada pelo Blob após o upload.
- Fluxo na delivery: server action autenticada (admin) faz o upload no Blob →
  recebe a URL → chama `AtualizarLogoClinica(clinicaId, logoUrl)`.
- O domínio/use case **não** conhece o Blob; a port de persistência continua
  sendo `ClinicaRepositoryPort` (só metadados/URL). Se no futuro o upload
  precisar ser testável/isolado, extrair `ArmazenamentoArquivoPort` na
  application — não obrigatório no primeiro green.

### Reaproveitamento futuro — anexos de prontuário

A mesma infraestrutura (Vercel Blob + padrão “upload na delivery → URL no
domínio”) **poderá ser reaproveitada** para anexos clínicos quando forem
especificados — por exemplo atestados escaneados, imagens anexas a evolução,
etc. Até haver spec formal de anexos:

- **não** criar tabela/entidade de anexo “por antecipação”;
- ao especificar, preferir reutilizar Blob e o mesmo padrão de URL + escopo
  por `clinicaId` / paciente, com RBAC e LGPD próprios do prontuário.

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
