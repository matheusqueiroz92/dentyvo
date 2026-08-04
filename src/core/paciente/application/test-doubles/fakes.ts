import type { Paciente } from "../../domain/Paciente";
import type { PacienteRepositoryPort } from "../ports/PacienteRepositoryPort";

export class FakePacienteRepository implements PacienteRepositoryPort {
  readonly items = new Map<string, Paciente>();

  async salvar(paciente: Paciente): Promise<void> {
    this.items.set(paciente.id, paciente);
  }

  async buscarPorId(
    clinicaId: string,
    pacienteId: string,
  ): Promise<Paciente | null> {
    const encontrado = this.items.get(pacienteId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async buscarPorCpf(
    clinicaId: string,
    cpf: string,
  ): Promise<Paciente | null> {
    const digitos = cpf.replace(/\D/g, "");
    return (
      [...this.items.values()].find(
        (p) => p.clinicaId === clinicaId && p.cpf.valor === digitos,
      ) ?? null
    );
  }

  async listarPorClinica(clinicaId: string): Promise<Paciente[]> {
    return [...this.items.values()].filter((p) => p.clinicaId === clinicaId);
  }
}

export const CPF_VALIDO_PACIENTE = "39053344705";
