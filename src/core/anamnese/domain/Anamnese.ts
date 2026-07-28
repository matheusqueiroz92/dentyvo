import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import {
  RespostasAnamnese,
  type RespostasAnamneseProps,
} from "./RespostasAnamnese";

export type AnamneseProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  versao: number;
  respostas: RespostasAnamnese;
  preenchidoEm: Date;
  preenchidoPorProfissionalId: string;
};

/**
 * Snapshot imutável de anamnese (spec 003).
 * Atualização = nova instância com `versao` sequencial; não sobrescreve.
 */
export class Anamnese {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly versao: number;
  readonly respostas: RespostasAnamnese;
  readonly preenchidoEm: Date;
  readonly preenchidoPorProfissionalId: string;

  private constructor(props: AnamneseProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.versao = props.versao;
    this.respostas = props.respostas;
    this.preenchidoEm = props.preenchidoEm;
    this.preenchidoPorProfissionalId = props.preenchidoPorProfissionalId;
  }

  /** Primeira versão (snapshot inicial) do prontuário. */
  static criarInicial(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    respostas: RespostasAnamneseProps;
    preenchidoPorProfissionalId: string;
    preenchidoEm?: Date;
  }): Anamnese {
    return Anamnese.criarVersao({
      ...input,
      versao: 1,
    });
  }

  /**
   * Nova versão a partir da vigente (snapshot completo).
   * `versao` = vigente.versao + 1.
   */
  static criarProximaVersao(input: {
    id: string;
    vigente: Anamnese;
    respostas: RespostasAnamneseProps;
    preenchidoPorProfissionalId: string;
    preenchidoEm?: Date;
  }): Anamnese {
    return Anamnese.criarVersao({
      id: input.id,
      clinicaId: input.vigente.clinicaId,
      prontuarioId: input.vigente.prontuarioId,
      versao: input.vigente.versao + 1,
      respostas: input.respostas,
      preenchidoPorProfissionalId: input.preenchidoPorProfissionalId,
      preenchidoEm: input.preenchidoEm,
    });
  }

  static reconstituir(props: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    versao: number;
    respostas: RespostasAnamneseProps;
    preenchidoEm: Date;
    preenchidoPorProfissionalId: string;
  }): Anamnese {
    return new Anamnese({
      ...props,
      respostas:
        props.respostas instanceof RespostasAnamnese
          ? props.respostas
          : RespostasAnamnese.reconstituir(props.respostas),
    });
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  private static criarVersao(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    versao: number;
    respostas: RespostasAnamneseProps;
    preenchidoPorProfissionalId: string;
    preenchidoEm?: Date;
  }): Anamnese {
    if (!Number.isInteger(input.versao) || input.versao < 1) {
      throw new DadosInvalidosError("Versão da anamnese deve ser inteiro ≥ 1.");
    }

    const preenchidoEm = input.preenchidoEm ?? new Date();
    if (
      !(preenchidoEm instanceof Date) ||
      Number.isNaN(preenchidoEm.getTime())
    ) {
      throw new DadosInvalidosError("preenchidoEm inválida.");
    }

    return new Anamnese({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      versao: input.versao,
      respostas: RespostasAnamnese.criar(input.respostas),
      preenchidoEm,
      preenchidoPorProfissionalId: assertCampo(
        input.preenchidoPorProfissionalId,
        "preenchidoPorProfissionalId",
      ),
    });
  }
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} da anamnese é obrigatório.`);
  }
  return trimmed;
}
