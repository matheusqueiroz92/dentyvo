import type { Paciente } from "../../domain/Paciente";

export interface PacienteRepositoryPort {
  salvar(paciente: Paciente): Promise<void>;
  /** Escopado por tenant — nunca retornar paciente de outra clínica. */
  buscarPorId(clinicaId: string, pacienteId: string): Promise<Paciente | null>;
  /** Identidade no tenant — usado pelo canal público (casar por CPF). */
  buscarPorCpf(clinicaId: string, cpf: string): Promise<Paciente | null>;
  listarPorClinica(clinicaId: string): Promise<Paciente[]>;
}
