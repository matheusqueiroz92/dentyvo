import { FakePacienteRepository } from "@/core/paciente/application/test-doubles/fakes";
import { Paciente } from "@/core/paciente/domain/Paciente";

import type { AuditoriaLog } from "../../domain/AuditoriaLog";
import { Evolucao } from "../../domain/Evolucao";
import { EvolucaoJaRetificadaError } from "../../domain/errors";
import { Prontuario } from "../../domain/Prontuario";
import type { AuditoriaLogPort } from "../ports/AuditoriaLogPort";
import type { EvolucaoRepositoryPort } from "../ports/EvolucaoRepositoryPort";
import type { ProntuarioRepositoryPort } from "../ports/ProntuarioRepositoryPort";

/** Reexport do fake da feature 002 — não redefinir PacienteRepositoryPort. */
export { FakePacienteRepository };

export class FakeProntuarioRepository implements ProntuarioRepositoryPort {
  readonly items = new Map<string, Prontuario>();

  async salvar(prontuario: Prontuario): Promise<void> {
    this.items.set(prontuario.id, prontuario);
  }

  async buscarPorId(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Prontuario | null> {
    const encontrado = this.items.get(prontuarioId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async buscarPorPacienteId(
    clinicaId: string,
    pacienteId: string,
  ): Promise<Prontuario | null> {
    return (
      [...this.items.values()].find(
        (p) => p.clinicaId === clinicaId && p.pacienteId === pacienteId,
      ) ?? null
    );
  }
}

export class FakeEvolucaoRepository implements EvolucaoRepositoryPort {
  readonly items = new Map<string, Evolucao>();

  async salvar(evolucao: Evolucao): Promise<void> {
    if (evolucao.evolucaoRetificadaId != null) {
      const existente = [...this.items.values()].find(
        (e) =>
          e.clinicaId === evolucao.clinicaId &&
          e.evolucaoRetificadaId === evolucao.evolucaoRetificadaId,
      );
      if (existente && existente.id !== evolucao.id) {
        throw new EvolucaoJaRetificadaError(evolucao.evolucaoRetificadaId);
      }
    }
    this.items.set(evolucao.id, evolucao);
  }

  async buscarPorId(
    clinicaId: string,
    evolucaoId: string,
  ): Promise<Evolucao | null> {
    const encontrado = this.items.get(evolucaoId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Evolucao[]> {
    return [...this.items.values()].filter(
      (e) => e.clinicaId === clinicaId && e.prontuarioId === prontuarioId,
    );
  }

  async buscarRetificacaoPorOriginal(
    clinicaId: string,
    evolucaoOriginalId: string,
  ): Promise<Evolucao | null> {
    return (
      [...this.items.values()].find(
        (e) =>
          e.clinicaId === clinicaId &&
          e.evolucaoRetificadaId === evolucaoOriginalId,
      ) ?? null
    );
  }
}

export class FakeAuditoriaLogPort implements AuditoriaLogPort {
  readonly eventos: AuditoriaLog[] = [];

  async registrar(evento: AuditoriaLog): Promise<void> {
    this.eventos.push(evento);
  }
}

export const CPF_VALIDO_PACIENTE = "39053344705";

export function criarPacienteFake(input?: {
  id?: string;
  clinicaId?: string;
}): Paciente {
  return Paciente.criar({
    id: input?.id ?? "pac-1",
    clinicaId: input?.clinicaId ?? "clinica-1",
    nome: "Ana Paciente",
    cpf: CPF_VALIDO_PACIENTE,
    telefone: "77999998888",
    dataNascimento: new Date("1990-05-15T12:00:00.000Z"),
  });
}
