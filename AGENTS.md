# Multi-Agent Workflow (SDD)

Este projeto usa múltiplos agentes especializados no Cursor. Cada um tem escopo e
responsabilidade limitados — não misture papéis num único prompt/sessão longa.
Sempre referencie a spec relevante (`specs/features/NNN-*.md`) no início do prompt.

## Ordem de execução por funcionalidade nova

```
1. Planejador          → gera/atualiza a spec da feature
2. (você aprova a spec manualmente)
3. Arquiteto de Domínio → domínio + ports + assinaturas de use case
   (corpo = `CasoDeUsoNaoImplementadoError`; sem orquestração nem infra)
4. Engenheiro de Testes → testes a partir da spec (red — ainda devem falhar)
5. Implementador        → corpo dos use cases + adapters até green / refactor
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
assinaturas de casos de uso, respeitando `specs/01-architecture.md` e
`specs/02-domain-model.md`.
**Faz:**
- Entidades / value objects / erros / invariantes em `domain/` (regras
  testáveis sem infra).
- Interfaces em `application/ports/`.
- Casos de uso em `application/use-cases/`: **apenas** tipo de input,
  constructor com ports e método `executar` que lança
  `CasoDeUsoNaoImplementadoError` (stub) — mesmo que a orquestração pareça
  óbvia.
**Não faz:**
- Não implementa o **corpo** dos use cases (orquestração real).
- Não implementa adapters de infraestrutura (banco, API externa) nem UI.
- Não “adianta” o green do Implementador.

> **Lição 011:** nesta feature o Arquiteto preencheu o corpo completo dos
> use cases e o Engenheiro de Testes nasceu em green — os testes tenderam a
> espelhar o código já escrito em vez dos critérios de aceite. **Não repetir.**
> O red existe para garantir que os testes nascem da spec.

**Prompt-base sugerido:**
> "Aja como o Arquiteto de Domínio. Use a skill `skills/hexagonal-architecture/SKILL.md`.
> A partir da spec `specs/features/NNN-nome.md`, defina as entidades de domínio,
> as interfaces de port necessárias e a **assinatura** dos casos de uso em
> `src/core/<modulo>/domain` e `src/core/<modulo>/application` (corpo de
> `executar` = `throw new CasoDeUsoNaoImplementadoError(...)`). Não implemente
> a orquestração dos use cases nem infra."

### 3. Engenheiro de Testes (Test Engineer)
**Objetivo:** escrever testes unitários (domínio/aplicação) e de integração
(adapters) ANTES do código de produção, cobrindo os critérios de aceite da spec.
Os testes de use case devem falhar (red) com `CasoDeUsoNaoImplementadoError`
(ou comportamento ainda ausente) — se já passam, o Arquiteto ultrapassou o
escopo; pare e sinalize.
**Prompt-base sugerido:**
> "Aja como o Engenheiro de Testes. Use a skill `skills/tdd-workflow/SKILL.md`.
> A partir da spec `specs/features/NNN-nome.md` e das interfaces já definidas em
> `src/core/<modulo>`, escreva os testes que ainda devem falhar (red). Não implemente
> a lógica de produção."

### 4. Implementador (Implementer)
**Objetivo:** fazer os testes passarem com a implementação mais simples possível
(green), depois refatorar mantendo os testes verdes (refactor) — incluindo
substituir `CasoDeUsoNaoImplementadoError` pelo corpo real dos use cases.
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
- Nunca pule TDD: teste vermelho antes de código de produção na
  `application/` (use cases stub com `CasoDeUsoNaoImplementadoError` até o
  Implementador).
- Arquiteto **não** implementa corpo de use case — só assinatura + stub;
  Engenheiro de Testes escreve red a partir da **spec**; Implementador faz
  green.
- Se uma spec estiver ambígua ou incompleta, pare e sinalize — não assuma.
- Mantenha `domain/` livre de dependências de framework (sem imports de Next.js,
  Drizzle, etc. dentro de `domain/`).
