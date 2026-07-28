import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { assertDuracaoValida } from "./duracao";

export type ProcedimentoProps = {
  id: string;
  clinicaId: string;
  nome: string;
  duracaoPadraoMinutos: number;
  valor: number;
};

export class Procedimento {
  readonly id: string;
  readonly clinicaId: string;
  readonly nome: string;
  readonly duracaoPadraoMinutos: number;
  readonly valor: number;

  private constructor(props: ProcedimentoProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.nome = props.nome;
    this.duracaoPadraoMinutos = props.duracaoPadraoMinutos;
    this.valor = props.valor;
  }

  static criar(input: {
    id: string;
    clinicaId: string;
    nome: string;
    duracaoPadraoMinutos: number;
    valor: number;
  }): Procedimento {
    const nome = input.nome.trim();
    if (!nome) {
      throw new DadosInvalidosError("Nome do procedimento é obrigatório.");
    }
    assertDuracaoValida(input.duracaoPadraoMinutos);
    if (!Number.isFinite(input.valor) || input.valor < 0) {
      throw new DadosInvalidosError("Valor do procedimento deve ser >= 0.");
    }

    return new Procedimento({
      id: input.id,
      clinicaId: input.clinicaId,
      nome,
      duracaoPadraoMinutos: input.duracaoPadraoMinutos,
      valor: input.valor,
    });
  }

  static reconstituir(props: ProcedimentoProps): Procedimento {
    return new Procedimento(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }
}
