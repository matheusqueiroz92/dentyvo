import { NumeroDente } from "@/core/odontograma/domain/NumeroDente";
import { DadosInvalidosError } from "@/core/shared/errors";

import {
  ClassificacaoFurca,
  type ClassificacaoFurcaProps,
} from "./ClassificacaoFurca";
import {
  FurcaNaoAplicavelAoDenteError,
  MobilidadeMillerInvalidaError,
  PontosSondagemExcedentesError,
  PontoSondagemDuplicadoError,
} from "./errors";
import { PontoSondagem, type PontoSondagemProps } from "./PontoSondagem";

/** Molares permanentes FDI (multirradiculares — furca aplicável). */
const MOLARES_PERMANENTES = new Set([
  16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48,
]);

/** Molares decíduos FDI (multirradiculares — furca aplicável). */
const MOLARES_DECIDUOS = new Set([54, 55, 64, 65, 74, 75, 84, 85]);

export type DentePeriogramaProps = {
  numeroDente: number;
  /** Escala de Miller: 0–3; null = não avaliado. */
  mobilidade: number | null;
  implante: boolean | null;
  /**
   * Uma classificação por dente (MVP — sem face/sítio).
   * null = sem avaliação de furca naquele dente.
   */
  classificacaoFurca: ClassificacaoFurcaProps | null;
  nota: string | null;
  pontos: PontoSondagemProps[];
};

export type DentePeriogramaCriarInput = {
  numeroDente: number;
  mobilidade?: number | null;
  implante?: boolean | null;
  classificacaoFurca?: ClassificacaoFurcaProps | ClassificacaoFurca | null;
  nota?: string | null;
  pontos?: Array<
    | PontoSondagem
    | {
        lado: string;
        posicao: string;
        margemGengival?: number | null;
        profundidadeSondagem?: number | null;
        placa?: boolean | null;
        sangramentoSondagem?: boolean | null;
      }
  >;
};

/**
 * Avaliações periodontais no nível do dente (spec 005).
 * Preenchimento parcial permitido; até 6 pontos de sondagem.
 */
export class DentePeriograma {
  readonly numeroDente: NumeroDente;
  readonly mobilidade: number | null;
  readonly implante: boolean | null;
  readonly classificacaoFurca: ClassificacaoFurca | null;
  readonly nota: string | null;
  readonly pontos: readonly PontoSondagem[];

  private constructor(props: {
    numeroDente: NumeroDente;
    mobilidade: number | null;
    implante: boolean | null;
    classificacaoFurca: ClassificacaoFurca | null;
    nota: string | null;
    pontos: readonly PontoSondagem[];
  }) {
    this.numeroDente = props.numeroDente;
    this.mobilidade = props.mobilidade;
    this.implante = props.implante;
    this.classificacaoFurca = props.classificacaoFurca;
    this.nota = props.nota;
    this.pontos = props.pontos;
  }

  static criar(input: DentePeriogramaCriarInput): DentePeriograma {
    const numeroDente = NumeroDente.criar(input.numeroDente);
    const mobilidade = assertMobilidadeMiller(input.mobilidade);
    const implante = assertBooleanoOpcional(input.implante, "implante");
    const classificacaoFurca = assertFurcaParaDente(
      numeroDente.valor,
      input.classificacaoFurca,
    );
    const pontos = normalizarPontos(input.pontos ?? []);

    return new DentePeriograma({
      numeroDente,
      mobilidade,
      implante,
      classificacaoFurca,
      nota: normalizarNota(input.nota),
      pontos,
    });
  }

  static reconstituir(props: {
    numeroDente: number | NumeroDente;
    mobilidade: number | null;
    implante: boolean | null;
    classificacaoFurca: ClassificacaoFurcaProps | ClassificacaoFurca | null;
    nota: string | null;
    pontos: Array<PontoSondagemProps | PontoSondagem>;
  }): DentePeriograma {
    const numeroDente =
      props.numeroDente instanceof NumeroDente
        ? props.numeroDente
        : NumeroDente.criar(props.numeroDente);

    const classificacaoFurca =
      props.classificacaoFurca === null || props.classificacaoFurca === undefined
        ? null
        : props.classificacaoFurca instanceof ClassificacaoFurca
          ? props.classificacaoFurca
          : ClassificacaoFurca.reconstituir(props.classificacaoFurca);

    const pontos = props.pontos.map((p) =>
      p instanceof PontoSondagem ? p : PontoSondagem.reconstituir(p),
    );

    return new DentePeriograma({
      numeroDente,
      mobilidade: props.mobilidade,
      implante: props.implante,
      classificacaoFurca,
      nota: props.nota,
      pontos,
    });
  }

  get numeroDenteValor(): number {
    return this.numeroDente.valor;
  }

  paraProps(): DentePeriogramaProps {
    return {
      numeroDente: this.numeroDente.valor,
      mobilidade: this.mobilidade,
      implante: this.implante,
      classificacaoFurca: this.classificacaoFurca?.paraProps() ?? null,
      nota: this.nota,
      pontos: this.pontos.map((p) => p.paraProps()),
    };
  }
}

/** Indica se o FDI é molar (único elegível a furca no MVP). */
export function ehDenteMultirradicular(numeroDente: number): boolean {
  return (
    MOLARES_PERMANENTES.has(numeroDente) || MOLARES_DECIDUOS.has(numeroDente)
  );
}

function assertMobilidadeMiller(
  grau: number | null | undefined,
): number | null {
  if (grau === null || grau === undefined) {
    return null;
  }
  if (!Number.isInteger(grau) || grau < 0 || grau > 3) {
    throw new MobilidadeMillerInvalidaError(grau);
  }
  return grau;
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

function assertFurcaParaDente(
  numeroDente: number,
  furca:
    | ClassificacaoFurcaProps
    | ClassificacaoFurca
    | null
    | undefined,
): ClassificacaoFurca | null {
  if (furca === null || furca === undefined) {
    return null;
  }

  if (!ehDenteMultirradicular(numeroDente)) {
    throw new FurcaNaoAplicavelAoDenteError(numeroDente);
  }

  return furca instanceof ClassificacaoFurca
    ? furca
    : ClassificacaoFurca.criar(furca);
}

function normalizarPontos(
  pontos: DentePeriogramaCriarInput["pontos"],
): PontoSondagem[] {
  const lista = pontos ?? [];
  if (lista.length > 6) {
    throw new PontosSondagemExcedentesError(lista.length);
  }

  const vistos = new Set<string>();
  const resultado: PontoSondagem[] = [];

  for (const ponto of lista) {
    const criado =
      ponto instanceof PontoSondagem ? ponto : PontoSondagem.criar(ponto);
    if (vistos.has(criado.chave)) {
      throw new PontoSondagemDuplicadoError(criado.lado, criado.posicao);
    }
    vistos.add(criado.chave);
    resultado.push(criado);
  }

  return resultado;
}

function normalizarNota(nota: string | null | undefined): string | null {
  if (nota === null || nota === undefined) {
    return null;
  }
  const trimmed = nota.trim();
  return trimmed.length > 0 ? trimmed : null;
}
