import {
  SnapshotCabecalhoDocumento,
  type SnapshotCabecalhoDocumentoProps,
} from "@/core/shared/SnapshotCabecalhoDocumento";
import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { Cid } from "./Cid";
import { MotivoAtestadoInvalidoError } from "./errors";
import { PeriodoAfastamento } from "./PeriodoAfastamento";

export type AtestadoProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  motivo: string;
  cid: string | null;
  dataInicio: Date;
  quantidadeDias: number;
  dataFim: Date;
  cabecalho: SnapshotCabecalhoDocumento;
  emitidaEm: Date;
  /** Nullable — assinatura digital fora do MVP (v2). */
  assinaturaDigitalId: string | null;
};

/**
 * Atestado odontológico imutável após emissão (spec 006b).
 * Sem lista de itens. Correção = nova emissão.
 * PDF usa o snapshot persistido, não cadastro ao vivo.
 */
export class Atestado {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly profissionalId: string;
  readonly motivo: string;
  readonly cid: string | null;
  readonly dataInicio: Date;
  readonly quantidadeDias: number;
  readonly dataFim: Date;
  readonly cabecalho: SnapshotCabecalhoDocumento;
  readonly emitidaEm: Date;
  readonly assinaturaDigitalId: string | null;

  private constructor(props: AtestadoProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.profissionalId = props.profissionalId;
    this.motivo = props.motivo;
    this.cid = props.cid;
    this.dataInicio = props.dataInicio;
    this.quantidadeDias = props.quantidadeDias;
    this.dataFim = props.dataFim;
    this.cabecalho = props.cabecalho;
    this.emitidaEm = props.emitidaEm;
    this.assinaturaDigitalId = props.assinaturaDigitalId;
  }

  /**
   * Emite atestado com snapshot, motivo, CID opcional e período estruturado.
   * `profissionalId` deve ser o da sessão (nunca id arbitrário do cliente).
   * `dataFim` é calculada (inclusiva) — não vem do input.
   * MVP: `assinaturaDigitalId` sempre null.
   */
  static emitir(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    motivo: string;
    cid?: string | null;
    dataInicio: Date;
    quantidadeDias: number;
    cabecalho: SnapshotCabecalhoDocumentoProps | SnapshotCabecalhoDocumento;
    emitidaEm?: Date;
  }): Atestado {
    const motivo = input.motivo.trim();
    if (!motivo) {
      throw new MotivoAtestadoInvalidoError();
    }

    const cid = Cid.parseOpcional(input.cid);
    const periodo = PeriodoAfastamento.criar(
      input.dataInicio,
      input.quantidadeDias,
    );

    const emitidaEm = input.emitidaEm ?? new Date();
    assertDataValida(emitidaEm, "emitidaEm");

    const cabecalho =
      input.cabecalho instanceof SnapshotCabecalhoDocumento
        ? input.cabecalho
        : SnapshotCabecalhoDocumento.criar(input.cabecalho);

    return new Atestado({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      profissionalId: assertCampo(input.profissionalId, "profissionalId"),
      motivo,
      cid: cid?.codigo ?? null,
      dataInicio: periodo.dataInicio,
      quantidadeDias: periodo.quantidadeDias,
      dataFim: periodo.dataFim,
      cabecalho,
      emitidaEm,
      assinaturaDigitalId: null,
    });
  }

  static reconstituir(props: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    motivo: string;
    cid: string | null;
    dataInicio: Date;
    quantidadeDias: number;
    dataFim: Date;
    cabecalho: SnapshotCabecalhoDocumentoProps | SnapshotCabecalhoDocumento;
    emitidaEm: Date;
    assinaturaDigitalId?: string | null;
  }): Atestado {
    const cabecalho =
      props.cabecalho instanceof SnapshotCabecalhoDocumento
        ? props.cabecalho
        : SnapshotCabecalhoDocumento.reconstituir(props.cabecalho);

    return new Atestado({
      id: props.id,
      clinicaId: props.clinicaId,
      prontuarioId: props.prontuarioId,
      profissionalId: props.profissionalId,
      motivo: props.motivo,
      cid: props.cid,
      dataInicio: props.dataInicio,
      quantidadeDias: props.quantidadeDias,
      dataFim: props.dataFim,
      cabecalho,
      emitidaEm: props.emitidaEm,
      assinaturaDigitalId: props.assinaturaDigitalId ?? null,
    });
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} do atestado é obrigatório.`);
  }
  return trimmed;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
