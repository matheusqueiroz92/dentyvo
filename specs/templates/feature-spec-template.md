# [NNN] — [Nome da Feature]

## Status
`rascunho` | `aprovada` | `em desenvolvimento` | `concluída`

## Contexto
Por que essa feature existe. Que problema resolve, para qual persona.

## User story
Como [persona], quero [ação], para [benefício].

## Critérios de aceite
Lista objetiva e testável (cada item deve virar um teste):
- [ ] ...
- [ ] ...

## Regras de negócio
Regras de domínio específicas desta feature (o que NÃO pode acontecer, invariantes).

## Modelo de domínio envolvido
Quais entidades de `specs/02-domain-model.md` são usadas/criadas/alteradas.

## Casos de uso (application layer)
Lista dos casos de uso a implementar, com assinatura de alto nível:
- `NomeDoCasoDeUso(input) → output`

## Ports necessárias
Interfaces que a application vai depender (implementadas depois em infra/adapters).

## Contrato de API / Server Action (se aplicável)
Rota, método, payload de entrada/saída.

## Fora de escopo
O que essa spec explicitamente não cobre (evita scope creep durante implementação).

## Plano de testes
- Testes de domínio: ...
- Testes de aplicação (use case): ...
- Testes de integração (adapter): ...
- Testes de contrato/e2e (se crítico): ...

## Dependências
Outras specs/features que precisam existir antes desta.
