import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

export type ProntuarioProps = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  criadoEm: Date;
};

/**
 * Registro clínico único do paciente na clínica (spec 003).
 * Evoluções e anamnese vivem em entidades/agregados relacionados.
 */
export class Prontuario {
  readonly id: string;
  readonly clinicaId: string;
  readonly pacienteId: string;
  readonly criadoEm: Date;

  private constructor(props: ProntuarioProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.pacienteId = props.pacienteId;
    this.criadoEm = props.criadoEm;
  }

  static criar(input: {
    id: string;
    clinicaId: string;
    pacienteId: string;
    criadoEm?: Date;
  }): Prontuario {
    if (!input.id.trim()) {
      throw new DadosInvalidosError("Id do prontuário é obrigatório.");
    }
    if (!input.clinicaId.trim()) {
      throw new DadosInvalidosError("clinicaId do prontuário é obrigatório.");
    }
    if (!input.pacienteId.trim()) {
      throw new DadosInvalidosError("pacienteId do prontuário é obrigatório.");
    }

    const criadoEm = input.criadoEm ?? new Date();
    assertDataValida(criadoEm, "criadoEm");

    return new Prontuario({
      id: input.id,
      clinicaId: input.clinicaId,
      pacienteId: input.pacienteId,
      criadoEm,
    });
  }

  static reconstituir(props: ProntuarioProps): Prontuario {
    return new Prontuario(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
