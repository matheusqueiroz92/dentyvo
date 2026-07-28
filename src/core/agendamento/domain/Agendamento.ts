import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { calcularDataHoraFim } from "./duracao";
import {
  SobreposicaoHorarioError,
  TransicaoStatusInvalidaError,
} from "./errors";
import { intervalosSobrepoem } from "./intervalo";
import {
  ocupaSlot,
  type OrigemAgendamento,
  ORIGENS_AGENDAMENTO,
  type StatusAgendamento,
} from "./StatusAgendamento";

export type AgendamentoProps = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
  status: StatusAgendamento;
  origem: OrigemAgendamento;
  motivoCancelamento: string | null;
};

export class Agendamento {
  readonly id: string;
  readonly clinicaId: string;
  readonly pacienteId: string;
  readonly profissionalId: string;
  readonly procedimentoId: string;
  readonly dataHoraInicio: Date;
  readonly dataHoraFim: Date;
  readonly status: StatusAgendamento;
  readonly origem: OrigemAgendamento;
  readonly motivoCancelamento: string | null;

  private constructor(props: AgendamentoProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.pacienteId = props.pacienteId;
    this.profissionalId = props.profissionalId;
    this.procedimentoId = props.procedimentoId;
    this.dataHoraInicio = props.dataHoraInicio;
    this.dataHoraFim = props.dataHoraFim;
    this.status = props.status;
    this.origem = props.origem;
    this.motivoCancelamento = props.motivoCancelamento;
  }

  /** Cria agendamento novo em status `pendente`. */
  static criar(input: {
    id: string;
    clinicaId: string;
    pacienteId: string;
    profissionalId: string;
    procedimentoId: string;
    dataHoraInicio: Date;
    duracaoMinutos: number;
    origem: OrigemAgendamento;
  }): Agendamento {
    assertOrigem(input.origem);
    assertDataValida(input.dataHoraInicio, "dataHoraInicio");
    const dataHoraFim = calcularDataHoraFim(
      input.dataHoraInicio,
      input.duracaoMinutos,
    );

    return new Agendamento({
      id: input.id,
      clinicaId: input.clinicaId,
      pacienteId: input.pacienteId,
      profissionalId: input.profissionalId,
      procedimentoId: input.procedimentoId,
      dataHoraInicio: input.dataHoraInicio,
      dataHoraFim,
      status: "pendente",
      origem: input.origem,
      motivoCancelamento: null,
    });
  }

  static reconstituir(props: AgendamentoProps): Agendamento {
    return new Agendamento(props);
  }

  ocupaSlot(): boolean {
    return ocupaSlot(this.status);
  }

  /**
   * Sobreposição half-open com outro agendamento do mesmo profissional,
   * apenas se ambos ocupam slot.
   */
  sobrepoe(outro: Agendamento): boolean {
    if (this.profissionalId !== outro.profissionalId) {
      return false;
    }
    if (!this.ocupaSlot() || !outro.ocupaSlot()) {
      return false;
    }
    return intervalosSobrepoem(
      this.dataHoraInicio,
      this.dataHoraFim,
      outro.dataHoraInicio,
      outro.dataHoraFim,
    );
  }

  /**
   * Lança se algum agendamento existente (que ocupa slot) conflitar.
   * Ignora o próprio id (útil em remarcação).
   */
  assertSemSobreposicaoCom(
    existentes: readonly Agendamento[],
  ): void {
    for (const outro of existentes) {
      if (outro.id === this.id) continue;
      if (this.sobrepoe(outro)) {
        throw new SobreposicaoHorarioError(
          this.profissionalId,
          this.dataHoraInicio,
          this.dataHoraFim,
        );
      }
    }
  }

  confirmar(): Agendamento {
    if (this.status !== "pendente") {
      throw new TransicaoStatusInvalidaError(this.status, "confirmado");
    }
    return Agendamento.reconstituir({
      ...this.toProps(),
      status: "confirmado",
    });
  }

  cancelar(motivo?: string | null): Agendamento {
    if (this.status === "cancelado") {
      throw new TransicaoStatusInvalidaError(this.status, "cancelado");
    }
    if (this.status === "realizado" || this.status === "faltou") {
      throw new TransicaoStatusInvalidaError(this.status, "cancelado");
    }
    const motivoCancelamento =
      motivo == null || motivo.trim() === "" ? null : motivo.trim();

    return Agendamento.reconstituir({
      ...this.toProps(),
      status: "cancelado",
      motivoCancelamento,
    });
  }

  /**
   * Remarca mantendo ids/origem/status (se ainda ocupa slot).
   * Só permitido a partir de `pendente` ou `confirmado`.
   */
  remarcar(novaDataHoraInicio: Date, duracaoMinutos: number): Agendamento {
    if (!this.ocupaSlot()) {
      throw new TransicaoStatusInvalidaError(this.status, this.status);
    }
    assertDataValida(novaDataHoraInicio, "novaDataHoraInicio");
    const dataHoraFim = calcularDataHoraFim(novaDataHoraInicio, duracaoMinutos);

    return Agendamento.reconstituir({
      ...this.toProps(),
      dataHoraInicio: novaDataHoraInicio,
      dataHoraFim,
      motivoCancelamento: null,
    });
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  private toProps(): AgendamentoProps {
    return {
      id: this.id,
      clinicaId: this.clinicaId,
      pacienteId: this.pacienteId,
      profissionalId: this.profissionalId,
      procedimentoId: this.procedimentoId,
      dataHoraInicio: this.dataHoraInicio,
      dataHoraFim: this.dataHoraFim,
      status: this.status,
      origem: this.origem,
      motivoCancelamento: this.motivoCancelamento,
    };
  }
}

function assertOrigem(origem: string): asserts origem is OrigemAgendamento {
  if (!(ORIGENS_AGENDAMENTO as readonly string[]).includes(origem)) {
    throw new DadosInvalidosError(`Origem de agendamento inválida: ${origem}`);
  }
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
