# Skill: Arquitetura Hexagonal + DDD neste projeto

Use esta skill sempre que for criar um módulo novo em `src/core`, definir uma
entidade de domínio, um caso de uso ou um adapter.

## Checklist ao criar um módulo novo

1. Crie `domain/`, `application/{use-cases,ports}/`, `infra/adapters/`.
2. Modele a(s) entidade(s) em `domain/` como classes/tipos puros — sem import de
   Next.js, Drizzle, fetch, etc. Regras de negócio (invariantes) vivem aqui como
   métodos da entidade ou funções puras, não em `application/`.
3. Para cada ação de negócio, crie um caso de uso em
   `application/use-cases/NomeDaAcao.ts`. Um caso de uso:
   - Recebe um input já validado (Zod acontece antes, na action/rota).
   - Depende só de `ports` (interfaces), nunca de um adapter concreto.
   - Retorna um resultado ou lança um erro de domínio específico.
4. Defina as `ports` necessárias em `application/ports/` como interfaces TypeScript.
5. Implemente os adapters concretos em `infra/adapters/`, satisfazendo as ports.
6. Amarre tudo na camada mais externa (`src/actions` ou `src/app/api`), que
   instancia o adapter concreto e injeta no caso de uso.

## Exemplo mínimo (padrão a seguir)

```ts
// domain/Agendamento.ts
export class Agendamento {
  constructor(
    readonly id: string,
    readonly profissionalId: string,
    readonly inicio: Date,
    readonly fim: Date,
  ) {}

  sobrepoe(outro: Agendamento): boolean {
    return this.profissionalId === outro.profissionalId &&
      this.inicio < outro.fim && outro.inicio < this.fim;
  }
}

// application/ports/AgendamentoRepositoryPort.ts
export interface AgendamentoRepositoryPort {
  buscarPorProfissionalEData(profissionalId: string, data: Date): Promise<Agendamento[]>;
  salvar(agendamento: Agendamento): Promise<void>;
}

// application/use-cases/MarcarConsulta.ts
export class MarcarConsulta {
  constructor(private repo: AgendamentoRepositoryPort) {}

  async executar(input: MarcarConsultaInput): Promise<Agendamento> {
    const existentes = await this.repo.buscarPorProfissionalEData(
      input.profissionalId, input.data,
    );
    const novo = new Agendamento(gerarId(), input.profissionalId, input.inicio, input.fim);
    if (existentes.some((a) => a.sobrepoe(novo))) {
      throw new HorarioIndisponivelError(input.profissionalId, input.inicio);
    }
    await this.repo.salvar(novo);
    return novo;
  }
}

// infra/adapters/DrizzleAgendamentoRepository.ts
export class DrizzleAgendamentoRepository implements AgendamentoRepositoryPort {
  // implementação real com Drizzle
}
```

## Erros comuns a evitar

- Colocar validação de sobreposição de horário dentro do adapter Drizzle
  (ex: só como constraint de banco) sem também ter a regra no domínio — a regra
  de negócio deve ser testável sem banco.
- Caso de uso chamando `fetch`/Drizzle diretamente em vez de depender de uma port.
- Entidade de domínio com métodos que devolvem tipos do Next.js/Drizzle (acopla
  o domínio ao framework).
