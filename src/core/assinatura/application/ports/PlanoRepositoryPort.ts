import type { Plano } from "../../domain/Plano";

export interface PlanoRepositoryPort {
  salvar(plano: Plano): Promise<void>;
  buscarPorId(id: string): Promise<Plano | null>;
  listarAtivos(): Promise<Plano[]>;
}
