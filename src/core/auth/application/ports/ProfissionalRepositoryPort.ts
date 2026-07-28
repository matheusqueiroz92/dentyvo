import type { Profissional } from "../../domain/Profissional";

export interface ProfissionalRepositoryPort {
  salvar(profissional: Profissional): Promise<void>;
  /** Escopado por tenant — nunca retornar membro de outra clínica. */
  buscarPorId(
    clinicaId: string,
    profissionalId: string,
  ): Promise<Profissional | null>;
  buscarPorUsuarioId(usuarioId: string): Promise<Profissional | null>;
  listarPorClinica(clinicaId: string): Promise<Profissional[]>;
  remover(clinicaId: string, profissionalId: string): Promise<void>;
}
