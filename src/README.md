# src/

Código-fonte seguindo:

- `specs/01-architecture.md` (estrutura de pastas obrigatória)
- `.cursor/rules/*.mdc` (regras aplicadas automaticamente)
- `skills/hexagonal-architecture/SKILL.md` (padrão de implementação de módulo)

```
src/
├── app/          # rotas Next.js (delivery)
├── actions/      # server actions → use-cases
├── components/   # ui/ (shadcn) e domain/ (clínicos)
├── core/         # módulos hexagonais (domain / application / infra)
├── db/           # Drizzle schema + migrations
└── lib/          # auth, tokens, utilitários
```

Não implemente features de negócio sem spec aprovada em `specs/features/`.
