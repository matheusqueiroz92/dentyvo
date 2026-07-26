# Skill: Workflow de TDD neste projeto

Use esta skill sempre que for implementar uma feature a partir de uma spec em
`specs/features/`.

## Passo a passo

1. Abra a spec da feature e liste os "Critérios de aceite" — cada um vira pelo
   menos um teste.
2. Comece pelo domínio: escreva testes unitários puros para as regras de negócio
   mais críticas ANTES de escrever a entidade/regra em si.
   - Rode os testes, confirme que falham (red) — se não falharem, o teste não
     está testando nada novo.
3. Implemente o mínimo em `domain/` para passar (green).
4. Suba pra `application/`: escreva teste do caso de uso com ports mockadas
   (ex: repositório em memória/fake), cobrindo o critério de aceite.
5. Implemente o caso de uso (green).
6. Só depois disso, implemente o adapter real em `infra/` com teste de
   integração (pode usar banco de teste).
7. Refatore com os testes verdes protegendo a mudança.

## Convenção de nomes de teste

Descreva comportamento de negócio, não implementação:

```ts
// bom
it("não permite marcar consulta sobreposta para o mesmo profissional", () => { ... });

// ruim
it("chama o repositório com os parâmetros corretos", () => { ... });
```

## Estrutura sugerida de arquivo de teste

```
src/core/agendamento/domain/Agendamento.test.ts
src/core/agendamento/application/use-cases/MarcarConsulta.test.ts
src/core/agendamento/infra/adapters/DrizzleAgendamentoRepository.integration.test.ts
```

## Quando parar e perguntar

Se um critério de aceite da spec não for específico o suficiente para virar um
teste objetivo (ex: "sistema deve ser rápido"), pare e sinalize a ambiguidade em
vez de inventar um número/threshold arbitrário.
