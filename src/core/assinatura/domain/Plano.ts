import { DadosInvalidosError } from "@/core/shared/errors";

/**
 * Limites comerciais do plano — modelados, mas **não enforced** no MVP
 * (spec 010, decisão #9).
 */
export type LimitesDeUso = {
  maxProfissionais?: number;
  maxMensagensBotMes?: number;
};

export type PlanoProps = {
  id: string;
  nome: string;
  /** Valor mensal em reais (ex.: 99.9). */
  valorMensal: number;
  limitesDeUso: LimitesDeUso;
};

/**
 * Plano comercial da Dentyvo (spec 010 / modelo de domínio).
 */
export class Plano {
  readonly id: string;
  readonly nome: string;
  readonly valorMensal: number;
  readonly limitesDeUso: LimitesDeUso;

  private constructor(props: PlanoProps) {
    this.id = props.id;
    this.nome = props.nome;
    this.valorMensal = props.valorMensal;
    this.limitesDeUso = props.limitesDeUso;
  }

  static criar(input: {
    id: string;
    nome: string;
    valorMensal: number;
    limitesDeUso?: LimitesDeUso;
  }): Plano {
    const id = input.id.trim();
    const nome = input.nome.trim();
    if (!id) {
      throw new DadosInvalidosError("Id do plano é obrigatório.");
    }
    if (!nome) {
      throw new DadosInvalidosError("Nome do plano é obrigatório.");
    }
    if (
      typeof input.valorMensal !== "number" ||
      !Number.isFinite(input.valorMensal) ||
      input.valorMensal < 0
    ) {
      throw new DadosInvalidosError("valorMensal do plano é inválido.");
    }

    return new Plano({
      id,
      nome,
      valorMensal: input.valorMensal,
      limitesDeUso: input.limitesDeUso ?? {},
    });
  }

  static reconstituir(props: PlanoProps): Plano {
    return new Plano(props);
  }
}
