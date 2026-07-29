import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { ReceitaSemItensError } from "./errors";
import { ItemReceita, type ItemReceitaProps } from "./ItemReceita";
import {
  SnapshotCabecalhoReceita,
  type SnapshotCabecalhoReceitaProps,
} from "./SnapshotCabecalhoReceita";

export type ReceitaProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  itens: ItemReceita[];
  cabecalho: SnapshotCabecalhoReceita;
  emitidaEm: Date;
  /** Nullable — assinatura digital fora do MVP (v2). */
  assinaturaDigitalId: string | null;
};

/**
 * Receita odontológica imutável após emissão (spec 006).
 * Correção = nova emissão; PDF usa o snapshot persistido, não cadastro ao vivo.
 */
export class Receita {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly profissionalId: string;
  readonly itens: readonly ItemReceita[];
  readonly cabecalho: SnapshotCabecalhoReceita;
  readonly emitidaEm: Date;
  readonly assinaturaDigitalId: string | null;

  private constructor(props: ReceitaProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.profissionalId = props.profissionalId;
    this.itens = props.itens;
    this.cabecalho = props.cabecalho;
    this.emitidaEm = props.emitidaEm;
    this.assinaturaDigitalId = props.assinaturaDigitalId;
  }

  /**
   * Emite receita com snapshot de cabeçalho e itens.
   * `profissionalId` deve ser o da sessão (nunca id arbitrário do cliente).
   * MVP: `assinaturaDigitalId` sempre null.
   */
  static emitir(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    itens: ItemReceitaProps[];
    cabecalho: SnapshotCabecalhoReceitaProps | SnapshotCabecalhoReceita;
    emitidaEm?: Date;
  }): Receita {
    if (!input.itens.length) {
      throw new ReceitaSemItensError();
    }

    const emitidaEm = input.emitidaEm ?? new Date();
    assertDataValida(emitidaEm, "emitidaEm");

    const cabecalho =
      input.cabecalho instanceof SnapshotCabecalhoReceita
        ? input.cabecalho
        : SnapshotCabecalhoReceita.criar(input.cabecalho);

    return new Receita({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      profissionalId: assertCampo(input.profissionalId, "profissionalId"),
      itens: input.itens.map((item) => ItemReceita.criar(item)),
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
    itens: ItemReceitaProps[] | ItemReceita[];
    cabecalho: SnapshotCabecalhoReceitaProps | SnapshotCabecalhoReceita;
    emitidaEm: Date;
    assinaturaDigitalId?: string | null;
  }): Receita {
    const itens = props.itens.map((item) =>
      item instanceof ItemReceita ? item : ItemReceita.reconstituir(item),
    );
    const cabecalho =
      props.cabecalho instanceof SnapshotCabecalhoReceita
        ? props.cabecalho
        : SnapshotCabecalhoReceita.reconstituir(props.cabecalho);

    return new Receita({
      id: props.id,
      clinicaId: props.clinicaId,
      prontuarioId: props.prontuarioId,
      profissionalId: props.profissionalId,
      itens,
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
    throw new DadosInvalidosError(`${campo} da receita é obrigatório.`);
  }
  return trimmed;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
