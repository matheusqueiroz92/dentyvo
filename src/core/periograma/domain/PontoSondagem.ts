import { DadosInvalidosError } from "@/core/shared/errors";

import {
  LadoSondagemInvalidoError,
  PosicaoSondagemInvalidaError,
} from "./errors";

export const LADOS_SONDAGEM = ["vestibular", "palatina_lingual"] as const;
export type LadoSondagem = (typeof LADOS_SONDAGEM)[number];

export const POSICOES_SONDAGEM = ["mesial", "central", "distal"] as const;
export type PosicaoSondagem = (typeof POSICOES_SONDAGEM)[number];

export type PontoSondagemProps = {
  lado: LadoSondagem;
  posicao: PosicaoSondagem;
  /** Pode ser negativo (recessão). */
  margemGengival: number | null;
  profundidadeSondagem: number | null;
  placa: boolean | null;
  sangramentoSondagem: boolean | null;
};

/**
 * Ponto de sondagem periodontal (spec 005).
 * Até 6 por dente (3 vestibular + 3 palatina/lingual).
 * Todos os campos de medição são opcionais (preenchimento parcial).
 */
export class PontoSondagem {
  readonly lado: LadoSondagem;
  readonly posicao: PosicaoSondagem;
  readonly margemGengival: number | null;
  readonly profundidadeSondagem: number | null;
  readonly placa: boolean | null;
  readonly sangramentoSondagem: boolean | null;

  private constructor(props: PontoSondagemProps) {
    this.lado = props.lado;
    this.posicao = props.posicao;
    this.margemGengival = props.margemGengival;
    this.profundidadeSondagem = props.profundidadeSondagem;
    this.placa = props.placa;
    this.sangramentoSondagem = props.sangramentoSondagem;
  }

  static criar(input: {
    lado: string;
    posicao: string;
    margemGengival?: number | null;
    profundidadeSondagem?: number | null;
    placa?: boolean | null;
    sangramentoSondagem?: boolean | null;
  }): PontoSondagem {
    return new PontoSondagem({
      lado: assertLado(input.lado),
      posicao: assertPosicao(input.posicao),
      margemGengival: assertInteiroOpcional(
        input.margemGengival,
        "margemGengival",
        { permiteNegativo: true },
      ),
      profundidadeSondagem: assertInteiroOpcional(
        input.profundidadeSondagem,
        "profundidadeSondagem",
        { permiteNegativo: false },
      ),
      placa: assertBooleanoOpcional(input.placa, "placa"),
      sangramentoSondagem: assertBooleanoOpcional(
        input.sangramentoSondagem,
        "sangramentoSondagem",
      ),
    });
  }

  static reconstituir(props: PontoSondagemProps): PontoSondagem {
    return new PontoSondagem(props);
  }

  get chave(): string {
    return `${this.lado}:${this.posicao}`;
  }

  paraProps(): PontoSondagemProps {
    return {
      lado: this.lado,
      posicao: this.posicao,
      margemGengival: this.margemGengival,
      profundidadeSondagem: this.profundidadeSondagem,
      placa: this.placa,
      sangramentoSondagem: this.sangramentoSondagem,
    };
  }
}

function assertLado(lado: string): LadoSondagem {
  if ((LADOS_SONDAGEM as readonly string[]).includes(lado)) {
    return lado as LadoSondagem;
  }
  throw new LadoSondagemInvalidoError(lado);
}

function assertPosicao(posicao: string): PosicaoSondagem {
  if ((POSICOES_SONDAGEM as readonly string[]).includes(posicao)) {
    return posicao as PosicaoSondagem;
  }
  throw new PosicaoSondagemInvalidaError(posicao);
}

function assertInteiroOpcional(
  valor: number | null | undefined,
  campo: string,
  opcoes: { permiteNegativo: boolean },
): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  if (!Number.isInteger(valor)) {
    throw new DadosInvalidosError(`${campo} deve ser um inteiro.`);
  }
  if (!opcoes.permiteNegativo && valor < 0) {
    throw new DadosInvalidosError(`${campo} não pode ser negativo.`);
  }
  return valor;
}

function assertBooleanoOpcional(
  valor: boolean | null | undefined,
  campo: string,
): boolean | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  if (typeof valor !== "boolean") {
    throw new DadosInvalidosError(`${campo} deve ser booleano.`);
  }
  return valor;
}
