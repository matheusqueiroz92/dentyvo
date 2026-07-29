import { DadosInvalidosError } from "@/core/shared/errors";

import {
  DURACAO_PROMOCAO_LANCAMENTO_MESES,
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
} from "./constants";

export type VagaPromocionalProps = {
  /** Posição 1..30 no cupom de lançamento (PK no banco). */
  posicao: number;
  clinicaId: string;
  /** Assinatura que originou a reserva (D8 — `CriarAssinatura`). */
  assinaturaId: string;
  reservadaEm: Date;
};

/**
 * Fonte de verdade da reserva promocional de lançamento (spec 012, D6).
 * Campos promocionais em `Assinatura` são cópia operacional feita na criação.
 *
 * Cancelamento **não** libera a posição (D5) — a vaga permanece registrada.
 */
export class VagaPromocional {
  readonly posicao: number;
  readonly clinicaId: string;
  readonly assinaturaId: string;
  readonly reservadaEm: Date;

  private constructor(props: VagaPromocionalProps) {
    this.posicao = props.posicao;
    this.clinicaId = props.clinicaId;
    this.assinaturaId = props.assinaturaId;
    this.reservadaEm = props.reservadaEm;
  }

  /**
   * Factory de domínio (validação de invariantes).
   * A atribuição atômica de `posicao` é responsabilidade do adapter
   * (`INSERT … SELECT` — D3); aqui só validamos o resultado.
   */
  static criar(input: VagaPromocionalProps): VagaPromocional {
    const clinicaId = input.clinicaId.trim();
    const assinaturaId = input.assinaturaId.trim();
    if (!clinicaId) {
      throw new DadosInvalidosError("clinicaId da vaga promocional é obrigatório.");
    }
    if (!assinaturaId) {
      throw new DadosInvalidosError(
        "assinaturaId da vaga promocional é obrigatório.",
      );
    }
    assertPosicaoValida(input.posicao);
    assertDataValida(input.reservadaEm, "reservadaEm");

    return new VagaPromocional({
      posicao: input.posicao,
      clinicaId,
      assinaturaId,
      reservadaEm: input.reservadaEm,
    });
  }

  static reconstituir(props: VagaPromocionalProps): VagaPromocional {
    return new VagaPromocional(props);
  }

  /**
   * Fim do benefício: `reservadaEm` + 12 meses corridos (D8).
   * Usado para copiar `precoPromocionalAte` na Assinatura na criação.
   */
  calcularPrecoPromocionalAte(): Date {
    return adicionarMesesCorridos(
      this.reservadaEm,
      DURACAO_PROMOCAO_LANCAMENTO_MESES,
    );
  }
}

export function assertPosicaoValida(posicao: number): void {
  if (
    typeof posicao !== "number" ||
    !Number.isInteger(posicao) ||
    posicao < 1 ||
    posicao > LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO
  ) {
    throw new DadosInvalidosError(
      `posicao promocional deve ser inteiro entre 1 e ${LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO}.`,
    );
  }
}

/** Soma meses corridos preservando horário local do instante base. */
export function adicionarMesesCorridos(base: Date, meses: number): Date {
  const resultado = new Date(base.getTime());
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
