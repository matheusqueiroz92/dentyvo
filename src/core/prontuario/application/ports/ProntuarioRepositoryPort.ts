import type { Prontuario } from "../../domain/Prontuario";

/** Persistência de prontuários — sempre escopada por `clinicaId` (spec 003). */
export interface ProntuarioRepositoryPort {
  salvar(prontuario: Prontuario): Promise<void>;

  buscarPorId(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Prontuario | null>;

  /** Unicidade paciente+clínica. */
  buscarPorPacienteId(
    clinicaId: string,
    pacienteId: string,
  ): Promise<Prontuario | null>;
}
