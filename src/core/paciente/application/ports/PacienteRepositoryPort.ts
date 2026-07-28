import type { Paciente } from "../../domain/Paciente";

export interface PacienteRepositoryPort {
  salvar(paciente: Paciente): Promise<void>;
  /** Escopado por tenant — nunca retornar paciente de outra clínica. */
  buscarPorId(clinicaId: string, pacienteId: string): Promise<Paciente | null>;
  listarPorClinica(clinicaId: string): Promise<Paciente[]>;
}
