# Multi-Agent Workflow (SDD)

Este projeto usa múltiplos agentes especializados no Cursor. Cada um tem escopo e
responsabilidade limitados — não misture papéis num único prompt/sessão longa.
Sempre referencie a spec relevante (`specs/features/NNN-*.md`) no início do prompt.

## Ordem de execução por funcionalidade nova

```
1. Planejador          → gera/atualiza a spec da feature
2. (você aprova a spec manualmente)
3. Arquiteto de Domínio → define/ajusta entidades, ports e casos de uso (sem implementar infra)
4. Engenheiro de Testes → escreve os testes a partir da spec, ANTES da implementação
5. Implementador        → implementa até os testes passarem (TDD: red → green → refactor)
6. Revisor              → checa SOLID, DRY, aderência à arquitetura hexagonal e à spec
```

## Papéis

### 1. Planejador (Planner)
**Objetivo:** transformar um pedido informal em uma spec estruturada.
**Não faz:** não escreve código, não define schema de banco.
**Prompt-base sugerido:**
> "Aja como o agente Planejador. Leia `specs/templates/feature-spec-template.md` e
> `specs/00-overview.md`. Gere a spec para a funcionalidade [X] em
> `specs/features/NNN-nome.md`, preenchendo todas as seções do template.
> Não implemente nada."

### 2. Arquiteto de Domínio (Domain Architect)
**Objetivo:** traduzir a spec aprovada em entidades de domínio, ports (interfaces) e
casos de uso, respeitando `specs/01-architecture.md` e `specs/02-domain-model.md`.
**Não faz:** não implementa adapters de infraestrutura (banco, API externa) nem UI.
**Prompt-base sugerido:**
> "Aja como o Arquiteto de Domínio. Use a skill `skills/hexagonal-architecture/SKILL.md`.
> A partir da spec `specs/features/NNN-nome.md`, defina as entidades de domínio,
> as interfaces de port necessárias e a assinatura dos casos de uso em
> `src/core/<modulo>/domain` e `src/core/<modulo>/application`. Não implemente infra."

### 3. Engenheiro de Testes (Test Engineer)
**Objetivo:** escrever testes unitários (domínio/aplicação) e de integração
(adapters) ANTES do código de produção, cobrindo os critérios de aceite da spec.
**Prompt-base sugerido:**
> "Aja como o Engenheiro de Testes. Use a skill `skills/tdd-workflow/SKILL.md`.
> A partir da spec `specs/features/NNN-nome.md` e das interfaces já definidas em
> `src/core/<modulo>`, escreva os testes que ainda devem falhar (red). Não implemente
> a lógica de produção."

### 4. Implementador (Implementer)
**Objetivo:** fazer os testes passarem com a implementação mais simples possível
(green), depois refatorar mantendo os testes verdes (refactor).
**Prompt-base sugerido:**
> "Aja como o Implementador. Os testes em `<caminho>` estão falhando. Implemente o
> código mínimo necessário para passá-los, seguindo SOLID e DRY, sem alterar os
> testes. Depois, refatore se necessário mantendo os testes verdes."

### 5. Revisor (Reviewer)
**Objetivo:** revisar aderência arquitetural antes do merge.
**Checklist:**
- [ ] Regra de negócio está em `domain/`, não vazou pra `infra/` ou UI?
- [ ] Casos de uso dependem de ports (interfaces), não de implementações concretas?
- [ ] Cobertura de teste corresponde aos critérios de aceite da spec?
- [ ] Sem duplicação de lógica já existente em outro módulo (DRY)?
- [ ] Nomenclatura segue `specs/02-domain-model.md`?

## Regras gerais para todos os agentes

- Nunca implemente uma funcionalidade sem spec aprovada em `specs/features/`.
- Nunca pule TDD: teste vermelho antes de código de produção.
- Se uma spec estiver ambígua ou incompleta, pare e sinalize — não assuma.
- Mantenha `domain/` livre de dependências de framework (sem imports de Next.js,
  Drizzle, etc. dentro de `domain/`).
