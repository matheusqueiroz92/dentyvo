import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import {
  DentePeriograma,
  type DentePeriogramaCriarInput,
  type DentePeriogramaProps,
} from "./DentePeriograma";
import { TipoPeriogramaInvalidoError } from "./errors";

export const TIPOS_PERIOGRAMA = ["exame_inicial", "reavaliacao"] as const;
export type TipoPeriograma = (typeof TIPOS_PERIOGRAMA)[number];

export type PeriogramaProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  tipo: TipoPeriograma;
  registradoEm: Date;
  dentes: DentePeriograma[];
};

/**
 * Exame periodontal imutável após persistido (spec 005).
 * Correção / acompanhamento = novo exame com `tipo: reavaliacao`
 * (mesmo espírito de Evolucao/003 e Receita/006).
 *
 * Métricas agregadas (médias, % placa/sangramento, nível de inserção)
 * **não** fazem parte desta entidade — calculadas sob demanda na UI.
 */
export class Periograma {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly profissionalId: string;
  readonly tipo: TipoPeriograma;
  readonly registradoEm: Date;
  readonly dentes: readonly DentePeriograma[];

  private constructor(props: PeriogramaProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.profissionalId = props.profissionalId;
    this.tipo = props.tipo;
    this.registradoEm = props.registradoEm;
    this.dentes = props.dentes;
  }

  /**
   * Registra novo periograma.
   * `profissionalId` deve ser o da sessão (nunca id arbitrário do cliente).
   */
  static registrar(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    tipo: string;
    dentes?: DentePeriogramaCriarInput[];
    registradoEm?: Date;
  }): Periograma {
    const registradoEm = input.registradoEm ?? new Date();
    assertDataValida(registradoEm, "registradoEm");

    return new Periograma({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      profissionalId: assertCampo(input.profissionalId, "profissionalId"),
      tipo: assertTipo(input.tipo),
      registradoEm,
      dentes: (input.dentes ?? []).map((d) => DentePeriograma.criar(d)),
    });
  }

  static reconstituir(props: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    tipo: TipoPeriograma;
    registradoEm: Date;
    dentes: Array<DentePeriogramaProps | DentePeriograma>;
  }): Periograma {
    const dentes = props.dentes.map((d) =>
      d instanceof DentePeriograma ? d : DentePeriograma.reconstituir(d),
    );

    return new Periograma({
      id: props.id,
      clinicaId: props.clinicaId,
      prontuarioId: props.prontuarioId,
      profissionalId: props.profissionalId,
      tipo: props.tipo,
      registradoEm: props.registradoEm,
      dentes,
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
    throw new DadosInvalidosError(`${campo} do periograma é obrigatório.`);
  }
  return trimmed;
}

function assertTipo(tipo: string): TipoPeriograma {
  if ((TIPOS_PERIOGRAMA as readonly string[]).includes(tipo)) {
    return tipo as TipoPeriograma;
  }
  throw new TipoPeriogramaInvalidoError(tipo);
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
