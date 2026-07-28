import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { RetificacaoInvalidaError } from "./errors";

export const TIPOS_EVOLUCAO = ["registro", "retificacao"] as const;
export type TipoEvolucao = (typeof TIPOS_EVOLUCAO)[number];

export type EvolucaoProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  tipo: TipoEvolucao;
  descricao: string;
  registradoEm: Date;
  procedimentoId: string | null;
  evolucaoRetificadaId: string | null;
  motivoRetificacao: string | null;
};

/**
 * Registro clínico append-only (spec 003).
 * Imutável após criação: retificação = nova evolução ligada à original.
 */
export class Evolucao {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly profissionalId: string;
  readonly tipo: TipoEvolucao;
  readonly descricao: string;
  readonly registradoEm: Date;
  readonly procedimentoId: string | null;
  readonly evolucaoRetificadaId: string | null;
  readonly motivoRetificacao: string | null;

  private constructor(props: EvolucaoProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.profissionalId = props.profissionalId;
    this.tipo = props.tipo;
    this.descricao = props.descricao;
    this.registradoEm = props.registradoEm;
    this.procedimentoId = props.procedimentoId;
    this.evolucaoRetificadaId = props.evolucaoRetificadaId;
    this.motivoRetificacao = props.motivoRetificacao;
  }

  /** Cria evolução do tipo `registro` (atendimento). */
  static criarRegistro(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    descricao: string;
    procedimentoId?: string | null;
    registradoEm?: Date;
  }): Evolucao {
    const descricao = assertDescricao(input.descricao);
    const registradoEm = input.registradoEm ?? new Date();
    assertDataValida(registradoEm, "registradoEm");

    return new Evolucao({
      id: assertId(input.id, "id"),
      clinicaId: assertId(input.clinicaId, "clinicaId"),
      prontuarioId: assertId(input.prontuarioId, "prontuarioId"),
      profissionalId: assertId(input.profissionalId, "profissionalId"),
      tipo: "registro",
      descricao,
      registradoEm,
      procedimentoId: normalizarOpcional(input.procedimentoId),
      evolucaoRetificadaId: null,
      motivoRetificacao: null,
    });
  }

  /**
   * Cria retificação da evolução original.
   * MVP: só retifica `tipo: registro`; no máximo uma retificação (checagem
   * de unicidade fica no caso de uso via repositório).
   */
  static criarRetificacao(input: {
    id: string;
    original: Evolucao;
    profissionalId: string;
    descricao: string;
    motivoRetificacao: string;
    registradoEm?: Date;
  }): Evolucao {
    if (input.original.tipo !== "registro") {
      throw new RetificacaoInvalidaError(
        "Só é possível retificar uma evolução do tipo registro.",
      );
    }

    const descricao = assertDescricao(input.descricao);
    const motivo = input.motivoRetificacao.trim();
    if (!motivo) {
      throw new DadosInvalidosError("Motivo da retificação é obrigatório.");
    }

    const registradoEm = input.registradoEm ?? new Date();
    assertDataValida(registradoEm, "registradoEm");

    return new Evolucao({
      id: assertId(input.id, "id"),
      clinicaId: input.original.clinicaId,
      prontuarioId: input.original.prontuarioId,
      profissionalId: assertId(input.profissionalId, "profissionalId"),
      tipo: "retificacao",
      descricao,
      registradoEm,
      procedimentoId: null,
      evolucaoRetificadaId: input.original.id,
      motivoRetificacao: motivo,
    });
  }

  static reconstituir(props: EvolucaoProps): Evolucao {
    return new Evolucao(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  /** True se esta evolução é uma retificação de outra. */
  ehRetificacao(): boolean {
    return this.tipo === "retificacao";
  }
}

function assertId(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} da evolução é obrigatório.`);
  }
  return trimmed;
}

function assertDescricao(descricao: string): string {
  const trimmed = descricao.trim();
  if (!trimmed) {
    throw new DadosInvalidosError("Descrição da evolução é obrigatória.");
  }
  return trimmed;
}

function normalizarOpcional(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const trimmed = valor.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
