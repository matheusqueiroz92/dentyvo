import type { Convite } from "../../domain/Convite";

export interface ConviteRepositoryPort {
  salvar(convite: Convite): Promise<void>;
  buscarPorToken(token: string): Promise<Convite | null>;
  buscarPendentePorEmailEClinica(
    clinicaId: string,
    email: string,
  ): Promise<Convite | null>;
  /** Convites ainda não aceitos da clínica (pendentes ou expirados). */
  listarPendentesPorClinica(clinicaId: string): Promise<Convite[]>;
}
