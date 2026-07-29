import {
  GrauForaDoSistemaError,
  SistemaFurcaInvalidoError,
} from "./errors";

export const SISTEMAS_FURCA = ["hamp", "glickman"] as const;
export type SistemaFurca = (typeof SISTEMAS_FURCA)[number];

export type ClassificacaoFurcaProps = {
  sistema: SistemaFurca;
  grau: number;
};

/**
 * Classificação de envolvimento de furca (spec 005).
 *
 * Dois sistemas clinicamente distintos e **não comparáveis** entre si
 * (Hamp grau II ≠ Glickman grau II). O profissional escolhe o sistema
 * livremente no registro; misturar sistemas no mesmo periograma é permitido.
 *
 * ---
 * **Hamp** — uso rotineiro (3 graus). Critério objetivo de profundidade
 * horizontal de sondagem:
 * - Grau I: perda horizontal; sonda penetra até 3 mm
 * - Grau II: perda horizontal; sonda penetra mais de 3 mm
 * - Grau III: destruição horizontal de lado a lado (comunicação total)
 *
 * **Glickman** — periodontite aguda (4 graus). Inclui fatores
 * anatômicos/radiográficos e visibilidade clínica:
 * - Grau I: início da perda óssea
 * - Grau II: perda parcial
 * - Grau III: comunicação total entre as furcas
 * - Grau IV: recessão gengival com furca totalmente visível
 *
 * MVP: uma classificação por dente (sem granularidade por face/sítio).
 */
export class ClassificacaoFurca {
  readonly sistema: SistemaFurca;
  readonly grau: number;

  private constructor(props: ClassificacaoFurcaProps) {
    this.sistema = props.sistema;
    this.grau = props.grau;
  }

  static criar(input: {
    sistema: string;
    grau: number;
  }): ClassificacaoFurca {
    const sistema = assertSistema(input.sistema);
    const grau = assertGrauParaSistema(sistema, input.grau);
    return new ClassificacaoFurca({ sistema, grau });
  }

  static reconstituir(props: ClassificacaoFurcaProps): ClassificacaoFurca {
    return new ClassificacaoFurca(props);
  }

  equals(outra: ClassificacaoFurca): boolean {
    return this.sistema === outra.sistema && this.grau === outra.grau;
  }

  paraProps(): ClassificacaoFurcaProps {
    return { sistema: this.sistema, grau: this.grau };
  }
}

function assertSistema(sistema: string): SistemaFurca {
  if ((SISTEMAS_FURCA as readonly string[]).includes(sistema)) {
    return sistema as SistemaFurca;
  }
  throw new SistemaFurcaInvalidoError(sistema);
}

function assertGrauParaSistema(sistema: SistemaFurca, grau: number): number {
  if (!Number.isInteger(grau)) {
    throw new GrauForaDoSistemaError(sistema, grau);
  }

  const max = sistema === "hamp" ? 3 : 4;
  if (grau < 1 || grau > max) {
    throw new GrauForaDoSistemaError(sistema, grau);
  }

  return grau;
}
