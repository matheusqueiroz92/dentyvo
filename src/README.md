# src/

Código-fonte. Visão geral do repo: [`README.md`](../README.md).
Mapa de camadas e módulos: [`docs/README.md`](../docs/README.md).
Regras estruturais: [`specs/01-architecture.md`](../specs/01-architecture.md).

```
src/
├── app/          # rotas Next.js (delivery)
├── actions/      # server actions → use-cases
├── components/   # ui/ (shadcn) e domain/ (clínicos)
├── core/         # módulos hexagonais (domain / application / infra)
├── db/           # Drizzle schema + migrations
└── lib/          # auth, Swagger, utilitários
```

Não implemente feature de negócio sem spec aprovada em `specs/features/`.
